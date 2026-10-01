/* ─────────────────────────────────────────────
   File: server.js
   File Version: 0.7.0
   ─────────────────────────────────────────────
   Network Meaning: the HTTP entry point. Node's built-in http server, no
   framework. Serves the one built page and a small JSON API. Under IIS,
   HttpPlatformHandler starts this process and sets PORT.

     node server.js            (reads .env if present)

   Routes (all /api/* need the session cookie except auth, login, signup):
     GET  /health
     GET  /api/auth                   who may sign up: open | code | closed
     POST /api/login  {email, password}   (a blank email is the owner)
     POST /api/signup {email, password, code?}      POST /api/logout      GET /api/me
     POST /api/me/password {current, password}      change your own password
     GET  /api/samples                the owner's own sample stream, for the owner alone
     GET  /api/admin/users            POST /api/admin/users {email, password, level?}   (admin only)
     PATCH /api/admin/users/:id {password?, disabled?, level?}                      (admin only)
     GET  /api/admin/settings         PATCH /api/admin/settings {signup, code?}        (admin only)
                                      signup: open | code | closed | server (back to the server's own setting)
   Levels: what a user does is stored; a guest can read and try things in
   the page, and every route that would store something refuses them; an
   admin is a user who can also add people and share streams.
     GET  /api/streams                yours, and the ones shared with everyone
     POST /api/streams {name, steps?} | {name, fromStreamId, atSeq}
     GET  /api/streams/:id            PATCH /api/streams/:id {name?, shared?}     DELETE /api/streams/:id
     POST /api/streams/:id/steps  {kind:"action", action, source, date}
     POST /api/streams/:id/ingest {text, source, tier, date?}
     POST /api/streams/:id/analyze {tier, date?}   help analysis: suggestions given the state of play
   date is the short label the person sees; a script may give it, else today. */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hasDatabase, query } from "./src/server/db.js";
import { migrate } from "./src/server/migrate.js";
import * as auth from "./src/server/auth.js";
import * as streams from "./src/server/streams.js";
import { ideaify, MODELS } from "./src/server/ideaify.js";
import { analyze, hasPlay, helpContext } from "./src/server/analyze.js";
import { screenCall, scrubContext, SCREEN_LIMITS } from "./src/server/screen.js";
import { OWNER_SAMPLES } from "./src/server/owner-sample.js";
import { replay, actionOk } from "./src/shared/replay.js";

const here = path.dirname(fileURLToPath(import.meta.url));
/* .env is read only when this file is the program. A test that imports
   handle() sets its own environment and must not pick up the real one. */
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) { try { process.loadEnvFile(path.join(here, ".env")); } catch { /* environment only */ } }

const PKG = JSON.parse(fs.readFileSync(path.join(here, "package.json"), "utf8"));
const PORT = parseInt(process.env.PORT || "8787", 10);
const BASE = (process.env.BASE_PATH || "").replace(/\/+$/, "");
const PAGE = path.join(here, "public", "index.html");
const BODY_LIMIT = 4 * 1024 * 1024;

const log = (...a) => console.log(new Date().toISOString(), ...a);

class HttpError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }

/* Sent with everything. The page is one file with its script and style
   inline, so the policy allows inline but nothing from elsewhere except the
   fonts, and lets the page talk only to this server. */
const SECURITY = {
  "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY",
  "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
};
function send(res, status, body, headers = {}) {
  const data = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, { "Content-Type": typeof body === "string" ? "text/html; charset=utf-8" : "application/json; charset=utf-8", "Cache-Control": "no-store", ...SECURITY, ...headers });
  res.end(data);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", c => { size += c.length; if (size > BODY_LIMIT) { reject(new HttpError(413, "too_large", "Request body is too large.")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { reject(new HttpError(400, "bad_json", "Request body is not valid JSON.")); }
    });
    req.on("error", reject);
  });
}

const today = () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

async function requireUser(req) {
  const id = auth.userIdFromCookie(req);
  if (!id) throw new HttpError(401, "signed_out", "Sign in first.");
  const u = await auth.userById(id);
  if (!u) throw new HttpError(401, "signed_out", "Sign in first.");
  return u;
}

/* Sign-up and admin add share this: the same checks, the same refusals. */
async function newUser(fields) {
  try { return await auth.createUser(fields); }
  catch (e) { if (e && e.code) throw new HttpError(e.code === "exists" ? 409 : 400, e.code, e.message); throw e; }
}

/* A shared stream is read-only to everyone but its owner, and the model is
   never called on a stream the person can't write to. */
function mustBeMine(s) {
  if (!s) throw new HttpError(404, "not_found", "No such stream.");
  if (!s.mine) throw new HttpError(403, "read_only", "This stream is shared and read-only. Branch it to work on a copy of your own.");
}

/* Everyone but an admin has a daily number of model calls (DAILY_CALL_LIMIT,
   default 40), since every call is paid for with the server's key. There is
   also a ceiling on what all of them together may spend in a day
   (DAILY_CALL_CEILING, default 300), so that more accounts cannot mean
   unbounded spend. */
async function underDailyLimit(user) {
  if (user.admin) return;
  const limit = parseInt(process.env.DAILY_CALL_LIMIT || "40", 10);
  if (await auth.callsToday(user.id) >= limit) throw new HttpError(429, "daily_limit", `You've reached today's limit of ${limit} model calls. It frees up over the next 24 hours.`);
  const ceiling = parseInt(process.env.DAILY_CALL_CEILING || "300", 10);
  if (await auth.callsTodayAll() >= ceiling) throw new HttpError(429, "daily_ceiling", "The app has reached today's total of AI calls for everyone. It frees up over the next 24 hours.");
}

/* Who is asking, for throttling. IIS passes the visitor's address along. */
function caller(req) { return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || (req.socket && req.socket.remoteAddress) || "unknown"; }

/* An action is stored only if the reducer knows its type and its ids are
   ids. The server never writes what replay would ignore or choke on. */
function mustBeAction(action) {
  if (!actionOk(action)) throw new HttpError(400, "bad_step", "That is not an action this app knows, or one of its ids is not an id.");
  if (action.type === "analysis") throw new HttpError(400, "bad_step", "A help analysis is made by the server. Post to /analyze.");
  if (JSON.stringify(action).length > SCREEN_LIMITS.actionMax) throw new HttpError(413, "too_large", "That is too much for one step.");
}
/* Steps posted whole (a sample being forked, a guest's stream being saved).
   Actions pass the same check as one posted alone. A posted "ingest" step
   was not made by this server's call, so it may not claim a model made it. */
function postedSteps(list) {
  const steps = Array.isArray(list) ? list.filter(s => s && (s.kind === "ingest" || s.kind === "action")) : [];
  if (steps.length > 2000) throw new HttpError(413, "too_large", "That is too many steps to save at once.");
  return steps.map(s => {
    if (s.kind === "action") { mustBeAction(s.action); return { kind: "action", date: String(s.date || today()).slice(0, 40), source: String(s.source || "").slice(0, 200), action: s.action }; }
    if (!s.result || typeof s.result !== "object" || Array.isArray(s.result) || JSON.stringify(s.result).length > 400000) throw new HttpError(400, "bad_step", "One of those steps does not hold a result this app can read.");
    return { kind: "ingest", date: String(s.date || today()).slice(0, 40), source: String(s.source || "").slice(0, 200), text: typeof s.text === "string" ? s.text.slice(0, SCREEN_LIMITS.textMax) : null, model: null, tier: null, result: s.result };
  });
}

/* The check before every call out to the AI: what the person is sending
   and what is already in their stream. A refusal is logged like a call, so
   it counts toward the daily limit, and the AI is not called. */
async function mustPassScreen(check, user, streamId, tier) {
  const r = screenCall({ ...check, trusted: user.admin });
  if (r.ok) return;
  await streams.logApiCall({ userId: user.id, streamId, model: MODELS[tier](), status: "screened", error: r.code });
  log(`screened user=${user.id} stream=${streamId} code=${r.code}`);
  throw new HttpError(r.code === "too_long" ? 413 : r.code === "empty_input" ? 400 : 422, r.code, r.message);
}

/* Stop. When the person presses Stop, or closes the tab, the browser drops
   the connection. The response's close event is the one that fires then;
   the request's own close event has already fired once its body was read,
   which is why a listener there never ran. The signal aborts the model
   call, and the route stores nothing if it has been aborted. */
function stopWith(res) {
  const ctl = new AbortController();
  res.on("close", () => { if (!res.writableEnded) ctl.abort(); });
  return ctl;
}

/* A model call that failed: log it, and give back the error to throw. */
async function failedCall(e, userId, streamId, tier) {
  const code = e && e.code ? e.code : "api_error";
  await streams.logApiCall({ userId, streamId, model: MODELS[tier](), status: code === "cancelled" ? "cancelled" : code === "refused" ? "refused" : "error", error: e && e.message });
  const status = code === "empty_input" ? 400 : code === "cancelled" ? 499 : code === "rate_limited" ? 429 : 502;
  return new HttpError(status, code, e && e.message ? e.message : "Something went wrong on the way.");
}

async function handleApi(req, res, url) {
  const p = url.pathname.slice(BASE.length + 4); /* strip "/api" */
  const m = req.method;

  if (p === "/auth" && m === "GET") return send(res, 200, { signup: (await auth.signupSettings()).mode });
  if (p === "/login" && m === "POST") {
    const body = await readJson(req);
    /* eight wrong tries from one place for one email, and that place waits a quarter of an hour */
    const key = `login:${auth.normEmail(body.email) || "owner"}|${caller(req)}`;
    if (auth.usesSoFar(key, 900000) >= 8) throw new HttpError(429, "slow_down", "Too many wrong tries. Wait a quarter of an hour, then try again.");
    const u = await auth.login(body.email, body.password);
    if (!u) { auth.countUse(key, 900000); await new Promise(r => setTimeout(r, 400)); throw new HttpError(401, "bad_password", "That email or password isn't right."); }
    auth.clearUse(key);
    return send(res, 200, u, { "Set-Cookie": auth.makeCookie(u.id, req) });
  }
  if (p === "/signup" && m === "POST") {
    const body = await readJson(req);
    const su = await auth.signupSettings(), mode = su.mode;
    if (mode === "closed") throw new HttpError(403, "signup_closed", "Signing up is closed. Ask to be added.");
    if (mode === "code" && !auth.codeMatches(body.code, su.code)) { await new Promise(r => setTimeout(r, 400)); throw new HttpError(403, "bad_code", "That invite code isn't right."); }
    /* a handful of new accounts an hour from one place (SIGNUPS_PER_HOUR, default 5) */
    const key = `signup:${caller(req)}`, perHour = parseInt(process.env.SIGNUPS_PER_HOUR || "5", 10);
    if (auth.usesSoFar(key, 3600000) >= perHour) throw new HttpError(429, "slow_down", "Too many new accounts from here in the last hour. Try again later, or ask to be added.");
    const u = await newUser({ email: body.email, password: body.password, level: auth.signupLevel() });
    auth.countUse(key, 3600000);
    log(`signup user=${u.id} level=${u.level}`);
    return send(res, 201, u, { "Set-Cookie": auth.makeCookie(u.id, req) });
  }
  if (p === "/logout" && m === "POST") return send(res, 200, { ok: true }, { "Set-Cookie": auth.clearCookie() });

  const user = await requireUser(req);
  if (p === "/me" && m === "GET") return send(res, 200, user);
  /* Anyone signed in can change their own password, by giving the current one. Eight wrong tries and the account waits a quarter of an hour.
     A wrong current password is a 403, not a 401: the person is still signed in. */
  if (p === "/me/password" && m === "POST") {
    const b = await readJson(req), key = `password:${user.id}`;
    if (auth.usesSoFar(key, 900000) >= 8) throw new HttpError(429, "slow_down", "Too many wrong tries. Wait a quarter of an hour, then try again.");
    let done;
    try { done = await auth.changeOwnPassword(user.id, b.current, b.password); } catch (e) { if (e && e.code) throw new HttpError(400, e.code, e.message); throw e; }
    if (!done) { auth.countUse(key, 900000); await new Promise(r => setTimeout(r, 400)); throw new HttpError(403, "bad_password", "The current password isn't right."); }
    auth.clearUse(key);
    log(`user=${user.id} changed their own password`);
    return send(res, 200, { ok: true });
  }
  /* the owner's own sample stream is the owner's alone; everyone else has the samples built into the page */
  if (p === "/samples" && m === "GET") return send(res, 200, user.email === auth.ownerEmail() ? OWNER_SAMPLES : []);

  /* the admin panel: see who has an account, add someone, set a password, disable or enable */
  if (p.startsWith("/admin/")) {
    if (!user.admin) throw new HttpError(403, "not_admin", "That is for an admin.");
    /* who may sign up: the admin can see it and set it here, without editing a file on the server */
    const signupNow = s => ({ signup: s.mode, code: s.code, from: s.from });
    if (p === "/admin/settings" && m === "GET") return send(res, 200, signupNow(await auth.signupSettings()));
    if (p === "/admin/settings" && m === "PATCH") {
      const b = await readJson(req);
      let s;
      try { s = await auth.setSignup({ mode: String(b.signup ?? ""), code: b.code }, user.id); } catch (e) { if (e && e.code) throw new HttpError(400, e.code, e.message); throw e; }
      log(`admin=${user.id} set signup=${s.mode} from=${s.from}`);
      return send(res, 200, signupNow(s));
    }
    if (p === "/admin/users" && m === "GET") return send(res, 200, await auth.listUsers());
    if (p === "/admin/users" && m === "POST") {
      const b = await readJson(req);
      const u = await newUser({ email: b.email, password: b.password, addedBy: user.id, level: b.level === undefined ? "user" : String(b.level) });
      log(`admin=${user.id} added user=${u.id} level=${u.level}`);
      return send(res, 201, u);
    }
    const who = p.match(/^\/admin\/users\/(\d+)$/);
    if (who && m === "PATCH") {
      const b = await readJson(req), uid = parseInt(who[1], 10);
      if (uid === user.id) throw new HttpError(400, "self", "You can't change your own account here.");
      let done = false;
      if (typeof b.password === "string") { try { done = await auth.setPassword(uid, b.password); } catch (e) { if (e && e.code) throw new HttpError(400, e.code, e.message); throw e; } if (!done) throw new HttpError(404, "not_found", "No such person, or it is the owner."); }
      if (typeof b.disabled === "boolean") { done = await auth.setDisabled(uid, b.disabled); if (!done) throw new HttpError(404, "not_found", "No such person, or it is the owner."); }
      if (b.level !== undefined) { try { done = await auth.setLevel(uid, String(b.level)); } catch (e) { if (e && e.code) throw new HttpError(400, e.code, e.message); throw e; } if (!done) throw new HttpError(404, "not_found", "No such person, or it is the owner."); }
      if (!done) throw new HttpError(400, "nothing", "Nothing to change.");
      log(`admin=${user.id} changed user=${uid}${typeof b.password === "string" ? " password" : ""}${typeof b.disabled === "boolean" ? " disabled=" + b.disabled : ""}${b.level !== undefined ? " level=" + b.level : ""}`);
      return send(res, 200, { ok: true });
    }
    throw new HttpError(404, "not_found", "No such route.");
  }

  if (p === "/streams" && m === "GET") return send(res, 200, await streams.listStreams(user.id));
  /* Past this line every route but reading a stream stores something, and what a guest does is not stored. */
  if (user.level === "guest" && m !== "GET") throw new HttpError(403, "guest", "You are signed in as a guest, and what a guest does is not saved. An admin can make you a user.");
  if (p === "/streams" && m === "POST") {
    const b = await readJson(req);
    if (b.fromStreamId) return send(res, 201, await streams.createStream(user.id, { name: b.name, fromStreamId: String(b.fromStreamId), atSeq: Number.isInteger(b.atSeq) ? b.atSeq : null }));
    return send(res, 201, await streams.createStream(user.id, { name: b.name, steps: postedSteps(b.steps) }));
  }

  const one = p.match(/^\/streams\/([0-9a-f-]{36})(?:\/(steps|ingest|analyze))?$/);
  if (!one) throw new HttpError(404, "not_found", "No such route.");
  const id = one[1], sub = one[2];

  if (!sub && m === "GET") { const s = await streams.getStream(user.id, id); if (!s) throw new HttpError(404, "not_found", "No such stream."); return send(res, 200, s); }
  if (!sub && m === "PATCH") {
    const b = await readJson(req);
    let s = null;
    if (typeof b.shared === "boolean") {
      if (!user.admin) throw new HttpError(403, "not_admin", "Only an admin can share a stream with everyone.");
      s = await streams.shareStream(user.id, id, b.shared);
      if (!s) throw new HttpError(404, "not_found", "No such stream.");
    }
    if (b.name !== undefined) { s = await streams.renameStream(user.id, id, b.name); if (!s) throw new HttpError(404, "not_found", "No such stream."); }
    if (!s) throw new HttpError(400, "nothing", "Nothing to change.");
    return send(res, 200, s);
  }
  if (!sub && m === "DELETE") { if (!await streams.deleteStream(user.id, id)) throw new HttpError(404, "not_found", "No such stream."); return send(res, 200, { ok: true }); }

  if (sub === "steps" && m === "POST") {
    const b = await readJson(req);
    if (b.kind !== "action" || !b.action || typeof b.action !== "object") throw new HttpError(400, "bad_step", "Only action steps can be posted directly. Text goes to /ingest.");
    mustBeAction(b.action);
    const step = await streams.appendStep(user.id, id, { kind: "action", action: b.action, source: String(b.source || "").slice(0, 200), date: String(b.date || today()).slice(0, 40) });
    return send(res, 201, { step });
  }

  if (sub === "ingest" && m === "POST") {
    const b = await readJson(req);
    const text = String(b.text ?? "");
    if (!text.trim()) throw new HttpError(400, "empty_input", "Paste or drop some text first.");
    const s = await streams.getStream(user.id, id);
    mustBeMine(s);
    await underDailyLimit(user);
    const state = replay(s.steps);
    const ctl = stopWith(res);
    const source = String(b.source || "Pasted text").replace(/\s+/g, " ").trim().slice(0, 200) || "Pasted text";
    const tier = ["quick", "default", "complex"].includes(b.tier) ? b.tier : "default";
    await mustPassScreen({ text, label: source }, user, id, tier);
    const left = [], scrub = t => { const r = scrubContext(t, user.admin); left.push(...r.left); return r.text; };
    const stepId = "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const date = String(b.date || today()).slice(0, 40);
    let out;
    try {
      out = await ideaify({ text, source, tier, state, stepId, date, signal: ctl.signal, scrub });
    } catch (e) { throw await failedCall(e, user.id, id, tier); }
    if (ctl.signal.aborted) throw await failedCall({ code: "cancelled", message: "Stopped. Nothing was added." }, user.id, id, tier);
    const step = await streams.appendStep(user.id, id, { kind: "ingest", date, source, text, model: out.usage.model, tier, result: out.result, usage: out.usage });
    await streams.logApiCall({ userId: user.id, streamId: id, seq: step.seq, model: out.usage.model, latencyMs: out.usage.latency_ms, inputTokens: out.usage.input_tokens, outputTokens: out.usage.output_tokens, status: "ok" });
    log(`ingest stream=${id} seq=${step.seq} model=${out.usage.model} ${out.usage.latency_ms}ms ideas=${Object.keys(out.result.add).length} dropped=${out.dropped}`);
    return send(res, 201, { step, dropped: out.dropped, leftOut: left });
  }
  if (sub === "analyze" && m === "POST") {
    const b = await readJson(req);
    const s = await streams.getStream(user.id, id);
    mustBeMine(s);
    await underDailyLimit(user);
    const state = replay(s.steps);
    if (!hasPlay(state)) throw new HttpError(400, "empty_input", "There is nothing to analyze yet. Put a fact or a goal forth, or add text first.");
    const ctl = stopWith(res);
    const tier = ["quick", "default", "complex"].includes(b.tier) ? b.tier : "default";
    await mustPassScreen({ context: helpContext(state) }, user, id, tier);
    const left = [], scrub = t => { const r = scrubContext(t, user.admin); left.push(...r.left); return r.text; };
    const stepId = "h" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const date = String(b.date || today()).slice(0, 40);
    let out;
    try {
      out = await analyze({ state, tier, stepId, date, signal: ctl.signal, scrub });
    } catch (e) { throw await failedCall(e, user.id, id, tier); }
    if (ctl.signal.aborted) throw await failedCall({ code: "cancelled", message: "Stopped. Nothing was added." }, user.id, id, tier);
    const action = { type: "analysis", id: stepId, model: out.usage.model, standing: out.result.standing, suggestions: out.result.suggestions, leftOut: left.slice(0, 5) };
    const stored = await streams.appendStep(user.id, id, { kind: "action", date, source: "help analysis", action, model: out.usage.model, tier, usage: out.usage });
    await streams.logApiCall({ userId: user.id, streamId: id, seq: stored.seq, model: out.usage.model, latencyMs: out.usage.latency_ms, inputTokens: out.usage.input_tokens, outputTokens: out.usage.output_tokens, status: "ok" });
    log(`analyze stream=${id} seq=${stored.seq} model=${out.usage.model} ${out.usage.latency_ms}ms suggestions=${action.suggestions.length} dropped=${out.dropped}`);
    return send(res, 201, { step: { seq: stored.seq, kind: "action", at: stored.at, date, source: stored.source, action }, dropped: out.dropped });
  }
  throw new HttpError(405, "method", "Method not allowed.");
}

async function handle(req, res) {
  const url = new URL(req.url, "http://localhost");
  if (BASE && !url.pathname.startsWith(BASE)) return send(res, 404, { error: { code: "not_found", message: "Wrong base path." } });
  /* FORCE_HTTPS=true: a visitor who arrives over plain HTTP is sent to HTTPS, so a password never travels in the clear.
     IIS says which it was in x-forwarded-proto. /health is left alone so the server itself can be asked over localhost. */
  if (process.env.FORCE_HTTPS === "true" && req.headers["x-forwarded-proto"] === "http" && req.headers.host && !url.pathname.endsWith("/health")) {
    res.writeHead(301, { Location: "https://" + String(req.headers.host).replace(/:80$/, "") + req.url, ...SECURITY }); return res.end();
  }
  /* The page asks for "api/…" relative to its own address, so under a sub-path it has to be opened with the trailing slash. */
  if (BASE && url.pathname === BASE) { res.writeHead(301, { Location: BASE + "/" + url.search, ...SECURITY }); return res.end(); }
  const rel = url.pathname.slice(BASE.length) || "/";
  try {
    if (rel === "/health") {
      let db = false;
      if (hasDatabase()) { try { await query("SELECT 1"); db = true; } catch { db = false; } }
      /* https: whether this request reached the site over HTTPS, as far as this process is told. Under IIS that is the x-forwarded-proto header. */
      return send(res, db ? 200 : 503, { ok: db, version: PKG.version, db, https: req.headers["x-forwarded-proto"] === "https" || !!(req.socket && req.socket.encrypted) });
    }
    if (rel.startsWith("/api/")) return await handleApi(req, res, url);
    if (rel === "/" || rel === "/index.html") {
      if (!fs.existsSync(PAGE)) return send(res, 503, "<h1>Not built yet</h1><p>Run <code>node build.js</code> first.</p>");
      return send(res, 200, fs.readFileSync(PAGE, "utf8"));
    }
    if (rel === "/favicon.ico") { res.writeHead(204); return res.end(); }
    return send(res, 404, { error: { code: "not_found", message: "No such route." } });
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: { code: e.code, message: e.message } });
    if (e && e.status === 404) return send(res, 404, { error: { code: "not_found", message: e.message } });
    log("error", req.method, rel, e && e.stack ? e.stack : e);
    return send(res, 500, { error: { code: "server_error", message: "Something went wrong on the server." } });
  }
}

if (isMain) {
  (async () => {
    if (!hasDatabase()) log("warning: DATABASE_URL is not set; only /health and the page will work");
    else { try { const r = await migrate(log); log(`schema at version ${r.version}`); if (await auth.ownerIsAdmin()) log("the owner's account is now an admin"); } catch (e) { log("migrate failed:", e.message); process.exit(1); } }
    http.createServer(handle).listen(PORT, "127.0.0.1", () => log(`network-meaning ${PKG.version} listening on http://127.0.0.1:${PORT}${BASE || ""}`));
  })();
}

export { handle };

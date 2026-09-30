/* ─────────────────────────────────────────────
   File: server.js
   File Version: 0.1.1
   ─────────────────────────────────────────────
   Network Meaning: the HTTP entry point. Node's built-in http server, no
   framework. Serves the one built page and a small JSON API. Under IIS,
   HttpPlatformHandler starts this process and sets PORT.

     node server.js            (reads .env if present)

   Routes (all /api/* need the session cookie except login):
     GET  /health
     POST /api/login  {password}      POST /api/logout      GET /api/me
     GET  /api/streams                POST /api/streams {name, steps?} | {name, fromStreamId, atSeq}
     GET  /api/streams/:id            PATCH /api/streams/:id {name}     DELETE /api/streams/:id
     POST /api/streams/:id/steps  {kind:"action", action, source, date}
     POST /api/streams/:id/ingest {text, source, tier}                   */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hasDatabase, query } from "./src/server/db.js";
import { migrate } from "./src/server/migrate.js";
import * as auth from "./src/server/auth.js";
import * as streams from "./src/server/streams.js";
import { ideaify, MODELS } from "./src/server/ideaify.js";
import { replay } from "./src/shared/replay.js";

const here = path.dirname(fileURLToPath(import.meta.url));
try { process.loadEnvFile(path.join(here, ".env")); } catch { /* environment only */ }

const PKG = JSON.parse(fs.readFileSync(path.join(here, "package.json"), "utf8"));
const PORT = parseInt(process.env.PORT || "8787", 10);
const BASE = (process.env.BASE_PATH || "").replace(/\/+$/, "");
const PAGE = path.join(here, "public", "index.html");
const BODY_LIMIT = 4 * 1024 * 1024;

const log = (...a) => console.log(new Date().toISOString(), ...a);

class HttpError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }

function send(res, status, body, headers = {}) {
  const data = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, { "Content-Type": typeof body === "string" ? "text/html; charset=utf-8" : "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
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

async function handleApi(req, res, url) {
  const p = url.pathname.slice(BASE.length + 4); /* strip "/api" */
  const m = req.method;

  if (p === "/login" && m === "POST") {
    const body = await readJson(req);
    if (!auth.passwordMatches(body.password)) { await new Promise(r => setTimeout(r, 400)); throw new HttpError(401, "bad_password", "That password isn't right."); }
    const u = await auth.ensureUser();
    return send(res, 200, { id: u.id, email: u.email }, { "Set-Cookie": auth.makeCookie(u.id, req) });
  }
  if (p === "/logout" && m === "POST") return send(res, 200, { ok: true }, { "Set-Cookie": auth.clearCookie() });

  const user = await requireUser(req);
  if (p === "/me" && m === "GET") return send(res, 200, user);

  if (p === "/streams" && m === "GET") return send(res, 200, await streams.listStreams(user.id));
  if (p === "/streams" && m === "POST") {
    const b = await readJson(req);
    if (b.fromStreamId) return send(res, 201, await streams.createStream(user.id, { name: b.name, fromStreamId: String(b.fromStreamId), atSeq: Number.isInteger(b.atSeq) ? b.atSeq : null }));
    const steps = Array.isArray(b.steps) ? b.steps.filter(s => s && (s.kind === "ingest" || s.kind === "action")) : [];
    return send(res, 201, await streams.createStream(user.id, { name: b.name, steps }));
  }

  const one = p.match(/^\/streams\/([0-9a-f-]{36})(?:\/(steps|ingest))?$/);
  if (!one) throw new HttpError(404, "not_found", "No such route.");
  const id = one[1], sub = one[2];

  if (!sub && m === "GET") { const s = await streams.getStream(user.id, id); if (!s) throw new HttpError(404, "not_found", "No such stream."); return send(res, 200, s); }
  if (!sub && m === "PATCH") { const b = await readJson(req); const s = await streams.renameStream(user.id, id, b.name); if (!s) throw new HttpError(404, "not_found", "No such stream."); return send(res, 200, s); }
  if (!sub && m === "DELETE") { if (!await streams.deleteStream(user.id, id)) throw new HttpError(404, "not_found", "No such stream."); return send(res, 200, { ok: true }); }

  if (sub === "steps" && m === "POST") {
    const b = await readJson(req);
    if (b.kind !== "action" || !b.action || typeof b.action !== "object") throw new HttpError(400, "bad_step", "Only action steps can be posted directly. Text goes to /ingest.");
    const step = await streams.appendStep(user.id, id, { kind: "action", action: b.action, source: String(b.source || "").slice(0, 200), date: String(b.date || today()).slice(0, 40) });
    return send(res, 201, { step });
  }

  if (sub === "ingest" && m === "POST") {
    const b = await readJson(req);
    const text = String(b.text ?? "");
    if (!text.trim()) throw new HttpError(400, "empty_input", "Paste or drop some text first.");
    const s = await streams.getStream(user.id, id);
    if (!s) throw new HttpError(404, "not_found", "No such stream.");
    const state = replay(s.steps);
    const ctl = new AbortController();
    req.on("close", () => { if (!res.writableEnded) ctl.abort(); });
    const source = String(b.source || "Pasted text").slice(0, 200);
    const tier = ["quick", "default", "complex"].includes(b.tier) ? b.tier : "default";
    const stepId = "t" + Date.now().toString(36);
    const date = today();
    let out;
    try {
      out = await ideaify({ text, source, tier, state, stepId, date, signal: ctl.signal });
    } catch (e) {
      const code = e && e.code ? e.code : "api_error";
      await streams.logApiCall({ userId: user.id, streamId: id, model: MODELS[tier](), status: code === "cancelled" ? "cancelled" : code === "refused" ? "refused" : "error", error: e && e.message });
      const status = code === "empty_input" ? 400 : code === "cancelled" ? 499 : code === "rate_limited" ? 429 : 502;
      throw new HttpError(status, code, e && e.message ? e.message : "Something went wrong on the way.");
    }
    const step = await streams.appendStep(user.id, id, { kind: "ingest", date, source, text, model: out.usage.model, tier, result: out.result, usage: out.usage });
    await streams.logApiCall({ userId: user.id, streamId: id, seq: step.seq, model: out.usage.model, latencyMs: out.usage.latency_ms, inputTokens: out.usage.input_tokens, outputTokens: out.usage.output_tokens, status: "ok" });
    log(`ingest stream=${id} seq=${step.seq} model=${out.usage.model} ${out.usage.latency_ms}ms ideas=${Object.keys(out.result.add).length} dropped=${out.dropped}`);
    return send(res, 201, { step, dropped: out.dropped });
  }
  throw new HttpError(405, "method", "Method not allowed.");
}

async function handle(req, res) {
  const url = new URL(req.url, "http://localhost");
  if (BASE && !url.pathname.startsWith(BASE)) return send(res, 404, { error: { code: "not_found", message: "Wrong base path." } });
  const rel = url.pathname.slice(BASE.length) || "/";
  try {
    if (rel === "/health") {
      let db = false;
      if (hasDatabase()) { try { await query("SELECT 1"); db = true; } catch { db = false; } }
      return send(res, db ? 200 : 503, { ok: db, version: PKG.version, db });
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

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  (async () => {
    if (!hasDatabase()) log("warning: DATABASE_URL is not set; only /health and the page will work");
    else { try { const r = await migrate(log); log(`schema at version ${r.version}`); } catch (e) { log("migrate failed:", e.message); process.exit(1); } }
    http.createServer(handle).listen(PORT, "127.0.0.1", () => log(`network-meaning ${PKG.version} listening on http://127.0.0.1:${PORT}${BASE || ""}`));
  })();
}

export { handle };

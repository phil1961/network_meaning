/* ─────────────────────────────────────────────
   File: src/server/auth.js
   File Version: 0.3.1
   ─────────────────────────────────────────────
   Who is signed in. Email is the unique key. A person signs up themselves
   (when SIGNUP allows it) or is added by an admin; either way they get a
   password, stored only as a salted scrypt hash. Three levels (Phil,
   2026-09-30): what a user does is stored; what a guest does is not; an
   admin is a user who can also add people and share streams. The owner, APP_USER_EMAIL,
   signs in with APP_PASSWORD from the environment and is the first admin.
   Sessions are an HMAC-signed cookie, no server-side session table; every
   request looks the user up again, so a disabled account stops at once. */

import crypto from "node:crypto";
import { promisify } from "node:util";
import { query, hasDatabase } from "./db.js";

const scrypt = promisify(crypto.scrypt);
const COOKIE = "nm_session";
const DAYS = 30;
const SCRYPT = { N: 16384, r: 8, p: 1, len: 64 };
export const PASSWORD_MIN = 8, PASSWORD_MAX = 200;
export const LEVELS = ["guest", "user", "admin"];

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET must be set (16+ characters)");
  return s;
}
function sign(payload) { return crypto.createHmac("sha256", secret()).update(payload).digest("base64url"); }

export function makeCookie(userId, req) {
  const exp = Date.now() + DAYS * 86400000;
  const payload = `${userId}.${exp}`;
  const value = `${payload}.${sign(payload)}`;
  /* Behind IIS the request reaches this process over plain HTTP on localhost,
     and HttpPlatformHandler does not say the visitor used HTTPS. Set
     COOKIE_SECURE=true in .env on a site that is served over HTTPS. */
  const secure = process.env.COOKIE_SECURE === "true" || req.headers["x-forwarded-proto"] === "https" || (req.socket && req.socket.encrypted);
  return `${COOKIE}=${value}; Path=${cookiePath()}; HttpOnly; SameSite=Lax; Max-Age=${DAYS * 86400}${secure ? "; Secure" : ""}`;
}
export function clearCookie() { return `${COOKIE}=; Path=${cookiePath()}; HttpOnly; SameSite=Lax; Max-Age=0`; }
/* Under a sub-path the cookie is for that path only, so other sites on the same host never receive it. */
function cookiePath() { return (process.env.BASE_PATH || "").replace(/\/+$/, "") || "/"; }

export function userIdFromCookie(req) {
  const raw = req.headers.cookie || "";
  const m = raw.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return null;
  const parts = m[1].split(".");
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  const payload = `${id}.${exp}`;
  const want = sign(payload);
  if (sig.length !== want.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  if (Number(exp) < Date.now()) return null;
  const n = parseInt(id, 10);
  return Number.isInteger(n) ? n : null;
}

/* ---- email and password ---- */

export function normEmail(e) { return String(e ?? "").trim().toLowerCase(); }
export function validEmail(e) { return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
export function ownerEmail() { return normEmail(process.env.APP_USER_EMAIL || "owner@localhost"); }
export function validPassword(p) { return typeof p === "string" && p.length >= PASSWORD_MIN && p.length <= PASSWORD_MAX; }

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(String(password), salt, SCRYPT.len, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}
export async function verifyPassword(password, stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, N, r, p, salt, want] = parts;
  const wantBuf = Buffer.from(want, "base64url");
  let key;
  try { key = await scrypt(String(password ?? ""), Buffer.from(salt, "base64url"), wantBuf.length, { N: +N, r: +r, p: +p }); } catch { return false; }
  return key.length === wantBuf.length && crypto.timingSafeEqual(key, wantBuf);
}
/* A hash nobody's password matches, checked when there is no such account
   so a wrong email takes as long to refuse as a wrong password. */
let decoy = null;
async function decoyCheck(password) { if (!decoy) decoy = await hashPassword(crypto.randomBytes(24).toString("hex")); await verifyPassword(password, decoy); }

/* The owner's password, from the environment. */
export function passwordMatches(given) {
  const want = process.env.APP_PASSWORD || "";
  if (!want) return false;
  const a = Buffer.from(String(given ?? "")), b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ---- users ---- */

const pub = r => (r ? { id: r.id, email: r.email, level: r.level, admin: r.level === "admin" } : null);

/* The owner's row, created on first sign-in and always an admin. */
export async function ensureUser() {
  const r = await query("INSERT INTO users (email, level) VALUES ($1, 'admin') ON CONFLICT (email) DO UPDATE SET level = 'admin', disabled_at = NULL RETURNING id, email, level", [ownerEmail()]);
  return pub(r.rows[0]);
}

/* At start-up: if the owner already has a row (from before there were
   levels), it is an admin without waiting for the next sign-in. */
export async function ownerIsAdmin() {
  const r = await query("UPDATE users SET level = 'admin' WHERE email = $1 AND level <> 'admin'", [ownerEmail()]);
  return r.rowCount > 0;
}

export async function userById(id) {
  const r = await query("SELECT id, email, level FROM users WHERE id = $1 AND disabled_at IS NULL", [id]);
  return pub(r.rows[0]);
}

/* Sign in. A blank email means the owner, as it did when there was one
   user. Returns the user, or null for a wrong email or password or a
   disabled account; the caller says the same thing for all three. */
export async function login(email, password) {
  const em = normEmail(email) || ownerEmail();
  if (em === ownerEmail() && passwordMatches(password)) return ensureUser();
  if (!hasDatabase()) return null; /* nobody to look up */
  const r = await query("SELECT id, email, level, password_hash, disabled_at FROM users WHERE email = $1", [em]);
  const u = r.rows[0];
  if (!u || !u.password_hash || u.disabled_at) { await decoyCheck(password); return null; }
  return (await verifyPassword(password, u.password_hash)) ? pub(u) : null;
}

/* Sign-up and admin add. Throws { code } for a bad email, a bad password,
   or an email that already has an account. addedBy null = signed up. */
export async function createUser({ email, password, addedBy = null, level = "user" }) {
  if (!LEVELS.includes(level)) throw { code: "bad_level", message: "A level is guest, user, or admin." };
  const em = normEmail(email);
  if (!validEmail(em)) throw { code: "bad_email", message: "That doesn't look like an email address." };
  if (!validPassword(password)) throw { code: "bad_password", message: `A password needs at least ${PASSWORD_MIN} characters.` };
  if (em === ownerEmail()) throw { code: "exists", message: "That email already has an account. Sign in instead." };
  try {
    const r = await query("INSERT INTO users (email, password_hash, added_by, level) VALUES ($1, $2, $3, $4) RETURNING id, email, level", [em, await hashPassword(password), addedBy, level]);
    return pub(r.rows[0]);
  } catch (e) {
    if (e && e.code === "23505") throw { code: "exists", message: "That email already has an account. Sign in instead." };
    throw e;
  }
}

/* For the admin panel. Never returns a hash. */
export async function listUsers() {
  const r = await query(`SELECT u.id, u.email, u.level, u.disabled_at, u.created_at, a.email AS added_by,
      (SELECT count(*) FROM streams s WHERE s.user_id = u.id)::int AS streams,
      (SELECT count(*) FROM api_calls c WHERE c.user_id = u.id AND c.at > now() - interval '24 hours')::int AS calls_today
    FROM users u LEFT JOIN users a ON a.id = u.added_by ORDER BY (u.email = $1) DESC, u.created_at, u.id`, [ownerEmail()]);
  return r.rows.map(x => ({ id: x.id, email: x.email, level: x.level, admin: x.level === "admin", disabled: !!x.disabled_at, createdAt: x.created_at, addedBy: x.added_by, owner: x.email === ownerEmail(), streams: x.streams, callsToday: x.calls_today }));
}
export async function setPassword(id, password) {
  if (!validPassword(password)) throw { code: "bad_password", message: `A password needs at least ${PASSWORD_MIN} characters.` };
  const r = await query("UPDATE users SET password_hash = $2 WHERE id = $1 AND email <> $3", [id, await hashPassword(password), ownerEmail()]);
  return r.rowCount > 0;
}
export async function setLevel(id, level) {
  if (!LEVELS.includes(level)) throw { code: "bad_level", message: "A level is guest, user, or admin." };
  const r = await query("UPDATE users SET level = $2 WHERE id = $1 AND email <> $3", [id, level, ownerEmail()]);
  return r.rowCount > 0;
}
export async function setDisabled(id, disabled) {
  const r = await query("UPDATE users SET disabled_at = CASE WHEN $2 THEN now() ELSE NULL END WHERE id = $1 AND email <> $3", [id, !!disabled, ownerEmail()]);
  return r.rowCount > 0;
}

/* The level someone who signs up themselves starts at: SIGNUP_LEVEL, "user"
   unless it says "guest". Signing up never makes an admin. */
export function signupLevel() { return String(process.env.SIGNUP_LEVEL || "user").toLowerCase() === "guest" ? "guest" : "user"; }

/* Who may sign up: "open", "code" (an invite code is asked for), "closed". */
export function signupMode() {
  if (String(process.env.SIGNUP || "open").toLowerCase() === "closed") return "closed";
  return process.env.SIGNUP_CODE ? "code" : "open";
}
export function signupCodeMatches(given) {
  const want = process.env.SIGNUP_CODE || "";
  const a = Buffer.from(String(given ?? "").trim()), b = Buffer.from(want);
  return !!want && a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* Model calls made in the last day by everyone who is not an admin, for the
   ceiling on total spend. */
export async function callsTodayAll() {
  const r = await query("SELECT count(*)::int AS n FROM api_calls c JOIN users u ON u.id = c.user_id WHERE u.level <> 'admin' AND c.at > now() - interval '24 hours'");
  return r.rows[0].n;
}

/* Throttling, kept in memory: how many times a key was used inside a
   window. It resets when the server restarts, which is enough to slow a
   guesser and to stop a flood of sign-ups. */
const used = new Map();
export function countUse(key, windowMs, now = Date.now()) {
  const kept = (used.get(key) || []).filter(t => now - t < windowMs);
  kept.push(now); used.set(key, kept);
  if (used.size > 5000) for (const [k, v] of used) if (!v.some(t => now - t < 3600000)) used.delete(k);
  return kept.length;
}
export function usesSoFar(key, windowMs, now = Date.now()) { return (used.get(key) || []).filter(t => now - t < windowMs).length; }
export function clearUse(key) { used.delete(key); }

/* Model calls a person has made in the last day, for the daily limit. */
export async function callsToday(userId) {
  const r = await query("SELECT count(*)::int AS n FROM api_calls WHERE user_id = $1 AND at > now() - interval '24 hours'", [userId]);
  return r.rows[0].n;
}

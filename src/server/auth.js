/* ─────────────────────────────────────────────
   File: src/server/auth.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   Single-user milestone: one shared password (APP_PASSWORD) unlocks the
   one user (APP_USER_EMAIL). Sessions are an HMAC-signed cookie, no
   server-side session table. The users table exists from day one so
   multi-user is a feature later, not a migration. */

import crypto from "node:crypto";
import { query } from "./db.js";

const COOKIE = "nm_session";
const DAYS = 30;

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
  const secure = req.headers["x-forwarded-proto"] === "https" || (req.socket && req.socket.encrypted);
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DAYS * 86400}${secure ? "; Secure" : ""}`;
}
export function clearCookie() { return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`; }

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

export function passwordMatches(given) {
  const want = process.env.APP_PASSWORD || "";
  if (!want) return false;
  const a = Buffer.from(String(given ?? "")), b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* The single configured user, created on first login. */
export async function ensureUser() {
  const email = (process.env.APP_USER_EMAIL || "owner@localhost").trim().toLowerCase();
  const r = await query("INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id, email", [email]);
  return r.rows[0];
}

export async function userById(id) {
  const r = await query("SELECT id, email FROM users WHERE id = $1", [id]);
  return r.rows[0] || null;
}

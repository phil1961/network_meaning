/* ─────────────────────────────────────────────
   File: tests/server.test.js
   File Version: 0.2.1
   ─────────────────────────────────────────────
   The HTTP surface without a database: the page, health, and the
   sign-in gate. Nothing here needs DATABASE_URL or a key. */
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
process.env.SESSION_SECRET = process.env.SESSION_SECRET || "test-secret-test-secret";
process.env.APP_PASSWORD = process.env.APP_PASSWORD || "correct horse";
delete process.env.DATABASE_URL;
const { handle } = await import("../server.js");

let server, base;
test.before(async () => {
  server = http.createServer(handle);
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => new Promise(r => server.close(r)));

test("health reports the missing database honestly", async () => {
  const r = await fetch(base + "/health");
  assert.equal(r.status, 503);
  const j = await r.json();
  assert.equal(j.ok, false);
  assert.equal(j.db, false);
  assert.match(j.version, /^\d+\.\d+\.\d+$/);
});

test("the built page is served at the root", async () => {
  if (!fs.existsSync(path.join(here, "..", "public", "index.html"))) { console.log("  (public/index.html not built; run node build.js)"); return; }
  const r = await fetch(base + "/");
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-type"), /text\/html/);
  const html = await r.text();
  assert.match(html, /<title>Network Meaning<\/title>/);
  assert.match(html, /==== module shared\/replay\.js ====/);
  assert.doesNotMatch(html, /Faith is furnished by memory|Phil's archived chats|Verbenade Capsaro|Phil talking about faith/, "the owner's own sample and words are not in the page everyone gets");
});

test("the API is gated by the session cookie", async () => {
  for (const p of ["/api/me", "/api/streams"]) {
    const r = await fetch(base + p);
    assert.equal(r.status, 401, p);
    const j = await r.json();
    assert.equal(j.error.code, "signed_out");
  }
});

test("a wrong password is refused, a malformed body is a 400, unknown routes are 404", async () => {
  const bad = await fetch(base + "/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "nope" }) });
  assert.equal(bad.status, 401);
  const malformed = await fetch(base + "/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{not json" });
  assert.equal(malformed.status, 400);
  const missing = await fetch(base + "/nowhere");
  assert.equal(missing.status, 404);
  const fav = await fetch(base + "/favicon.ico");
  assert.equal(fav.status, 204);
});

test("who may sign up is public; the admin panel and signing up without a database are not open doors", async () => {
  const a = await fetch(base + "/api/auth");
  assert.equal(a.status, 200);
  assert.ok(["open", "code", "closed"].includes((await a.json()).signup));
  assert.equal((await fetch(base + "/api/admin/users")).status, 401);
  const bad = await fetch(base + "/api/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "nope", password: "long-enough-pw" }) });
  assert.equal(bad.status, 400, "a bad email is refused before anything else is tried");
});

test("a forged session cookie is ignored", async () => {
  const r = await fetch(base + "/api/me", { headers: { cookie: "nm_session=1.99999999999999.forged" } });
  assert.equal(r.status, 401);
});

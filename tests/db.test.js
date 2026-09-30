/* ─────────────────────────────────────────────
   File: tests/db.test.js
   File Version: 0.1.1
   ─────────────────────────────────────────────
   Streams and steps against a real Postgres. Skips unless TEST_DATABASE_URL
   is set (never the production DATABASE_URL: this test creates and drops
   its own schema). Example:
     TEST_DATABASE_URL=postgres://user:pass@localhost:5432/network_meaning_test node --test tests/ */
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

const URL_ = process.env.TEST_DATABASE_URL;
const skip = URL_ ? false : "TEST_DATABASE_URL is not set";

let server, base, cookie, streams, db, closePool;
/* Hooks take the function first and ignore a skip option, so they check it themselves. */
test.before(async () => {
  if (skip) return;
  process.env.DATABASE_URL = URL_;
  process.env.SESSION_SECRET = "test-secret-test-secret";
  process.env.APP_PASSWORD = "correct horse";
  process.env.APP_USER_EMAIL = "test@example.com";
  db = await import("../src/server/db.js");
  closePool = db.closePool;
  const schema = "nm_test_" + Date.now().toString(36);
  await db.query(`CREATE SCHEMA ${schema}`);
  await db.closePool();
  process.env.DATABASE_URL = URL_ + (URL_.includes("?") ? "&" : "?") + "options=-c%20search_path%3D" + schema;
  process.env.NM_TEST_SCHEMA = schema;
  const { migrate } = await import("../src/server/migrate.js");
  const r = await migrate(() => {});
  assert.ok(r.version >= 1);
  streams = await import("../src/server/streams.js");
  const { handle } = await import("../server.js");
  server = http.createServer(handle);
  await new Promise(res => server.listen(0, "127.0.0.1", res));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  if (skip) return;
  if (server) await new Promise(r => server.close(r));
  if (db) { try { await db.query(`DROP SCHEMA ${process.env.NM_TEST_SCHEMA} CASCADE`); } catch { /* best effort */ } await closePool(); }
});

const j = async (method, p, body, extra = {}) => {
  const r = await fetch(base + p, { method, headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) }, body: body ? JSON.stringify(body) : undefined, ...extra });
  return { status: r.status, body: await r.json().catch(() => null), headers: r.headers };
};

test("login sets a cookie and creates the one user", { skip }, async () => {
  const r = await j("POST", "/api/login", { password: "correct horse" });
  assert.equal(r.status, 200);
  assert.equal(r.body.email, "test@example.com");
  cookie = r.headers.get("set-cookie").split(";")[0];
  const me = await j("GET", "/api/me");
  assert.equal(me.status, 200);
});

test("streams: create, list, append action, get, rename, branch, delete", { skip }, async () => {
  const c = await j("POST", "/api/streams", { name: "one", steps: [{ kind: "ingest", date: "Sep 1", source: "seed", text: "t", result: { add: { a: { t: "A", kind: "idea", stuck: true, src: "user_said", words: "w", slots: [], history: [] } }, touch: [], replace: [], links: [], flags: [], question: "" } }] });
  assert.equal(c.status, 201);
  const id = c.body.id;
  const act = await j("POST", `/api/streams/${id}/steps`, { kind: "action", action: { type: "anchor", id: "a" }, source: "anchor", date: "Sep 2" });
  assert.equal(act.status, 201);
  assert.equal(act.body.step.seq, 1);
  const bad = await j("POST", `/api/streams/${id}/steps`, { kind: "ingest", text: "x" });
  assert.equal(bad.status, 400);
  const g = await j("GET", `/api/streams/${id}`);
  assert.equal(g.body.steps.length, 2);
  assert.equal(g.body.steps[0].result.add.a.words, "w");
  assert.equal(g.body.steps[1].action.type, "anchor");
  const list = await j("GET", "/api/streams");
  assert.equal(list.body.find(s => s.id === id).stepCount, 2);
  const rn = await j("PATCH", `/api/streams/${id}`, { name: "renamed" });
  assert.equal(rn.body.name, "renamed");
  const br = await j("POST", "/api/streams", { name: "branch", fromStreamId: id, atSeq: 1 });
  assert.equal(br.status, 201);
  assert.equal(br.body.stepCount, 1);
  const bg = await j("GET", `/api/streams/${br.body.id}`);
  assert.equal(bg.body.parentStreamId, id);
  assert.equal(bg.body.branchAtSeq, 1);
  const del = await j("DELETE", `/api/streams/${id}`);
  assert.equal(del.status, 200);
  assert.equal((await j("GET", `/api/streams/${id}`)).status, 404);
});

test("ingest without a key fails cleanly and logs the call", { skip }, async () => {
  delete process.env.ANTHROPIC_API_KEY;
  const c = await j("POST", "/api/streams", { name: "two", steps: [] });
  const r = await j("POST", `/api/streams/${c.body.id}/ingest`, { text: "Some words here.", source: "unit", tier: "quick" });
  assert.equal(r.status, 502);
  assert.equal(r.body.error.code, "no_key");
  const calls = await db.query("SELECT status FROM api_calls");
  assert.equal(calls.rows.length, 1);
  assert.equal(calls.rows[0].status, "error");
});

test("appendStep assigns dense sequence numbers under concurrency", { skip }, async () => {
  const s = await streams.createStream(1, { name: "concurrent", steps: [] });
  await Promise.all(Array.from({ length: 6 }, (_, i) => streams.appendStep(1, s.id, { kind: "action", action: { type: "noop", i }, source: "t", date: "d" })));
  const got = await streams.getStream(1, s.id);
  assert.deepEqual(got.steps.map(x => x.seq), [0, 1, 2, 3, 4, 5]);
});

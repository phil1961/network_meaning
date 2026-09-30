/* ─────────────────────────────────────────────
   File: src/server/db.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   One pg pool for the process. DATABASE_URL comes from .env (loaded by the
   entry point) or the environment. Nothing here knows about streams. */

import pg from "pg";

let pool = null;

export function hasDatabase() { return !!process.env.DATABASE_URL; }

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 8 });
    pool.on("error", e => console.error("[db] idle client error:", e.message));
  }
  return pool;
}

export function query(text, params = []) { return getPool().query(text, params); }

/* Run fn(client) inside a transaction. Commits on return, rolls back on throw. */
export async function withTx(fn) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch { /* connection is gone */ }
    throw e;
  } finally {
    client.release();
  }
}

export async function closePool() { if (pool) { await pool.end(); pool = null; } }

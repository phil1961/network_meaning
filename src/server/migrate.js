/* ─────────────────────────────────────────────
   File: src/server/migrate.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   Numbered SQL files in sql/, applied in order, each in its own
   transaction, tracked in a one-row schema_version table. The same idea
   as the hand-rolled runner in home_finder_agents_social, without an ORM.

     node src/server/migrate.js        apply pending
     node src/server/migrate.js --status */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withTx, query, closePool, hasDatabase } from "./db.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const SQL_DIR = path.resolve(here, "..", "..", "sql");

export function listMigrations() {
  return fs.readdirSync(SQL_DIR)
    .filter(f => /^\d{3}-.*\.sql$/.test(f))
    .sort()
    .map(f => ({ version: parseInt(f.slice(0, 3), 10), file: f, sql: fs.readFileSync(path.join(SQL_DIR, f), "utf8") }));
}

async function currentVersion(client) {
  await client.query("CREATE TABLE IF NOT EXISTS schema_version (id integer PRIMARY KEY CHECK (id = 1), version integer NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())");
  const r = await client.query("SELECT version FROM schema_version WHERE id = 1");
  return r.rows.length ? r.rows[0].version : 0;
}

export async function migrate(log = console.log) {
  const all = listMigrations();
  let applied = 0;
  for (const m of all) {
    await withTx(async client => {
      const cur = await currentVersion(client);
      if (m.version <= cur) return;
      if (m.version !== cur + 1) throw new Error(`migration ${m.file} skips from version ${cur}`);
      await client.query(m.sql);
      await client.query("INSERT INTO schema_version (id, version) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET version = EXCLUDED.version, applied_at = now()", [m.version]);
      applied++;
      log(`[migrate] applied ${m.file}`);
    });
  }
  const r = await query("SELECT version FROM schema_version WHERE id = 1");
  return { applied, version: r.rows[0]?.version ?? 0, available: all.length };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try { process.loadEnvFile(path.resolve(here, "..", "..", ".env")); } catch { /* no .env: rely on the environment */ }
  if (!hasDatabase()) { console.error("DATABASE_URL is not set. Copy .env.example to .env first."); process.exit(2); }
  const status = process.argv.includes("--status");
  (status
    ? withTx(currentVersion).then(v => console.log(`[migrate] at version ${v}, ${listMigrations().length} available`))
    : migrate().then(r => console.log(`[migrate] ${r.applied} applied, now at version ${r.version} of ${r.available}`))
  ).catch(e => { console.error("[migrate] failed:", e.message); process.exitCode = 1; })
   .finally(closePool);
}

/* ─────────────────────────────────────────────
   File: src/server/streams.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   Streams and their append-only steps. Every function takes the userId
   first and only ever sees that user's rows. */

import { query, withTx } from "./db.js";

const STEP_COLS = "seq, kind, at, date, source, text, model, tier, action, result, usage";

function rowToStep(r) {
  const s = { seq: r.seq, kind: r.kind, at: r.at instanceof Date ? r.at.toISOString() : r.at, date: r.date, source: r.source };
  if (r.kind === "ingest") { s.text = r.text; s.model = r.model; s.tier = r.tier; s.result = r.result; s.usage = r.usage; }
  else s.action = r.action;
  return s;
}

export async function listStreams(userId) {
  const r = await query(`SELECT s.id, s.name, s.created_at, s.updated_at, s.parent_stream_id, s.branch_at_seq,
      (SELECT count(*) FROM steps t WHERE t.stream_id = s.id)::int AS step_count
    FROM streams s WHERE s.user_id = $1 ORDER BY s.updated_at DESC`, [userId]);
  return r.rows.map(x => ({ id: x.id, name: x.name, stepCount: x.step_count, createdAt: x.created_at, updatedAt: x.updated_at, parentStreamId: x.parent_stream_id, branchAtSeq: x.branch_at_seq }));
}

export async function getStream(userId, id) {
  const s = await query("SELECT id, name, created_at, updated_at, parent_stream_id, branch_at_seq FROM streams WHERE id = $1 AND user_id = $2", [id, userId]);
  if (!s.rows.length) return null;
  const st = await query(`SELECT ${STEP_COLS} FROM steps WHERE stream_id = $1 ORDER BY seq`, [id]);
  const x = s.rows[0];
  return { id: x.id, name: x.name, createdAt: x.created_at, updatedAt: x.updated_at, parentStreamId: x.parent_stream_id, branchAtSeq: x.branch_at_seq, steps: st.rows.map(rowToStep) };
}

function insertStepSQL(client, streamId, seq, step) {
  return client.query(`INSERT INTO steps (stream_id, seq, kind, at, date, source, text, model, tier, action, result, usage)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [streamId, seq, step.kind, step.at || new Date().toISOString(), step.date || "", step.source || "",
      step.kind === "ingest" ? (step.text ?? null) : null, step.model ?? null, step.tier ?? null,
      step.kind === "action" ? JSON.stringify(step.action || {}) : null,
      step.kind === "ingest" ? JSON.stringify(step.result || {}) : null,
      step.usage ? JSON.stringify(step.usage) : null]);
}

/* Create an empty stream, a stream seeded with given steps (the sample
   snapshot), or a branch copied from another stream up to atSeq. */
export async function createStream(userId, { name, steps = [], fromStreamId = null, atSeq = null }) {
  return withTx(async client => {
    let copy = [];
    if (fromStreamId) {
      const own = await client.query("SELECT id FROM streams WHERE id = $1 AND user_id = $2", [fromStreamId, userId]);
      if (!own.rows.length) throw Object.assign(new Error("source stream not found"), { status: 404 });
      const r = await client.query(`SELECT ${STEP_COLS} FROM steps WHERE stream_id = $1 AND seq < $2 ORDER BY seq`, [fromStreamId, atSeq ?? 1e9]);
      copy = r.rows.map(rowToStep);
    }
    const all = fromStreamId ? copy : steps;
    const s = await client.query("INSERT INTO streams (user_id, name, parent_stream_id, branch_at_seq) VALUES ($1,$2,$3,$4) RETURNING id, name, created_at, updated_at",
      [userId, String(name || "Untitled").slice(0, 200), fromStreamId, fromStreamId ? (atSeq ?? copy.length) : null]);
    const id = s.rows[0].id;
    for (let i = 0; i < all.length; i++) await insertStepSQL(client, id, i, all[i]);
    return { id, name: s.rows[0].name, stepCount: all.length, createdAt: s.rows[0].created_at, updatedAt: s.rows[0].updated_at };
  });
}

/* Append one step. seq is assigned under a row lock so two appends can
   never collide. Returns the step as stored. */
export async function appendStep(userId, streamId, step) {
  return withTx(async client => {
    const own = await client.query("SELECT id FROM streams WHERE id = $1 AND user_id = $2 FOR UPDATE", [streamId, userId]);
    if (!own.rows.length) throw Object.assign(new Error("stream not found"), { status: 404 });
    const c = await client.query("SELECT coalesce(max(seq), -1) + 1 AS next FROM steps WHERE stream_id = $1", [streamId]);
    const seq = c.rows[0].next;
    const stored = { ...step, seq, at: step.at || new Date().toISOString() };
    await insertStepSQL(client, streamId, seq, stored);
    await client.query("UPDATE streams SET updated_at = now() WHERE id = $1", [streamId]);
    return stored;
  });
}

export async function renameStream(userId, id, name) {
  const r = await query("UPDATE streams SET name = $3, updated_at = now() WHERE id = $1 AND user_id = $2 RETURNING id, name", [id, userId, String(name || "Untitled").slice(0, 200)]);
  return r.rows[0] || null;
}

export async function deleteStream(userId, id) {
  const r = await query("DELETE FROM streams WHERE id = $1 AND user_id = $2", [id, userId]);
  return r.rowCount > 0;
}

export async function logApiCall({ userId, streamId, seq, model, latencyMs, inputTokens, outputTokens, status, error }) {
  try {
    await query("INSERT INTO api_calls (user_id, stream_id, seq, model, latency_ms, input_tokens, output_tokens, status, error) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [userId ?? null, streamId ?? null, seq ?? null, model, latencyMs ?? null, inputTokens ?? null, outputTokens ?? null, status, error ? String(error).slice(0, 500) : null]);
  } catch (e) { console.error("[api_calls] not logged:", e.message); }
}

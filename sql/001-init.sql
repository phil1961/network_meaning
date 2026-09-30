-- ─────────────────────────────────────────────
-- File: sql/001-init.sql
-- File Version: 0.1.0
-- ─────────────────────────────────────────────
-- The stream is the source of truth. The map is a replay of steps.
-- Applied once by src/server/migrate.js inside a transaction.

CREATE TABLE IF NOT EXISTS users (
  id          serial PRIMARY KEY,
  email       text NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS streams (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             text NOT NULL,
  parent_stream_id uuid NULL REFERENCES streams(id) ON DELETE SET NULL,
  branch_at_seq    integer NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS streams_user_updated ON streams(user_id, updated_at DESC);

-- Append-only. seq is dense from 0. Never UPDATE a row; a correction is a
-- new step. kind = ingest (text went to the model) | action (the person
-- kept, discarded, anchored, or resolved a loose end).
CREATE TABLE IF NOT EXISTS steps (
  stream_id   uuid NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  seq         integer NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('ingest', 'action')),
  at          timestamptz NOT NULL DEFAULT now(),
  date        text NOT NULL,            -- the short label the person sees, e.g. "Sep 29"
  source      text NOT NULL DEFAULT '', -- where the text came from, in the person's words
  text        text NULL,                -- the raw particulars, kept exactly as written
  model       text NULL,
  tier        text NULL,
  action      jsonb NULL,               -- for kind = action
  result      jsonb NULL,               -- for kind = ingest: the validated model result
  usage       jsonb NULL,               -- tokens, latency, dropped counts
  PRIMARY KEY (stream_id, seq)
);

-- Every call to the model, whether or not it produced a step. Insert-only.
CREATE TABLE IF NOT EXISTS api_calls (
  id             bigserial PRIMARY KEY,
  at             timestamptz NOT NULL DEFAULT now(),
  user_id        integer NULL,
  stream_id      uuid NULL,
  seq            integer NULL,
  model          text NOT NULL,
  latency_ms     integer NULL,
  input_tokens   integer NULL,
  output_tokens  integer NULL,
  status         text NOT NULL,         -- ok | error | refused | cancelled
  error          text NULL
);

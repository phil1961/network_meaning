-- ─────────────────────────────────────────────
-- File: sql/002-users.sql
-- File Version: 0.1.0
-- ─────────────────────────────────────────────
-- Many people, each with a personal area (Phil, 2026-09-30). Email is the
-- unique key and was already. A person signs up themselves or is added by
-- an admin. Three levels: what a user does is stored; what a guest does is
-- not; an admin is a user who can also add people and share streams. The
-- owner's row (APP_USER_EMAIL) is made an admin at sign-in.
-- A stream its owner marks shared is listed for everyone, read-only.

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text NULL;          -- scrypt; null for the owner, who signs in with APP_PASSWORD
ALTER TABLE users ADD COLUMN IF NOT EXISTS level         text NOT NULL DEFAULT 'user' CHECK (level IN ('guest', 'user', 'admin'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled_at   timestamptz NULL;   -- set = cannot sign in; nothing is deleted
ALTER TABLE users ADD COLUMN IF NOT EXISTS added_by      integer NULL REFERENCES users(id) ON DELETE SET NULL;  -- null = signed up themselves

ALTER TABLE streams ADD COLUMN IF NOT EXISTS shared boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS streams_shared ON streams(updated_at DESC) WHERE shared;

CREATE INDEX IF NOT EXISTS api_calls_user_at ON api_calls(user_id, at DESC);

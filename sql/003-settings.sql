-- ─────────────────────────────────────────────
-- File: sql/003-settings.sql
-- File Version: 0.1.0
-- ─────────────────────────────────────────────
-- Settings an admin can change from the Admin tab, without editing a file
-- on the server (Phil, 2026-09-30: sign-up by invite code). One row per
-- setting. A row here wins over the same setting in .env or web.config;
-- with no row, the server's own setting stands.
--   signup       open | code | closed
--   signup_code  the invite code, when signup = code

CREATE TABLE IF NOT EXISTS settings (
  key         text PRIMARY KEY,
  value       text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  integer NULL REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- File: sql/004-logins.sql
-- File Version: 0.1.0
-- ─────────────────────────────────────────────
-- How often each person has signed in, and when they first and last did
-- (Phil, 2026-10-01: "I want to track the number of times a user logs in
-- and his first and last login DTGs"). Counted from the day this is
-- applied: sign-ins before it were not recorded, so an existing account
-- starts at 0 with no dates until its next sign-in.

ALTER TABLE users ADD COLUMN IF NOT EXISTS login_count    integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login_at timestamptz NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at  timestamptz NULL;

# Network Meaning

A meaning map of the ideas a person presents. Their words are kept verbatim,
the machine's readings are marked as such, and every change is a step in an
append-only stream that can be rewound, branched, and replayed.

The theology and the thinking behind it are in `HANDOFF.md`, `VISION.md`,
and `HANDOFF-Salient-Points.md`. The source chats are in `_archive/`.
`mockup.html` is the original prototype this app was built to match.

## Stack

- **Node 22+**, ES modules, no framework. Two dependencies: `pg` and
  `@anthropic-ai/sdk`.
- **Postgres 16.** The stream (`streams`, `steps`) is the source of truth.
  The map is a replay of the steps, in memory, on both server and client.
- **One page.** `src/client/` is assembled by `build.js` into
  `public/index.html`. The shared replay and span code in `src/shared/` is
  inlined into that page and imported by the server, so both sides run the
  same reducer.
- **IIS** through `HttpPlatformHandler` (see `web.config`), or plain
  `node server.js` anywhere.

## Run it locally

```
copy .env.example .env        # then fill in DATABASE_URL, ANTHROPIC_API_KEY, APP_PASSWORD, SESSION_SECRET
npm install
node build.js                 # writes public/index.html
node server.js                # applies sql/ migrations, then listens on PORT (default 8787)
```

Open http://127.0.0.1:8787, sign in with `APP_PASSWORD`, and paste text into
**Add text**. The built-in sample streams work without a database or key;
ideaifying needs both.

Create the database once (any name, put it in `DATABASE_URL`). The owner
must be the role in `DATABASE_URL`, or migrations cannot create tables:

```
psql -U postgres -c "CREATE DATABASE network_meaning OWNER network_meaning"
```

## The State view

Beside the map, the app keeps the person's **state**: facts that are true
for them now, **goals** put forth, and every **move** toward a goal. When a
goal is reached, the state changes so that the goal is now part of it. All
of it is action steps in the stream, so it rewinds and branches with the
map. Goals and moves stated in pasted text are read out by the model and
wait for the person to confirm them. The built-in sample *Bobby and the
milk* walks through it; the data there is made up.

## Gates

```
node build.js --check         # public/index.html matches src/
npm test                      # unit + HTTP tests, no database or key needed
npm run smoke                 # drives the page in headless Brave/Chrome/Edge; skips if none
TEST_DATABASE_URL=... npm test   # also runs the Postgres tests in a throwaway schema
```

`public/index.html` is generated. Edit `src/`, rebuild, commit both.

## Layout

| Path | What |
|---|---|
| `server.js` | HTTP entry point: the page, `/health`, and the JSON API |
| `src/server/` | `db.js` (pool), `migrate.js` (numbered SQL), `auth.js` (signed cookie), `ideaify.js` (prompt + Claude call), `normalize.js` (validate the answer), `streams.js` (append-only store) |
| `src/shared/` | `replay.js` (steps → map), `spans.js` (text → spans); ESM for the server, inlined for the page |
| `src/client/` | `page.html`, `style.css`, numbered modules in load order (`65-statelayer.js` is the State view) |
| `sql/` | `001-init.sql` and later migrations |
| `tests/` | `node --test` suites and `smoke.browser.js` |
| `build.js` | Assembler and `--check` gate |
| `web.config` | IIS hosting via HttpPlatformHandler |

## API

All routes except login need the session cookie.

```
POST /api/login {password}          POST /api/logout          GET /api/me
GET  /api/streams                   POST /api/streams {name, steps?} | {name, fromStreamId, atSeq}
GET  /api/streams/:id               PATCH /api/streams/:id {name}      DELETE /api/streams/:id
POST /api/streams/:id/steps  {kind:"action", action, source, date}
POST /api/streams/:id/ingest {text, source, tier}     -> {step, dropped}
GET  /health
```

## Models

The **Depth** control maps to `MODEL_QUICK`, `MODEL_DEFAULT`, `MODEL_COMPLEX`
in `.env` (defaults: Haiku 4.5, Sonnet 5.5, Opus 5.5). The answer is
constrained to a JSON schema on the server, then validated by
`normalize.js`: an idea with no span citation is dropped and counted, and an
idea's words are always assembled from the spans it cites. Goals and moves
read in the text follow the same rule.

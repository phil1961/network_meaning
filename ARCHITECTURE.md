# Network Meaning: Engineering and Architecture

Written 2026-09-30 by Claude at Phil's request, from a full read of the code
and the root docs at app version 0.7.0. It describes what is built, lists what
the review found, and ends with Claude's opinion on what to improve to reach
the vision. The opinion is Claude's, not Phil's words.

The same document is kept as a Claude Doc, where the two diagrams are drawn:
https://claude.ai/code/artifact/be76e7f6-bf0b-41a0-9a1c-62c0a37689af

## Summary

network-meaning is one web page over an append-only event log: one Node process, one Postgres database, and Claude for two kinds of call. It is at version 0.7.0, about 4,400 lines of source and 1,600 lines of tests, written in eleven commits over three days.

The core design is sound and applied consistently. A stream is an ordered list of steps. The idea map, the State view and the four world maps are all a pure replay of those steps, run by the same reducer in the browser and on the server. Rewind, branch and reload follow from that, and no feature since the first schema has needed a new table for its content.

Where it stands against the vision:

- **Built and working:** text in, ideas out with verbatim citations; loose ends; one question; State (facts, goals, moves); four world maps with given and supposed items; a scripting language and stepper; Help analysis; accounts at three levels; a screen before every AI call.
- **Simulated or absent:** voice (the Talk tab is a scripted demo), bets, surprise scoring, the attention budget, the verifier pass, embeddings, containers, perspectives, the motivation battery, the foundation corpus.
- **No structure yet:** many worlds that meet, coordination, and AI filling in. A stream has an owner but no subject, a step has no author, and the map exists only in memory, so nothing can be asked across streams.

This review read every source file and the root docs, ran the gate, and ran three small probes against the code. The gate passes: the build check is clean and 68 tests ran, 57 passing and 11 skipped for lack of a test database. The browser smoke test and the Postgres tests were not run.

Two cautions about the tree itself. Everything after 0.2.0 is uncommitted: 31 modified files and 12 new ones on master, covering five releases. And the root docs, `package.json` and `build.js` were rewritten by another session while this review was reading them, between 22:30 and 22:34. The changed parts were read again. This document describes the tree as it stood at 22:36 on 2026-09-30.

## System context and deployment

Four parts carry the system: the browser, IIS, one Node process and Postgres. The Anthropic API is the only outside service the server calls.

```
One reducer runs on both sides of the wire.

Browser: one generated page, public/index.html
  [ Steps and a cursor ] --> [ replay.js, inlined * ] --> [ Views ]
    the stream in hand;        steps in, state out;        Map, State, Add text,
    rewind moves the           runs on every change        Loose Ends, Timeline,
    cursor only                                            Script, Help
            ^
            |  JSON over HTTPS, signed cookie
            v
IIS with HttpPlatformHandler: starts node.exe and proxies to 127.0.0.1
            ^
            v
Node server, server.js: routes and guards, no state between requests
  [ auth.js and streams.js ]   [ The AI path ]             [ replay.js, imported * ]
    who may read or write;       screen.js, then the         rebuilds the state
    appends a step under         model, then                 before every AI call
    a lock                       normalize.js
            |                          |
            | SQL                      | HTTPS, the key stays on the server
            v                          v
  [ Postgres 16 ]              [ Anthropic API ]
    users, streams, steps,       Ideaify and Help analysis,
    api_calls. Never the map.    answers held to a schema

* the same file on both sides
```

The page and the server turn steps into state with the same file, so they cannot disagree about what a step does.

| Part | What it is | Notes |
| --- | --- | --- |
| Browser | One generated page, `public/index.html`, about 227 KB, 19 modules inlined | No framework and no script dependencies. Fonts load from Google Fonts. |
| IIS | `web.config` with HttpPlatformHandler | Starts `node.exe server.js`, passes the port in `HTTP_PLATFORM_PORT`, one process per application, stdout to `logs/` |
| Node server | `server.js` on Node 22 or later (24.14 on this machine), ES modules, built-in `http` | Listens on 127.0.0.1 only. Two dependencies: `pg` and `@anthropic-ai/sdk`. `BASE_PATH` supports a sub-path mount. |
| Postgres 16 | Database `network_meaning`, a pool of 8 connections | Numbered SQL migrations run at start, each in its own transaction |
| Anthropic API | Two calls: Ideaify and Help analysis | Three tiers set by environment: `claude-haiku-4-5`, `claude-sonnet-5-5`, `claude-opus-5-5` |

Configuration comes from `.env` beside `server.js`. It is read only when `server.js` is the program, so tests never pick up the real database. The settings the code reads are `DATABASE_URL`, `ANTHROPIC_API_KEY`, `SESSION_SECRET`, `APP_PASSWORD`, `APP_USER_EMAIL`, `SIGNUP`, `SIGNUP_CODE`, `SIGNUP_LEVEL`, `DAILY_CALL_LIMIT`, `MODEL_QUICK`, `MODEL_DEFAULT`, `MODEL_COMPLEX`, `PORT` and `BASE_PATH`. That list is taken from the code; `.env.example` could not be read in this session.

`web.config` points IIS at `D:\Projects\network-meaning\server.js`, which is the git working copy. As written, there is no separate release folder: an uncommitted edit goes live on the next app-pool restart.

## Repository layout and build

The page is assembled by plain concatenation, with no bundler and no build dependencies.

| Path | Lines | What it holds |
| --- | --- | --- |
| `server.js` | 298 | HTTP entry point, routing, the two AI routes, error mapping |
| `src/server/` | 897 | `db`, `migrate`, `auth`, `streams`, `screen`, `ideaify`, `normalize`, `analyze` |
| `src/shared/` | 829 | `replay.js` (the reducer), `script.js` (the scripting language), `spans.js` (text to spans) |
| `src/client/` | 2,204 | `page.html`, `style.css`, and 16 numbered modules |
| `sql/` | 77 | `001-init.sql`, `002-users.sql` |
| `tests/` | 1,566 | Nine `node --test` suites and `smoke.browser.js` |
| `build.js` | 104 | The assembler and its `--check` gate |
| `public/index.html` | generated | Committed. Never edited by hand. |
| Root `.md` files |  | `README`, `HELP`, `VISION`, `HANDOFF`, `HANDOFF-Salient-Points`, `METHOD-Deriving-the-Maps`, and three phone-session notes |
| `mockup.html`, `_archive/` |  | The original prototype and the 14 source transcripts |

How `build.js` makes the page:

1. Reads `src/shared/*.js`, strips the `export` keywords, and refuses any file that has an `import`.
2. Appends `src/client/NN-*.js` in filename order. The numeric prefix is the dependency order.
3. Wraps everything in one strict-mode function and substitutes it, the stylesheet, and `HELP.md` rendered to HTML into `page.html`.
4. Fails if `BUILD.version` in `00-build.js` differs from `package.json`, if a marker survives, or if any module contains a closing script tag.

`node build.js --check` rebuilds in memory and fails if the committed page differs. `npm run gate` is that check followed by the unit tests.

Two consequences follow. The shared files run unchanged on both sides, so the browser and the server cannot disagree about what a step does. And all client modules share one scope: state is a handful of top-level variables (`S`, `stream`, `cursor`, `focus`, `mapSel`, `me`), and a later module can call anything an earlier one defined.

## Data model

The database stores who, which stream, and the ordered steps. It does not store the map.

| Table | Key columns | Notes |
| --- | --- | --- |
| `users` | `id`, `email` (unique), `password_hash`, `level`, `disabled_at`, `added_by` | Levels are guest, user, admin. The owner has no hash and signs in with `APP_PASSWORD`. |
| `streams` | `id` (uuid), `user_id`, `name`, `parent_stream_id`, `branch_at_seq`, `shared` | One owner per stream. `shared` is a single flag: readable by everyone signed in. |
| `steps` | (`stream_id`, `seq`), `kind`, `at`, `date`, `source`, `text`, `model`, `tier`, `action`, `result`, `usage` | Append-only by convention. `kind` is `ingest` or `action`. `action` and `result` are JSON. |
| `api_calls` | `user_id`, `stream_id`, `seq`, `model`, tokens, latency, `status`, `error` | One row per model call or screened refusal. No foreign keys. Feeds the daily limit. |
| `schema_version` | one row | Written by `migrate.js` |

A step is one of two shapes.

- **Ingest:** the raw text, and the validated model result: `add` (new ideas and readings), `touch` (ideas said again), `replace`, `links`, `flags`, `goals`, `question`.
- **Action:** one thing a person, a script or the server did. There are 18 types.

| Group | Action types | Written by |
| --- | --- | --- |
| Idea map | `keep`, `discard`, `anchor`, `flag` | Person or script |
| State | `state`, `release`, `goal`, `acceptgoal`, `rejectgoal`, `move`, `reach`, `regoal` | Person or script |
| World maps | `item`, `link`, `ask`, `confirm`, `ruleout` | Person or script |
| Help analysis | `analysis` | Server only |

Three properties of this model matter for what comes later.

- **Content needs no migration.** Every feature since the first schema added action types to the reducer, not tables. The one migration since, `002-users.sql`, was for accounts.
- **The map is not queryable.** Ideas, links, goals, facts and world items exist only as the in-memory result of a replay. No SQL can ask which streams mention a store, or who has an open goal.
- **Dates are labels.** `steps.date` is free text such as "Sep 30", with no year. `at` is when the step was recorded. Nothing records when a thing was said in a form that can be sorted or subtracted.

## Server architecture

The server is one file of routing over eight small modules, and it holds no state between requests except the connection pool.

| Module | Responsibility |
| --- | --- |
| `server.js` | Routes, JSON bodies up to 4 MB, error mapping, the guards around the two AI routes |
| `auth.js` | Sign-in, sign-up, levels, scrypt hashes, the signed session cookie, the daily call count |
| `streams.js` | List, read, create, branch, append, rename, share, delete; the `api_calls` log |
| `screen.js` | The check before every AI call: junk for everyone, orders aimed at the AI for non-admins |
| `ideaify.js` | The Ideaify prompt, its JSON schema, and the one function that calls Claude |
| `normalize.js` | Turns the model's answer into a step result; drops anything that cites no span |
| `analyze.js` | The Help analysis prompt, schema and validation |
| `db.js`, `migrate.js` | The pool, transactions, numbered migrations |

| Route | Who | What it does |
| --- | --- | --- |
| `GET /health` | anyone | Version and whether the database answers |
| `GET /api/auth`, `POST /api/login`, `/signup`, `/logout` | anyone | Sign-up mode, sign in, create an account, sign out |
| `GET /api/me` | signed in | The current user and level |
| `GET, POST /api/admin/users`, `PATCH /api/admin/users/:id` | admin | List and add people; set level, password, disabled |
| `GET /api/streams`, `GET /api/streams/:id` | signed in | Own streams and shared ones |
| `POST /api/streams` | user, admin | Create empty, seeded with steps, or branched from a stream at a step |
| `PATCH, DELETE /api/streams/:id` | owner; sharing is admin only | Rename, share, delete |
| `POST /api/streams/:id/steps` | owner | Append one action step. Any action JSON under 20,000 characters is accepted, except `analysis`. |
| `POST /api/streams/:id/ingest` | owner | Ideaify text into an ingest step |
| `POST /api/streams/:id/analyze` | owner | Help analysis into an `analysis` step |

Both AI routes pass the same guards in the same order:

1. The stream must belong to the caller. A shared stream is refused.
2. The caller must be under the daily limit, 40 calls unless set. Admins are exempt.
3. The server loads every step and replays them to get the current state.
4. `screen.js` checks the new text, its label, and the listing of what is already in the stream.
5. One call to Claude, with the answer held to a JSON schema.
6. `normalize.js` or `normalizeAnalysis` rebuilds the result from the person's own spans or from ids that exist, and counts what it drops.
7. The step is appended under a row lock on the stream, and the call is logged.

Sessions are a signed cookie holding the user id and an expiry 30 days out. There is no session table. Every request looks the user up again, so disabling an account takes effect at once.

## Shared logic: the event-sourced core

Three files with no imports are the heart of the system, and they are the part most worth protecting.

**`replay.js`** turns steps into state. `replay(steps)` starts from an empty state and applies each step in order. The state it builds:

| Field | Holds |
| --- | --- |
| `nodes` | Ideas in the person's words, the machine's readings, and world-map items, in one table keyed by id |
| `links` | Labelled links between any two nodes, marked when one end is a reading |
| `flags`, `outcomes` | Loose ends, and what the person decided about each |
| `state` | Facts true now or once true, with the date each began and ended |
| `goals` | Goals with status (proposed, open, reached, stuck, dropped), moves and history |
| `analysis` | The latest Help analysis and how many steps have passed since |
| `passes`, `question` | One entry per ingest, and the last question the model asked |

The same file holds the queries the views use: which node to put in the middle, whether an idea is arriving, settled, fading or quiet, the shortest derivation path to an anchor, and the two listings the model is shown.

**`script.js`** is the scripting language. `parseScript` reads text into lines and plain-word errors. `planStep` turns one line into an action, a model call or a change of view, given the state at that moment. It has 32 verbs. A script can do only what the buttons can, so a scripted stream is an ordinary stream. The built-in sample *Bobby's world* is a 67-line script run at load, so the sample and the script cannot drift.

**`spans.js`** cuts text into sentence-sized spans, splits long text into passes of at most 60,000 characters, and prints span citations.

The promises the product makes, and where each is actually enforced:

| Promise | Enforced in |
| --- | --- |
| An idea's quoted words are the person's own, verbatim | `normalize.js`: words are assembled from cited spans, never from model text |
| An idea, goal or move that cites nothing is dropped | `normalize.js`, counted and shown to the person |
| A suggestion must point at something real | `analyze.js`, same rule |
| A kept reading stays marked as the machine's | The reducer |
| Only a reading can be kept or discarded; only the person's words can be an anchor | The page and the script planner only. The reducer and the server do not check. |
| An `analysis` step comes only from the server | `server.js` |
| A shared stream is read-only to everyone but its owner | SQL in `streams.js` |

The fifth row is the weak one. It is finding 4 below.

## Client architecture

The page keeps the list of steps and a cursor, replays from zero on every change, and redraws every view.

| Module | Role |
| --- | --- |
| `00-build`, `10-util` | Version and change list; escaping, text measuring, toasts, local storage |
| `20-sample` | Three built-in sample streams, as ordinary steps |
| `30-state` | The global state and `rebuild()`: replay up to the cursor, then render everything |
| `35-api` | The only place that calls the server; a 401 anywhere opens the sign-in card |
| `40-streams` | Open, fork, branch, delete, share; the save queue for action steps |
| `50-streambar` | Stream menu with counts, the step slider, save status |
| `60-map` | The diagram for all four maps, the side panel, search, Draft |
| `65-statelayer` | Now, Past, Goals, and the Help analysis card |
| `70-loose`, `75-timeline` | Loose Ends; the lanes of ideas pass by pass |
| `80-add` | Paste and drop, splitting into passes, Ideaify, the one question, the step list |
| `85-script` | The Script view and the stepper dock |
| `90-talk` | A simulated voice session. No audio is captured. |
| `95-admin`, `97-app` | The People tab; views, sign-in, guest mode, boot |

Nine tabs result: Map, State, Add text, Loose Ends, Timeline, Talk, Script, Help, and People for admins.

How the page behaves:

- **Rendering.** Every view is rebuilt as an HTML string and assigned with `innerHTML`. Every interpolated value passes through `esc()`. Clicks are handled by delegation on each view's container.
- **The diagram.** One layout serves all maps: the focus in the middle and its neighbours on an ellipse. World maps add a second ring. Solid means given, dashed means supposed or the machine's reading, a hollow dot is an open question, a coloured bar names the map.
- **Writing.** An action step is appended locally first, then posted through a serial queue. Ingest and analysis steps are made by the server and appended when they return.
- **Read-only streams.** Samples and shared streams are copied into a stream of the person's own on the first action.
- **Guests.** A guest's stream lives in the tab and is never sent. On sign-in as a user, it is saved.
- **Local storage.** Only the last stream opened and the last script edited.

## Key flows

Four flows cover almost everything the app does.

**Text becomes ideas (Ideaify).**

1. The page splits long text into passes and posts each to `/ingest` with a source label and a depth.
2. The server replays the stream, screens the text and the stream's listing, and cuts the text into numbered spans.
3. The prompt shows the model the existing map by title (the 160 most recently touched ideas), the open facts and goals, and the spans.
4. The model returns ideas, readings, links, flags, goals with moves, and one question, each idea citing span numbers.
5. `normalize.js` builds each idea's words from its cited spans, maps a match onto the existing idea, hangs each reading off its basis, and drops what cites nothing.
6. The result is stored as one ingest step. The page appends it and replays.
7. Goals read in the text arrive as proposals. They become goals only when the person says so.

**A person acts.** A button builds an action such as `{type: "move", goalId, text, effect}`. The page appends it, replays, and redraws at once. The save queue then posts it to `/steps`, where the server assigns the next `seq` under a row lock. The server does not replay or validate the action when it stores it.

**Rewind and branch.** The slider sets the cursor and the page replays the first *n* steps. Nothing is sent. Later steps are kept. Branch asks the server to copy steps below the cursor into a new stream that records its parent and the step it left from. No model call is repeated.

**Help analysis.** The page waits for the save queue to empty, then posts to `/analyze`. The server lists the state of play with typed ids (`goal:…`, `state:…`, `flag:…`, `idea:…`), calls the model, and keeps only suggestions that point at something listed and whose kind fits it. The result is stored as an `analysis` step, so it rewinds and reloads without another call.

## Testing

The pure core is well tested, the model is always injected, and nothing tests hostile input to the reducer.

| Suite | Tests | Covers |
| --- | --- | --- |
| `replay.test.js` | 13 | The reducer: ideas, keep, discard, traceback, flags, state layer, analysis, world maps, rewinding |
| `db.test.js` | 11 | Against Postgres: streams, branching, accounts, levels, sharing, the admin panel, the daily limit, the screen, concurrent appends. Skipped without `TEST_DATABASE_URL`. |
| `script.test.js` | 10 | Parsing, planning, pointing at things, the three built-in scripts |
| `normalize.test.js` | 9 | Verbatim assembly, dropping the uncited, matches, replacements, goals and moves, garbage in |
| `server.test.js` | 6 | HTTP without a database: health, the page, the cookie gate, bad input |
| `screen.test.js`, `analyze.test.js`, `spans.test.js` | 5 each | Junk and aimed text; suggestion validation; span cutting |
| `auth.test.js` | 4 | Hashing, email rules, sign-up modes |
| `smoke.browser.js` | 80 checks | Drives the built page in a headless browser. Separate from the gate. |

Run on 2026-09-30 for this review: `npm run gate` passed, with 57 of 68 tests passing and 11 skipped. `HANDOFF.md` records the 11 Postgres tests and the 80 smoke checks passing earlier the same evening; this review did not repeat them.

What is not covered:

- **Model quality.** No test measures whether the ideas, merges, flags or goals the model returns are good. The archive test in `VISION.md` §7 defines that measure and has not been run.
- **Hostile or malformed actions.** No test posts an action with a reserved id, a wrong target or an unknown type. Findings 1 and 4 live here.
- **Cancel and failure paths.** Nothing tests the Stop button end to end or a failed save in the middle of the queue. Findings 2 and 5 live here.
- **Automation.** There is no CI. The gate runs when someone runs it.

## Security and privacy

The basics are done with care, and the posture is right for a handful of invited people. It is not yet right for open sign-up on the internet, which is the default setting.

What is in place:

- **Passwords.** Salted scrypt, constant-time comparison, and a decoy hash so a wrong email takes as long as a wrong password.
- **Sessions.** An HMAC-signed cookie, `HttpOnly`, `SameSite=Lax`, `Secure` behind HTTPS. A disabled account stops on its next request.
- **Walls between people.** Every stream query carries the user id. Writes require ownership. The Postgres tests cover it.
- **The key stays on the server.** Prompts and the Anthropic key never reach the browser.
- **Prompt injection, in layers.** The screen, a rule in both prompts that the text is material and not orders, one bounded line per item, a strict JSON schema, and words rebuilt from the person's own spans.
- **Cost.** A daily call limit per person, with screened refusals counting toward it.
- **Output escaping.** Every value drawn into the page is escaped. No gap was found in this read.
- **Exposure.** The server listens on localhost only. IIS hides `src`, `sql`, `tests`, `.env` and `.git`.

What is missing:

- **A ceiling on total spend.** Sign-up is open unless `SIGNUP` says otherwise, needs no email confirmation, and starts people as users. Each new account brings 40 calls a day on the server's key. `VISION.md` E15 names this risk; nothing yet bounds it.
- **Throttling.** A wrong password costs 400 ms. There is no lockout or rate limit on sign-in or sign-up.
- **Session control.** A cookie is good for 30 days. Changing a password does not end open sessions. Only disabling the account or changing `SESSION_SECRET` does.
- **Self-service.** A person cannot change their own password, export their streams, or delete their account. The vision calls export and privacy "the precondition," not features.
- **Defence in depth in the browser.** No Content-Security-Policy or other security headers. Escaping is the only barrier, and a shared stream shows one person's text to everyone.
- **Server-side validation of actions.** `/steps` stores any JSON. Findings 1 and 4.
- **Data handling.** Streams sit in Postgres as plain text and are sent to the Anthropic API. The help text says both in general terms, but not that the AI is an outside service. See `HELP.md`.

## Docs versus code

The docs that describe what is built are current and accurate. The drift is in the older design sections, which still describe a system that was not built that way.

| Doc | What it says | What the code does |
| --- | --- | --- |
| `README`, `HELP`, `HANDOFF` §15, `VISION` §9 E11 to E16 | Describe 0.7.0: routes, levels, settings, the screen, the action types | Matches. Routes, settings and action types were checked against the source. |
| `VISION` §4.5, data model | Eleven tables (sessions, spans, items, links, slots, flags, bets, probes, anchors, events) and pgvector | Four tables. The map is never stored. No vector search. |
| `VISION` §4.1, the pipeline | Ten stages: capture, spans, extraction, reconcile, slots, score, spend, unbidden pass, respond, bets | Spans, extraction, slots and the one question are built. Reconcile is the model matching against titles. Capture, score, spend, the unbidden pass and bets are not built. |
| `VISION` §4.2, stuck and plastic | Quotes verified verbatim against a loaded source text; a verifier pass; world probes | None built. The sample's scripture quotes are hand-authored. |
| `VISION` §5, the screens | Audio playback, drag to link, merge and split | Not built. Two existing items can be linked only by a script line. |
| `HANDOFF` §1 | "The app and UI are window dressing. The theology is the deliverable." | Superseded by the goal statement of 2026-09-30. §15 says so; §1 still reads as before. |
| `HANDOFF` §12 and §13, next steps | The hope treatment, the theology skeleton, speaker labels, the archive test | None done. All still listed as next. |
| `NEXT-STEP-Three-Layer-Build` | Run the Bobby probe before building layers, because it decides the schema | The environment map was built at Phil's direct request before the probe ran. The foundation layer is not built. |

Two observations on the docs as a set.

- **The provenance rule is kept.** Phil's statements are quoted verbatim and dated. Claude's designs are labelled as experiments with a test for and against. That mirrors the product's own rule and is worth keeping exactly as it is.
- **There is no short way in.** The root docs run to about 3,900 lines, close to the size of the source. Phil's statements are recorded twice by design. A new reader has no single page that says what exists; this document is meant to be that page.

## Review findings

Ten findings, three of them worth fixing before anyone else is invited in. "Confirmed" means this review ran code to see it; "read" means it follows from the source and was not run.

| # | Severity | Finding | Basis |
| --- | --- | --- | --- |
| 1 | High | An action whose id is a reserved property name makes the reducer write to the base object every other object inherits from | Confirmed |
| 2 | High | Stop does not stop the server: the model call finishes, is billed, and the step is stored | Confirmed in isolation |
| 3 | High | Open sign-up with only a per-person limit leaves total AI spend unbounded | Read; named in E15 |
| 4 | Medium | The promise "your words stay your words" is enforced by the page, not by the reducer or the server | Confirmed |
| 5 | Medium | A failed save leaves a hole in the server's stream, and the warning clears itself | Read |
| 6 | Medium | One phrase typed into a fact or goal can lock the AI out of that stream | Read |
| 7 | Medium | Every model call and every open loads and replays the whole stream; nothing is materialized | Read |
| 8 | Medium | Dates are text labels with no year | Read; named in E6 |
| 9 | Low | Small integrity gaps in the store | Read |
| 10 | Low | Process: five releases uncommitted, no CI, working copy is the deployed copy | Confirmed |

**1. Reserved ids reach the reducer.** `replay.js` keeps nodes, goals and facts in plain objects and looks them up by an id taken from the action. `/steps` stores any action JSON. Replaying a `keep` action whose id is `__proto__` set `stuck`, `kept` and `src` on every object in the process; a `release` did the same for `ended`. On the server this happens inside `/ingest` and `/analyze`, lasts until restart, and is re-applied on each replay. Other ids of this kind make replay throw, which leaves a stream that cannot be opened. *Fix:* build the state's maps with no prototype, or use `Map`; check `Object.hasOwn` in `normalize.js` too; have `/steps` accept only known action types with ids of a set shape.

**2. Stop.** `server.js` attaches its cancel listener to the request's `close` event after the body has been read. On Node 24 that event has already fired by then, so the listener never runs. A stand-in server with the same pattern showed it: the client aborted at 400 ms, the request listener never fired, and a listener on the response fired at 409 ms. The page says "Stopped. Nothing was added," while the server stores the step. The two differ until reload. This was not run through the app's own route, which needs the database and the key. *Fix:* listen on the response's `close` event and check that the response has not ended.

**3. Spend.** `SIGNUP` defaults to open, sign-up needs no confirmed email, and new accounts are users. Each account has 40 calls a day. Nothing limits accounts or total calls. *Fix:* default to closed or to an invite code; add a ceiling on total calls a day; throttle sign-in and sign-up.

**4. Promises enforced at the edge.** Replaying a `discard` aimed at the person's own words deleted them. A `keep` aimed at their own words relabelled them as a reading they kept. The page never offers those buttons and the script planner refuses them, but the reducer and the server accept both. *Fix:* move the "which things may this act on" rules from `script.js` into the reducer, so one place decides. Then the page, the scripts and the server all inherit them.

**5. Save queue.** When a post to `/steps` fails, the queue records a problem and carries on. The next step that saves clears the problem, and the page shows "Saved." The server's stream now lacks a step the page still shows. *Fix:* stop the queue on failure and retry the same step with the id the page already gave it, or reload from the server.

**6. A phrase that locks the stream.** Facts, goals and items are stored without screening, but the stream's listing is screened before each AI call. A non-admin who types a phrase the screen reads as an order has Help analysis refused on that stream for good, and Ideaify refused until the fact is released or the goal dropped. *Fix:* screen action text when it is stored, and say which item tripped it.

**7. Whole-stream replay.** Fine at Bobby's scale. A stream with a year of daily passes carries every raw text and every model result on each open and each call. It also means no query can cross streams, which the later vision needs. *Fix:* see the opinion below, step 4.

**8. Dates.** "Sep 30" cannot be sorted, subtracted, or told apart from next year's. Fading is counted in passes, so a 14-file drop fades the first file. *Fix:* E6, with a real date beside the label.

**9. Store.** The daily limit is checked and then spent, so parallel calls can pass it. Ingest step ids come from the millisecond clock. `api_calls` has no foreign keys. Nothing in the database stops an UPDATE to `steps`. A step does not record who wrote it.

**10. Process.** Help analysis, scripts, world maps, accounts and the Help tab are all uncommitted on master. `web.config` runs the working copy. The gate is manual.

Already on the project's own list in `HANDOFF.md` §14 and still open: speaker attribution in unlabelled transcripts, and reconcile seeing only titles of the 160 most recent ideas.

## Opinion: what to improve to reach the vision

The foundation is right and should not change. What stands between this code and the vision is evidence first and structure second, not more features.

The risk I see is pace. The app went from 0.2.0 to 0.7.0 in one evening. Each piece is carefully made, and none has had its test. Six experiments sit at "testing," ten questions wait on Phil, and the archive test written on the first day has never been run. Every later part of the vision multiplies whatever the quality of the first part turns out to be, and that quality is not yet known.

**What to keep exactly as it is.** The append-only stream. The one pure reducer shared by both sides. Words rebuilt from the person's own spans. Given kept apart from supposed. Scripts that can do only what buttons can. The habit of recording Phil's words verbatim and labelling Claude's designs as experiments.

The order in one view, each step followed by its gate:

0. **Make it safe to invite one more person.** Commit the five releases. Close findings 1 to 5. Validate every action on the server. Run the app from a release folder, not the working copy.
   *Gate: hostile-action tests pass, Stop stops, total spend has a ceiling.*
1. **Prove one world on real material.** Run the archive test on the 14 transcripts, with speaker labels and said-on dates. Add script lines that check a result. Phil keeps one real stream of his own for two weeks.
   *Gate: the archive test finds most of what the hand-made handoff found.*
2. **Make the diagram the defining feature, and add a voice.** A shape for each map. Link, reword and arrange by hand. Real voice capture with the audio kept. The model writes a world as a script, and every item it adds arrives as supposed.
   *Gate: Phil adds complications from the diagram, not from a script.*
3. **One record on every item: who said it, on what basis, how it stands.** Fold stuck and plastic, given and supposed, proposed, and reading into one provenance record. Containers, perspectives and the battery wait for answers from Phil, then land on that record.
   *Gate: any item can say who claimed it, with no special cases.*
4. **Worlds that meet.** A subject for each world, an author on each step, people and things as shared entities. The map stored and searchable in Postgres. Sharing by name, private by default, with export.
   *Gate: two real people link their worlds, and each sees only what was shared.*
5. **Coordination, and the AI doing the tedious part.** Background jobs and a meter on total spend. A shared library of common objects, filled in as supposed. A view of where worlds touch. More than one server process.

Step 1 is where I would spend the next two weeks. The steps are an order, not a schedule; no dates are implied.

**Step 0. Make it safe to invite one more person.** Days of work. Commit what exists. Fix findings 1 to 5, and move the rules about what an action may touch into the reducer so one place decides. Add tests that post hostile and malformed actions. Run the site from a release folder.

**Step 1. Prove one world on real material.** This is the step I would not skip. Label the speakers in the archive and give each entry the date it was said, then run the archive test. Build the script lines that check a result, which Phil already agreed to: they turn every scenario into a regression test for the prompts, which today have none. Then Phil keeps one real stream of his own for two weeks. Most of the ten open questions are better answered from that use than from thought.

**Step 2. Make the diagram the defining feature, and add a voice.** Phil called the diagrams "an awesome defining feature." Today one radial layout draws all four maps, State is a set of lists, and two existing items cannot be linked by hand. Each map wants its own shape: rings from near to far for the environment, a ladder for assumptions, a track for a goal and its moves. The person should be able to link, reword and arrange on the diagram itself. Voice belongs here too: the whole corpus was dictated, and the Talk tab is a demo. The first "AI fills in" is also cheap at this point. The model applies `METHOD-Deriving-the-Maps.md` and writes a world as a script, and everything it adds arrives as supposed.

**Step 3. One record of who said it, on what basis, and how it stands.** The code now has four vocabularies for one idea: stuck and plastic for ideas, given and supposed for world items, proposed and open for goals, reading and kept for the machine's interpretations. They should become one provenance record on every item: who claimed it (a person, the AI, a script, a corpus), on what basis (said, supposed, read from text), and how it stands (open, confirmed, ruled out, replaced). The moment a second person or the AI writes into a world, every item must be able to answer "whose claim is this?" Containers, perspectives and the battery wait on answers from Phil, and each is small once this record exists.

**Step 4. Worlds that meet.** This is the first step that changes the database, and it needs four things the code does not have.

- **A subject.** A stream has an owner and nothing says whose world it is. Bobby is not a user.
- **An author.** A step does not record who wrote it. A shared world needs that on every step.
- **Entities.** The store clerk in Bobby's world and the clerk who keeps a world of their own must be the same person in the data, by consent of both.
- **A stored map.** Items and links written to tables as steps are appended, rebuildable by replay, with similarity search. That allows "where do our worlds touch," replaces matching against 160 titles, and ends replay from zero.

Sharing must also become sharing with named people, private by default, with export and deletion. The vision says trust is the precondition, and today sharing is one switch that only an admin can press.

**Step 5. Coordination, and the AI doing the tedious part.** Only after step 4. Today every model call is tied to an open browser tab. Filling in attributes for common objects needs background jobs, a meter on total spend, and a shared library that people confirm or rule out, which is the foundation corpus of E9 by another name. Several authors on one world need a server-ordered log and a view of where worlds touch. One Node process on IIS serves dozens of people. Thousands need snapshots, a queue and more than one process.

**What I would not build yet.** Containers, perspectives, the battery, generated games, and any screen for many worlds. Each is attractive and each would be built on untested ground.

**Decisions only Phil can make, and that shape the structure.**

1. Whose world is a stream: the person writing, or the person written about?
2. Is the foundation matched against an authored list, or proposed and confirmed? The Bobby probe (E10) was meant to answer this and has not been run.
3. What may others do in a world: read it, add to it, or only keep one of their own beside it?
4. Which proof comes next. The centre of the project has moved three times in three days: a theology, a map of one person's meaning, a model of a world, a platform for coordination. They fit together, with the theology as one person's anchors, but only one can be the next thing proved. My recommendation is one real person's world, kept for two weeks.

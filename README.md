# Network Meaning

A meaning map of the ideas a person presents. Their words are kept verbatim,
the machine's readings are marked as such, and every change is a step in an
append-only stream that can be rewound, branched, and replayed.

How to use it is in `HELP.md`, which is also the Help tab in the app. How
the maps of a world are derived is in `METHOD-Deriving-the-Maps.md`. The
theology and the thinking behind it are in `HANDOFF.md`, `VISION.md`,
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

Open http://127.0.0.1:8787, sign in with `APP_PASSWORD` (leave the email
blank, or give `APP_USER_EMAIL`), and paste text into **Add text**. The
built-in sample streams (*Darlene and the appointment* and *Bobby's world*) work
without a database or key, and so does looking around as a guest; ideaifying
needs both. The owner also gets a sample of his own archived chats, which
the server gives to the owner alone.

Create the database once (any name, put it in `DATABASE_URL`). The owner
must be the role in `DATABASE_URL`, or migrations cannot create tables:

```
psql -U postgres -c "CREATE DATABASE network_meaning OWNER network_meaning"
```

## People, levels and the AI check

Email is the unique key. A person signs up themselves on the sign-in card
or is added by an admin on the **Admin** tab (shown only to admins). Three levels:

| Level | Stored? | AI? | Also |
|---|---|---|---|
| guest | no: the work stays in the browser tab | no: the AI buttons show an info box | an account at this level, or anyone who presses *Look around as a guest* |
| user | yes, in an area of their own | yes, up to a daily number of calls | |
| admin | yes | yes, no daily limit | adds people, sets levels and passwords, disables accounts, shares a stream with everyone |

The owner, `APP_USER_EMAIL`, signs in with `APP_PASSWORD` and is always an
admin. Everyone else's password is stored only as a salted scrypt hash. A
stream an admin shares is listed for everyone, read-only; acting on it
starts a copy of your own. The app sends no email: a forgotten password is
set again by an admin.

Anyone signed in can change their own password (**Change password**, beside
Sign out) by giving the current one. For the owner the current one is
`APP_PASSWORD` or a password set this way before; `APP_PASSWORD` goes on
working afterwards, as the way back in. Sessions already open are not
ended by a change of password.

Who may sign up (anyone, anyone with an invite code, nobody) is set by an
admin on the **Admin** tab and kept in the `settings` table. That setting
wins over `SIGNUP` and `SIGNUP_CODE` below; with none made there, the
server's own setting stands.

Optional settings in `.env`:

```
SIGNUP=closed            # nobody can sign up; an admin adds people
SIGNUP_CODE=some-phrase  # signing up asks for this invite code
SIGNUP_LEVEL=guest       # people who sign up start as guests, not users
DAILY_CALL_LIMIT=40      # AI calls a day for anyone but an admin
```

Before every call to the AI, `src/server/screen.js` checks what the person
supplied: the text being sent, its label, and what is already in the
stream. Junk (empty, too long, not text, no words, one thing repeated) is
refused for everyone. Text that reads as orders aimed at the AI is refused
for everyone but an admin. The refusal says what was found, the AI is not
called, and the attempt is logged with status `screened`. This is a first
gate, not a guarantee: the prompts also tell the model that the text is
material to read, and the answer is validated by `normalize.js`.

What is already in a stream is not refused. A line there that reads as an
order to an AI is left out of what the model is shown, and the person is
told which, so one phrase cannot lock a stream.

The server stores only actions the reducer knows (`actionOk` in
`src/shared/replay.js`), and the reducer decides what each may act on.

## The State view

Beside the map, the app keeps the person's **state**: facts that are true
for them now, **goals** put forth, and every **move** toward a goal. When a
goal is reached, the state changes so that the goal is now part of it. All
of it is action steps in the stream, so it rewinds and branches with the
map. Goals and moves stated in pasted text are read out by the model and
wait for the person to confirm them. A move read in the text carries no
effect: nobody has said whether it brought the goal closer. The built-in
sample *Darlene and the appointment* walks through it, with items on all
three world maps beside it; the data there is made up.

At the top of the State view, **Help analysis** makes suggestions given the
state of play. One model call reads Now, the goals and their moves, the
open loose ends and the map, and returns where things stand plus a few
suggestions. Each suggestion must point at something in the state of play
or it is dropped; it is shown as the machine's reading and changes nothing
until the person acts. The analysis is a step in the stream, so it rewinds
and reloads without calling the model again.

## The maps of one world

The Map view draws four maps of one world, picked with the selector above
the diagram: **What was said**, **Environment**, **Mental state**, and
**Assumptions** (moral presuppositions). An item on a world map is either
**given** or **supposed**. A supposition is drawn dashed until it is
confirmed (solid) or ruled out (kept, struck through), and can carry the
open question that would check it. Items link across maps, and following a
link changes the map in view. The panel adds an item to the map in view,
joined to the item in the middle. World items are action steps (`item`,
`link`, `ask`, `confirm`, `ruleout`), so they rewind and branch like
everything else. The built-in sample *Bobby's world* is made up: two things
said, and everything else supposed, the way an investigator would assemble
it. The same world is a built-in script, so the stepper can assemble it
line by line.

The Stream menu says what each stream holds before it is chosen: its steps,
and how many items are on its Environment, Mental state and Assumptions
maps (`GET /api/streams` returns these as `maps: {env, mind, moral}`).

Where a box shows a suggestion beginning "e.g.", pressing its button with
the box empty uses the suggestion as the entry.

## Scripts and the stepper

The **Script** tab holds a small scripting language that makes the app go.
A script is plain text, one action per line:

```
# comment
stream: Bobby, scripted          start a new saved stream (optional)
date: Sep 28                     date the steps that follow (optional)
fact home: Bobby is at home.     "home" is a name later lines can use
goal milk: Get milk.
release home: He left for the store.
move milk closer: Bobby is at the store. They have milk.
reach milk: Bobby has milk.
text "The story": Bobby went to the store to get milk.     calls the model
accept "milk"                    point at a thing by a few of its words
help                             Help analysis; calls the model
rewind 7      latest      show state      note: Anything.
said need: He needs milk.                         what was said, put on the map by hand
environment store: A store is within reach.       supposed unless you write "given"
mental want given: He wants milk.
assumption pay: You pay for what you take.
link need want: read as a want                    join two items, on one map or across maps
ask store: Which store?                           hang an open question on an item
confirm store: He said so.      ruleout store     show environment
mark "a few words" new                            your word on a Help analysis suggestion: new, knew, wrong
expect goal milk reached                          a check: it changes nothing and never stops the run
expect no idea "walk the dog"     expect link need want     expect loose "Kastrup" open
```

An `expect` line makes a script a test as well. It can look for a `fact`,
`past`, `goal`, `idea`, `reading`, `item`, `loose`, `link` or `suggestion`,
by name or by a few words, with `no` for "nothing matches". The stepper
marks each check as held or not and counts them; `scriptToSteps()` returns
them as `checks`, so a script can be run headless as a test.

**Open in the stepper** docks the script under the page, where it stays on
every tab. **Step** runs one line; **Play** runs them in turn and can be
paused. Each action opens the view where it lands and marks what it
touched. A script can do only what the buttons can do, so every line is an
ordinary step in the stream. A line that can't run stops the run and says
why. The full list of words is beside the editor, and in
`src/shared/script.js`. Three built-in scripts: the Bobby story by hand
with no model calls, the Bobby story read by the model, and Bobby's world
assembled across the four maps.

## Evidence

The **Evidence** tab counts what became of the machine's claims in the open
stream, from its steps alone (`src/shared/evidence.js`, pure, no model call,
no database): readings kept and discarded, goals read in text confirmed and
refused, loose ends settled, suppositions confirmed and ruled out, items
dropped for citing nothing, and the person's word on each Help analysis
suggestion (**New to me**, **Already knew**, **Wrong**, stored as an action
step of type `verdict`). The counts are split by the model that made each
claim, and they rewind with the Step slider. The design and its test are
`VISION.md` §9, E17.

## On the server

The app is mounted under IIS at
`https://www.toughguycomputing.com/network_meaning/`, as the application
`/network_meaning` on the site `toughguycomputing.net`, in the pool
`NetworkMeaning`, running from this folder.

```
bin\setup_network_meaning_v1.0.ps1    mount it (once; asks for an administrator; safe to run again)
bin\recycle_apppool_v1.0.ps1          restart it (asks for an administrator)
```

**After any change to `server.js`, `src\` or `.env`, save `web.config`**
(any edit will do). IIS notices and restarts the node process; no
administrator is needed. A change to the page alone (`node build.js`)
needs no restart, only a hard refresh (Ctrl+Shift+R). The process log is
`logs\iis-stdout*.log`.

`web.config` sets, for the public site: `BASE_PATH=/network_meaning`,
`FORCE_HTTPS=true` (plain HTTP is sent on to HTTPS), and the two daily
limits, set tight because sign-up is open. A setting in `web.config` wins
over the same one in `.env`. More settings, all optional:

```
DAILY_CALL_CEILING=300   # AI calls a day for everyone but admins, together
SIGNUPS_PER_HOUR=5       # new accounts an hour from one place
COOKIE_SECURE=true       # mark the session cookie Secure on a host that does not say it is HTTPS
```

`GET /health` answers `{ok, version, db, https}`; `https` says whether
that request reached the site over HTTPS.

## Gates

```
node build.js --check         # public/index.html matches src/ and HELP.md
npm test                      # unit + HTTP tests, no database or key needed
npm run smoke                 # drives the page in headless Brave/Chrome/Edge; skips if none
TEST_DATABASE_URL=... npm test   # also runs the Postgres tests in a throwaway schema
```

`public/index.html` is generated. Edit `src/` or `HELP.md`, rebuild, commit
both.

## Layout

| Path | What |
|---|---|
| `server.js` | HTTP entry point: the page, `/health`, and the JSON API |
| `HELP.md` | The help. `build.js` turns it into the Help tab |
| `METHOD-Deriving-the-Maps.md` | How the four maps of a world are derived, with a change log |
| `src/server/` | `db.js` (pool), `migrate.js` (numbered SQL), `auth.js` (sign-in, sign-up, levels, signed cookie), `screen.js` (the check before every AI call), `owner-sample.js` (the owner's own sample stream, never in the page), `ideaify.js` (prompt + Claude call), `normalize.js` (validate the answer), `analyze.js` (help analysis: prompt + validation), `streams.js` (append-only store) |
| `src/shared/` | `replay.js` (steps → map), `spans.js` (text → spans), `script.js` (the scripting language: parse, plan and check), `evidence.js` (steps → counts of what became of the machine's claims); ESM for the server and tests, inlined for the page |
| `src/client/` | `page.html`, `style.css`, numbered modules in load order (`65-statelayer.js` is the State view, `77-evidence.js` the Evidence view, `85-script.js` the Script view and the stepper, `95-admin.js` the Admin tab) |
| `sql/` | `001-init.sql`, `002-users.sql` (levels, passwords, shared streams), `003-settings.sql` (what an admin sets from the Admin tab) and later migrations |
| `tests/` | `node --test` suites and `smoke.browser.js` |
| `build.js` | Assembler and `--check` gate |
| `web.config` | IIS hosting via HttpPlatformHandler, and the public site's settings |
| `bin/` | PowerShell: mount the app under IIS, recycle its pool |
| `GROK-REVIEW.md` | Grok's review of 0.7.0. `HANDOFF.md` §16 says what was done about it |

## API

All routes except auth, login and signup need the session cookie. A guest
account is refused by every route that would store something.

```
GET  /api/auth                      -> {signup: "open" | "code" | "closed"}
POST /api/login {email, password}   POST /api/signup {email, password, code?}
POST /api/logout                    GET /api/me   -> {id, email, level, admin}
POST /api/me/password {current, password}                 change your own password
GET  /api/admin/users               POST /api/admin/users {email, password, level?}     (admin)
PATCH /api/admin/users/:id {level?, password?, disabled?}                              (admin)
GET  /api/admin/settings            -> {signup, code, from: "admin" | "server"}        (admin)
PATCH /api/admin/settings {signup: "open" | "code" | "closed" | "server", code?}       (admin)
GET  /api/streams                   yours, and those shared with everyone
POST /api/streams {name, steps?} | {name, fromStreamId, atSeq}
GET  /api/streams/:id               PATCH /api/streams/:id {name?, shared?}      DELETE /api/streams/:id
POST /api/streams/:id/steps  {kind:"action", action, source, date}
POST /api/streams/:id/ingest {text, source, tier, date?}   -> {step, dropped}
POST /api/streams/:id/analyze {tier, date?}                -> {step, dropped}   (help analysis)
GET  /health
```

## Models

The **Depth** control maps to `MODEL_QUICK`, `MODEL_DEFAULT`, `MODEL_COMPLEX`
in `.env` (defaults: Haiku 4.5, Sonnet 5.5, Opus 5.5). The answer is
constrained to a JSON schema on the server, then validated by
`normalize.js`: an idea with no span citation is dropped and counted, and an
idea's words are always assembled from the spans it cites. Goals and moves
read in the text follow the same rule.

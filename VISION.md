# Network Meaning: A Vision

Written 2026-09-28. A first attempt at describing the finished software: what
it feels like to use, how it works underneath, and what the screens look like.
Everything here is a proposal to argue with. The raw material is in
`HANDOFF-Salient-Points.md`, and the source chats are in `_archive/`.

---

## 1. The experience in one paragraph

You talk. It listens, keeps your exact words, and quietly builds a map of what
you said: the ideas, the examples, the questions, the corrections, and how
they connect. It doesn't lecture, agree, or summarize at you. When you pause,
it asks at most one question, the one that fills the most interesting gap.
Over weeks, the map becomes a living picture of your thinking. It shows what's
new, what has settled, what has faded, where you contradicted yourself, which
questions you asked and never answered, and which idea from March connects to
the one you had this morning. When you want to write, it hands you your own
thinking back, organized, with your exact words pinned in place.

The handoff files in this repo were made by hand from 14 phone chats. **The
software's job is to produce those files on its own, continuously, for anyone.**

---

## 2. Principles (from the corpus)

1. **Your words are the ground.** Everything you say is kept verbatim with its
   audio. Nothing the machine infers can overwrite it. Inferences are drawn
   differently and can be thrown out.
2. **Surprise is where the value is.** Attention goes where something breaks:
   a contradiction, a correction, a link nobody expected, a question left
   hanging. Confirmations cost nothing and get little.
3. **Everything happens in time.** The map is never rebuilt from scratch. It
   moves forward. Ideas arrive, stay, and leave, and the software shows which
   is which.
4. **Don't anchor too early.** It holds ideas unlabeled and unresolved as long
   as you want. It doesn't force categories.
5. **One question, not a critique.** Its voice is a good listener's: brief,
   curious, specific.
6. **Guard against the flattering mirror.** An AI will find profound meaning in
   anything. The software is built so it *can't* do that without your words
   to stand on.
7. **Plain language on the surface.** Nodes, arcs, and budgets exist
   underneath. The user sees "your words," "my reading," "open question,"
   "connects to," and "you changed this."

---

## 3. A walkthrough

**Monday, in the car.** Phil taps the mic on his phone and talks for six
minutes about faith: the car that starts every morning, the child going to
grandma's, Peter on the water.

As he talks, the phone shows a rolling transcript. One phrase gets a faint
underline: *"Verbenade Capsaro."* He ignores it and keeps driving.

When he stops, a single card appears:

> You said faith becomes "part of the furniture" once it's habitual. Then you
> said Peter sank when he started thinking. Is thinking what breaks the
> furniture, or is it something else?

He answers it out loud, or he doesn't. Either way the session is saved.

**Monday night, at the desk.** He opens the map. Monday's ideas are bright,
new clusters. "Faith is furnished by memory" sits next to "the car starts"
and "grandma's after dinner," all with solid outlines because they're his
words. A dashed node between them says *faith habituates into background
certainty*. That's the machine's reading, and it's marked as such.

The **Loose Ends** tray has three items:
- *"Verbenade Capsaro": did you mean Bernardo Kastrup?* (Confirm / Fix / Ignore)
- *You said faith is one of "five or six primary foundations." You named one.
  What are the others?*
- *This echoes something from Sept 12: "maintenance on no feeling" (the
  battery terminals).* (Link / Not related)

He taps *Link*. A new line appears between two clusters that were weeks
apart.

**Three weeks later.** In the timeline view, the "faith" lane is thick and
settled. "Glory as an open loop" appeared, flared for two sessions, and has
faded. The software doesn't nag about it; it just shows that it's gone quiet.
When he selects the faith cluster and taps **Draft**, he gets an outline in
plain prose. Every one of his quotes is pinned with a play button, and
nothing says "node."

---

## 4. How it works underneath

### 4.1 The pipeline, per session

```
 voice ─► transcript ─► spans ─► extraction ─► reconcile ─► score ─► spend ─► respond
   │          │                     │              │          │        │         │
 audio     garble               candidate      merge with  surprise  deeper   one question
 kept      flags                ideas + links  the map     per item  passes   + bets saved
```

1. **Capture.** Audio is recorded and kept. Speech-to-text runs with
   word-level confidence. Low-confidence words and unfamiliar proper nouns
   become **garble flags**. These are never auto-corrected, only offered as
   guesses.

2. **Spans.** The transcript is cut into spans: sentence-ish units with
   timestamps. Spans are the atoms of stuckness. Everything else must point
   back to at least one span.

3. **Extraction.** A mid-size model reads the new spans with nearby map
   context and proposes items:
   - *kinds of idea:* claim, example or image, question, quote, correction,
     term, person, anchor
   - *kinds of link:* supports, example-of, refines, contradicts, **corrects**
     (A replaces B), raises (a question), answers, echoes
   Each proposal cites its spans. A proposal with no citation is discarded.

4. **Reconcile.** New proposals are matched against the existing map by
   embeddings plus a judgment call from the model. Is this the same idea said
   again, a refinement of it, or something new? Repeats strengthen an existing
   node instead of cloning it. **Corrections never delete.** "Toys, not boys"
   creates a `corrects` link, the old version is kept, and the new one leads.

5. **Frames and slots.** Each idea gets a small set of expected slots: who,
   how, why, when, compared to what. They come from a cheap model call or a
   template per kind. Empty slots are **open vectors**. "Bobby went to the
   store" gets *how did he get there?*, *which store?*, and *why milk?*.
   Links get slots too, because the arcs explode as well as the nodes.

6. **Score.** Every new item gets a surprise score from signals that can be
   measured:
   - contradicts a stuck item (your earlier words, a quoted source)
   - corrects something
   - links two clusters that were far apart
   - breaks a **bet** (see 4.3)
   - leaves a question unanswered at the end of a session
   - comes back after a long quiet period

7. **Spend.** Each session has an attention budget: model calls and tokens.
   It's allocated by surprise. First comes a cheap shallow pass on
   everything. Then deeper passes (a bigger model, a wider search, drafting
   the question) go only to the items that came back rich. A branch stops
   when a pass produces no new idea, link, or question.

8. **Unbidden pass.** In the background, the whole map is searched for
   resonance with today's material. Anything above a threshold goes to Loose
   Ends as an *echo*. It's never pushed into the conversation mid-thought.

9. **Respond.** One question, chosen from the highest-scoring open slots and
   contradictions. It's phrased in your words and short enough to hear while
   driving. Sometimes the right response is no question at all.

10. **Bets.** Before closing, the system writes down what it expects next
    time. For example: *will return to Peter*, or *will resist the label
    "currency."* Next session is scored against them.

### 4.2 Stuck and plastic

Every item carries `kind` (stuck or plastic) and `source`:

| source | stuck? | examples |
|---|---|---|
| `user_said` | stuck | your exact spans |
| `quoted_text` | stuck | a verse matched **verbatim** against a loaded source text (KJV, WEB) |
| `world_probe` | stuck | "I tried it, and here's what happened" |
| `user_confirmed` | stuck | a garble fix or echo you accepted |
| `inferred` | plastic | the machine's readings, generalizations, links |

Rules:
- Plastic can be rewired freely. Stuck can only be interpreted.
- A **verifier pass** checks plastic items against the stuck items they touch.
  Any plastic chain that contradicts something you said gets killed, and the
  contradiction becomes a Loose End for you instead.
- A paraphrased quote is never allowed to look like a quote. If it doesn't
  match the source text verbatim, it's plastic.

This is the brake on the flattering mirror.

### 4.3 Time

- **Activity state** per item, computed from how recently and how often it's
  touched, along with its links: *arriving*, *settled*, *fading*, *gone
  quiet*. This is come, stay, leave.
- **Versioning**: the map is an append-only event log. Any past day can be
  replayed. "What did I think in March?" is a real query.
- **Budget ownership** is a hybrid, answering the open question: each session
  gets a base budget, and *unresolved* threads accumulate budget across
  sessions. What you keep circling gets more attention. That's the lattice
  idea: pull decides what becomes real.

### 4.4 Anchors (optional, per user)

A user can pin a few **anchors**, fixed points they want everything traced
back to. For Phil, those would be the two commandments and the sacrifice.
Other users might pick their company's mission, a set of vows, or none at
all. When anchors exist, every cluster shows its **traceback path** to them
in plain words, and ideas with no path are simply shown as unanchored, not
judged.

This also resolves the tension in `HANDOFF.md`. The app is general, and the
theology is Phil's anchor configuration and content.

### 4.5 Data model (first cut)

```
sessions     id, user, started, ended, audio_uri, budget_spent
spans        id, session, t_start, t_end, text, stt_confidence
items        id, kind, text, stuckness, source, activity, created, last_touched
item_spans   item → span(s)                      -- the traceback to your words
links        id, from, to, type, stuckness, source, confidence
slots        id, item|link, question, filled_by (item|null)
flags        id, type (garble|gap|echo|contradiction|unanswered), payload, status
bets         id, session, expectation, outcome (hit|miss|pending)
probes       id, proposed, result_item (null until reported)
anchors      id, user, text, source_ref
events       append-only log of every create/merge/correct/confirm/kill
```

Postgres with pgvector handles storage and similarity search. The graph is
small per user (thousands of items, not millions), so no dedicated graph
database is needed.

**Decided (2026-09-28): Postgres.** The source of truth is the stream: an
append-only log of steps (`streams`, then `steps` with `seq`, `kind` =
ingest | action, the raw text, and the validated model result as `jsonb`).
The map tables above are a projection, rebuilt by replaying steps. Reset to
zero, rewind, and branch all fall out of that without calling the model
again. The prototype in `mockup.html` uses this exact shape.

### 4.6 Models and stack (a proposal)

- **STT:** a Whisper-class model, run on the server so confidence scores and
  audio are kept. Native phone dictation throws away the confidence data.
- **LLMs:** a tiered budget. A small, fast model (Haiku-class) does cheap
  passes, slot filling, and scoring. A mid model (Sonnet-class) does
  extraction, reconciliation, and questions. A large model (Opus-class) does
  deep passes, drafting, and verification. All calls go through one budget
  meter.
- **Server:** it fits Phil's Windows/IIS servers. The API sits behind IIS (an
  ASP.NET Core or Python app), with Postgres alongside. The phone client is a
  PWA, so there's no app store.
- **Privacy:** this is the inside of someone's head. Everything is private by
  default and exportable to plain markdown. A local-first mode is worth
  designing for early.

---

## 5. What the UI looks like

Five surfaces. The phone is for talking. The desk is for looking.

### 5.1 Talk (phone)

```
┌─────────────────────────────┐
│  Network Meaning      ☰     │
│                             │
│  …and the car starts every  │
│  morning. After a while you │
│  stop thinking of it, it's  │
│  part of the furniture. I   │
│  reach for ̲V̲e̲r̲b̲e̲n̲a̲d̲e̲        │
│  ̲C̲a̲p̲s̲a̲r̲o̲ because…          │
│                             │
│                             │
│         ┌───────┐           │
│         │  ●    │  hold to  │
│         │  mic  │  talk     │
│         └───────┘           │
│  ─────────────────────────  │
│  ? Is thinking what breaks  │
│    the furniture, or is it  │
│    something else?          │
│       [answer]  [later]     │
└─────────────────────────────┘
```

- Big mic. A live transcript. Garbles get a faint underline and are never
  interrupted.
- The question card shows up only after a pause, and only one of them.
- Hands-free mode reads the question aloud.

### 5.2 Map (desktop)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Map ▾   Search…         Focus: faith          [Timeline] [Loose Ends 3]   │
├───────────────────────────────────────────────┬──────────────────────────┤
│                                               │ ┃ Faith is furnished      │
│      ┌──────────────┐                         │ ┃ by memory               │
│      │ the car      │                         │                          │
│      │ starts       │──example──┐             │ YOUR WORDS  ▶ 0:42       │
│      └──────────────┘           ▼             │ "the child has memories  │
│                        ┏━━━━━━━━━━━━━━┓       │ of grandma … immediately │
│  ┌──────────────┐      ┃ faith is     ┃       │ imagines playing with    │
│  │ grandma's    │─────►┃ furnished    ┃       │ that favorite toy"       │
│  │ after dinner │      ┃ by memory    ┃       │                          │
│  └──────────────┘      ┗━━━━━━┯━━━━━━━┛       │ OPEN QUESTIONS           │
│                         ○ ○   ┆ refines       │ ○ what does a child      │
│                  open slots   ┆               │   with no memory trust?  │
│                        ┌╌╌╌╌╌╌┴╌╌╌╌╌╌╌┐       │ ○ where does it fail?    │
│                        ╎ habituates   ╎       │                          │
│                        ╎ into back-   ╎       │ CONNECTS TO              │
│                        ╎ ground       ╎       │ • maintenance on no      │
│                        ╎ (my reading) ╎       │   feeling · Sept 12      │
│                        └╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘       │ • Peter on the water     │
│                                               │                          │
│   ░ faded: glory as an open loop              │ TRACES BACK TO           │
│                                               │ ⚓ Faith, hope, charity   │
├───────────────────────────────────────────────┴──────────────────────────┤
│ solid = your words   dashed = my reading   ○ = open question   ░ = faded  │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Never the whole hairball.** It always shows a neighborhood around a focus.
  You walk the map by clicking outward.
- **Visual grammar:** solid outline for your words, dashed for the machine's
  reading, and hollow dots for open slots hanging off an idea like unplugged
  sockets. Brightness means arriving, full tone means settled, and faded
  means leaving. A thick border marks an anchor.
- **The side panel** is the traceback: your exact words with audio, the
  history ("you changed this on Sept 20; it was 'creation'"), open questions,
  connections, and the path to your anchors.
- You can drag to link, and merge or split ideas. Anything you do by hand
  becomes stuck.

### 5.3 Loose Ends (the inbox)

```
┌──────────────────────────────────────────────────────────────┐
│ Loose Ends                                         12 open   │
├──────────────────────────────────────────────────────────────┤
│ ≈ GARBLE     "Verbenade Capsaro" → Bernardo Kastrup?          │
│                                   [yes] [fix…] [ignore]      │
│ ? UNANSWERED "What's it meaning? How would you respond?"      │
│              asked Sept 26, never answered   [pick up] [drop] │
│ ↔ ECHO       "the shadow falls in your path" ↔               │
│              "the alarm fires when furniture is threatened"   │
│                                   [link] [not related]       │
│ ⚡ TENSION   Sept 28: "app is the goal" vs Sept 27:           │
│              "the app is window dressing"   [talk it through] │
│ ∅ GAP        "five or six foundations." One named.            │
│ ⌛ BET MISSED expected a return to "home." You went to Isaiah. │
└──────────────────────────────────────────────────────────────┘
```

This is the "lost threads" list, made by the machine. Triage is quick: swipe
on the phone, one key on the desk. It's also where you teach the system.
Every confirm or reject becomes stuck data.

### 5.4 Timeline (being in time)

```
        Sep 12      Sep 19      Sep 26      Oct 3       Oct 10
faith   ····▁▂▃▅▇███████████████████████████▇▇▇▇▇▇  settled
motiv.        ▁▃▇█▇▅▃▂▁·                              faded
glory               ▂▆█▆▂·                            gone quiet
meaning                  ▁▂▄▆███████▇▆▅▅▆▇█           active
isaiah                         ▃▇▅▂·    ▁▃▆           returning
              ↑ battery terminals ↔ stability (linked Oct 2)
```

Ideas as lanes. You can see arrival, staying, and leaving, and scrub back to
see the map as it was on any day.

### 5.5 Draft (writing)

Select a cluster and choose **Draft**. You get a plain-prose outline in your
order, not the machine's. Your quotes are pinned verbatim with their dates.
The machine's connective text is visibly marked, and open questions are left
as honest gaps rather than papered over. Graph vocabulary never appears.
Export goes to markdown, which is also how handoffs like the ones in this repo
get generated.

---

## 6. What it refuses to do

- Summarize you in its own words and hand that back as if it were yours.
- Resolve a tension you haven't resolved.
- Reward intensity. Excitement doesn't raise a node's weight. Recurrence and
  links do.
- Interrupt a thought in progress.
- Fill a gap with a plausible guess and not mark it as one.

---

## 7. First build (prong one)

**Prototype status (2026-09-28).** `mockup.html` already runs the
text-in half of this: paste or drop text, ideaify it with Claude, map it,
flag loose ends, ask one question, and save every pass as a step in a stream
that can be reset, rewound, branched, and reopened. Pasted text is the
discovery path. It lets the pipeline be tuned on real material before voice
capture exists. What remains for prong one is real voice, a server, and
Postgres.

The smallest thing that proves it:

1. **Phone Talk screen**: record, transcribe, and store audio and spans.
2. **Extraction and reconcile**, with span citations and stuck/plastic marking.
3. **Loose Ends**: garbles, unanswered questions, gaps, echoes.
4. **A plain neighborhood map**, read-only at first.
5. **One question per session.**

**The first test is already sitting in `_archive/`.** Feed it the 14
transcripts. It passes if it independently finds most of what the hand-made
handoff found: the Kastrup garble, the missing Defining-Consciousness middle,
the unanswered "what's it meaning," the "five or six foundations" gap, and
the shadow↔alarm and battery↔stability echoes. That's a concrete evaluation
set before a single line of UI is polished.

---

## 8. Hard problems, honestly

- **Granularity.** How big is one idea? Too fine and the map is confetti. Too
  coarse and links go missing. This probably needs tuning against real
  transcripts, starting with `_archive/`.
- **Merging.** Deciding "same idea, said again" versus "new idea" is where
  maps rot. Wrong merges lose meaning, and missed merges create clutter.
- **Scoring surprise** without the scores being arbitrary.
- **Graph bloat** after a year of talking. Fading needs to actually retire
  things from view, not just dim them.
- **Voice latency.** The question has to come quickly after a pause, or the
  moment is gone.
- **Trust.** People will pour private things into this. Security and
  exportability aren't features, they're the precondition.

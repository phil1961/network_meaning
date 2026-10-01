# Next Step: Three-Layer Build

Written 2026-09-30 from a voice session. Intended as the brief for the next
iteration on the app, to be handed to a terminal Claude. Read Three-Layers.md
and Story-and-Game.md first — this is the build task that follows from them.

## The task

Add the three layers to the app as it exists now. Then drive the whole thing
with one deliberately thin story and see what the code actually has to do.

## The probe

Inject a story as the user layer:

> Bobby went to the store to get milk.

Then attempt to construct, beneath it:

1. a **foundation corpus** that supports it, and
2. an **environment corpus** that supports it,

and see what that looks like when it is coded out.

The sentence is nearly empty on purpose. That is the experiment: find out how
much of each lower layer can be built from almost nothing, and how much has to
be supplied or asked for.

## Layer recap for the implementer

- **Interaction layer** — what the person said. Verbatim spans, ideas cited
  back to spans, relationships between ideas. This already exists and is what
  the current map renders.
- **Environment layer** — the person's situation: job, family, location, the
  political, social and economic conditions they feel themselves to be in.
- **Foundation layer** — authored in advance, not derived: a designed set of
  objects and relationships. Moral precepts. The theology skeleton.

The individual exists between the foundation (the floor) and the environment
(what rests on it and what they actually touch). Motivation is read off the
distance between them.

## Claude's prediction, to be tested, not assumed

- The **environment layer will partly derive** from the sentence, because the
  sentence carries it implicitly: somewhere to be, a store within reach, a
  need for milk, plausibly someone at home expecting it.
- The **foundation layer will not derive at all**. Nothing in that sentence
  touches a precept until you ask *why the milk matters* — and then it lands
  on provision, or obligation, or care for someone at home.

If that holds, the design consequence is: **the foundation layer is authored
and matched against, never inferred.** Interaction proposes; foundation is
looked up. Treat this as a hypothesis the probe is meant to confirm or break,
not as a settled decision.

## Watch for

- Whether foundation objects are *matched* (lookup against an authored set) or
  *proposed* (generated and then confirmed by the person). These produce very
  different schemas.
- Whether the environment layer gets persisted per person, or per stream.
- What clicking between layers shows: which foundational objects an idea lands
  on, or lands near. "Near" needs a definition.
- Whether the span-citation rule survives into the lower layers. An environment
  fact inferred from a sentence has a span; a foundation object does not. The
  existing drop-if-uncited rule in `normalize.js` may need a per-layer variant.

## Then

Once the thin sentence is coded out, re-run the same build with a real
paragraph that has actual stakes in it, and compare what the layers do.
Undecided as of this session: which of the two to run first.

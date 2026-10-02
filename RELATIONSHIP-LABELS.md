# Relationship Labels: what the code has, and how each came to be

Version 1, 2026-10-02. Written by Claude at Phil's request: "find the
relationship labels in the code and document them." While it was being
written Phil added: "I believe this relationship doc will be the core of
the magic of the yet to be built engine. So lets keep our mind wide open on
its uses and capabilites." ("lets" and "capabilites" are as typed.)

So this document does two jobs and keeps them apart. Sections 1 to 9 say
what is in the code today (app 0.11.0, commit 823ee87) and how each label
came to be there. Section 10 lays out what the labels could be used for,
without choosing. Nothing in section 10 is decided or built.

The frame for the review is the brief in Google Drive, *Meaning Map —
Relationship Models: Framework & Review Brief* (2026-10-02): six families,
seven design questions, five checks on the set as a whole.

**How to read the claims here.** Three kinds, marked where it matters:

- *Read from the code.* A fact with a file and line. The reducer and the
  normalizer were also run on small cases to confirm how they behave; those
  are marked "run".
- *Written down elsewhere in the repo.* Quoted, with the file.
- *Claude's reading.* The family a label belongs to, and what a label means
  when nobody wrote its meaning down. These are judgments, for Phil to
  correct.

Not measured: what labels the AI has actually chosen on real streams. That
is in the database, which this review did not read. Usage counts below are
from the three built-in samples only.

---

## 1. The short of it

A link in this app is four things: `{a, b, f, read}`. `a` and `b` are the
two items, `f` is the label, and `read` is true when the link involves the
machine's reading. That is the whole record
(`src/shared/replay.js`, result shape, line 15).

There are **39 different labels in two lists**, and a link can also carry
words that are in neither.

| Where | What it is for | How many |
|---|---|---|
| `LINK_LABELS`, `src/shared/replay.js:43` | links between ideas the AI reads from text | 15 |
| `WORLD_LINKS.within`, `src/shared/replay.js:73` | links inside one world map | 16 |
| `WORLD_LINKS.across`, `src/shared/replay.js:74` | links from one map to another | 10 |
| free words | a script may write any words, up to 40 characters | open |

"leads to" is in both lists and "presses" is in both halves of the second,
so 15 + 16 + 10 is 41 entries and 39 different labels. A fourth list,
`LINK_CHOICES` in `src/server/ideaify.js:20`, is the first thirteen of
`LINK_LABELS` typed out again by hand: it is what the AI may choose from.

**The label is almost always just words.** Only three pieces of code look
at what a label says:

1. `normalize.js:77-83` decides which label a link from the AI ends up
   with.
2. `replay.js:295` turns "my reading" into "leads to" when a reading is
   kept.
3. `replay.js:404` lets the traceback to an anchor walk only labels on a
   fixed list.

Everything else (the diagram, the panel, the stepper, the saved stream)
carries the label as text and does nothing with its meaning.

**Nothing that reasons ever reads a label back.** The AI writes labels
when it reads text, but neither of the two AI calls is shown a link.
Ideaify is shown `id | kind | title` for each idea (`mapListing`,
`replay.js:448`). Help analysis is shown facts, goals, moves, loose ends
and idea titles (`playListing`, `analyze.js:31`). The Evidence view does
not count links. Today the labels are written, drawn, and walked once for
the traceback. That is the open ground section 10 is about.

---

## 2. What every link has in common

The brief asks seven questions of each label. Five of them have the same
answer for every label, so they are answered once here.

**Direction.** Every link is stored from `a` to `b` and drawn with an
arrowhead at `b` (`60-map.js:252`). There is no undirected link. The panel
lists a link from the other end with a "←" before the label
(`60-map.js:403`). The code that walks links ignores direction: the
traceback, the count of connections, and the choice of the middle item all
treat a link as two-way (`neighbors`, `replay.js:340`).

**Strength, weight, confidence.** None. The first design had them
(`VISION.md` §4.5: `links  id, from, to, type, stuckness, source,
confidence`). What was built keeps only `read`.

**What it may join.** Not checked, with one exception. Any label may join
any two items on any maps. The exception is "traces to", which the
normalizer keeps only when one end is already an anchor. The From and To
columns for the across-map labels in section 4 are the method's rule, not
the code's.

**How many links two items may hold.** One, in practice.
- By hand or by script: one link per pair, whichever way it points. A
  second is silently ignored (`replay.js:247`; run).
- From the AI: within one reading of a text, one per pair. Across two
  readings, a link the other way round is accepted, so a pair can end up
  with `a → b` and `b → a` under different labels (`replay.js:139`; run).
- A link has no id. It cannot be pointed at, questioned, flagged, relabelled
  or removed. The only way a link leaves a map is when the reading at one
  end of it is discarded (`replay.js:300`).

**Who put it there.** Six ways a link gets onto a map:

| Way | Where | Labels it can produce |
|---|---|---|
| The AI chooses it while reading text | `ideaify.js`, then `normalize.js` | the 13 in `LINK_CHOICES`, or "connects to" when its choice is refused |
| A rule in the normalizer | `normalize.js:66`, `:83` | "replaces", "my reading" |
| The person keeps a reading | `replay.js:295` | "my reading" becomes "leads to" |
| The person settles an echo with "Link them" | `replay.js:322` | "echoes" |
| The person adds an item in the panel | `60-map.js:198`, `:438` | the 16 in `WORLD_LINKS.within` |
| A script line, `link a b: words` | `script.js:342` | any words |

The built-in samples are a seventh source in effect: their links were
written by hand into the code.

Things the page cannot do today, read from the code: link two items that
are both already on a map; make a link from one map to another (only a
script can); link two ideas on "what was said" by hand, other than by
settling an echo.

**How it is drawn.** The label has no look of its own. Every link is the
same thin line with the same arrowhead, and the label is the word in a
small box at its middle (`60-map.js:252-255`). Two things change the line,
and neither is the label:
- the reading colour, when `read` is true;
- dashes, when `read` is true or either end is a supposition.

On a world map only the links touching the middle item show their word;
the rest show it on hover (`60-map.js:184`). The key to the diagram has no
entry for links (`page.html:91-106`).

---

## 3. The first list: links between ideas read from text

`LINK_LABELS`, 15 labels. It is the older list.

**Where it came from.** The first design named eight kinds of link
(`VISION.md` §4.1, step 3): "supports, example-of, refines, contradicts,
**corrects** (A replaces B), raises (a question), answers, echoes". The
mockup of 2026-09-28 (commit 0168e6f) had thirteen: "contradicts" had
become "tension with", "corrects" had become "replaces", "supports" was
gone, and "leads to", "explains", "extends to", "includes", "pairs with"
and "traces to" had been added. No note in the repo says why each was
added or dropped. "connects to" and "my reading" are not choices; the code
assigns them.

**No label in this list has a written meaning.** The AI is given the
thirteen words as a list of allowed values and nothing more. The mockup's
prompt at least named them in a sentence; the prompt now names only
"traces to" ("Use 'traces to' only toward an ANCHOR", `ideaify.js:42`;
run). So what "refines" or "extends to" means is whatever the model takes
the bare words to mean. The "Reading" column below is Claude's, from how
the owner's sample uses each word.

| Label | Reading (Claude's) | Family | How it gets on a map | What the code does with it | In samples |
|---|---|---|---|---|---|
| example of | the first is a case of the second | hierarchical | AI | walked by traceback | 4 |
| leads to | the first brings about the second | causal | AI; a kept reading; also a world word | walked | 1, and 3 more as a world word |
| refines | the first says the second more exactly | hierarchical, loosely | AI | walked | 1 |
| explains | the first accounts for the second | causal, loosely | AI | walked | 2 |
| extends to | the first reaches as far as the second | associative, loosely | AI | walked | 1 |
| includes | the second is within the first | hierarchical | AI | walked | 1 |
| pairs with | the two belong side by side | associative | AI | walked | 1 |
| tension with | the two pull against each other | oppositional | AI | **never walked** | 1 |
| replaces | the first is said in place of the second; both kept | sequential | normalizer, when the person corrects themselves; the AI may also choose it | **never walked** | 2 |
| echoes | the two resonate | associative | AI; the person's "Link them" on an echo | walked | 0 |
| raises | the first brings up the second, a question | none of the six | AI | walked | 0 |
| answers | the first answers the second, a question | none of the six | AI | walked | 0 |
| traces to | the first goes back to the second, an anchor | hierarchical, loosely | AI, only if one end is an anchor | walked | 4 |
| connects to | joined, kind not said | associative | fallback only | walked | 0 |
| my reading | the second is the machine's reading of the first | none of the six | normalizer only | walked | 3 |

Notes on the ones with behaviour of their own:

- **tension with, replaces.** `DERIVATION_LABELS` (`replay.js:46`) is the
  list with these two taken out. The comment gives the reason: "A path
  through a contradiction or a replacement is not a derivation." This was a
  deliberate change from the mockup (`HANDOFF.md` §13).
- **replaces.** When the AI marks an idea as replacing another, the
  normalizer makes the link and marks the older idea replaced, so it is
  drawn struck through. But "replaces" is also on the list the AI may choose
  as an ordinary link label, and a link chosen that way marks nothing (run).
  The two routes give the same label and different maps.
- **traces to.** Kept only when an end is an anchor; otherwise it becomes
  "connects to" (`normalize.js:79`, tested in `tests/normalize.test.js`).
  The prompt says "toward an ANCHOR"; the check passes with the anchor at
  either end (run).
- **connects to.** The catch-all. It is what a link becomes when the AI's
  label is not on the list, when "traces to" is refused, or when a link is
  made with no words (`replay.js:248`). It is also the heading of the
  panel's list of links.
- **my reading.** Not a kind of relationship. It marks who made the link.
  Every reading must hang off something, so a reading with no other link
  gets one from the first idea it rests on (`normalize.js:83`). If the
  person keeps the reading, the label changes to "leads to"
  (`replay.js:295`), which says something the machine never claimed: that
  the idea brings the reading about.

---

## 4. The second list: links on the world maps

`WORLD_LINKS`, 16 within one map and 10 across maps.

**Where it came from.** These words were first written as free text in the
script that made Bobby's world (experiment E14, app 0.5.0, 2026-09-30).
The method is `METHOD-Deriving-the-Maps.md`. Its step 4 says how they were
chosen: "Link want, trust, pressure and calm to the intention, each with a
label that says how it bears on it." They were found by making one world,
not designed as a set. Grok's review the same day found "three different
link languages", and the words were gathered into one list at app 0.8.0.
A test (`tests/script.test.js:154-157`) fails if Bobby's world uses a word
outside the list, or if the method document leaves one out.

Unlike the first list, **every word here has a written meaning.** The
"Says" columns below are quoted from the method document, step 6.

### Within one map

| Label | Says (method document) | Family (Claude's) | Seen on | Bobby | Darlene |
|---|---|---|---|---|---|
| leads to | the first brings about the second | causal | environment, mental state | 2 | 1 |
| rests on | the first depends on the second | causal: dependence | assumptions | 2 | 0 |
| serves | the first is for the sake of the second | causal, loosely: purpose | assumptions | 2 | 2 |
| allows | the first makes the second possible | causal | mental state | 2 | 1 |
| presses | the first adds urgency to the second | causal | mental state | 1 | 1 |
| sharpens | the first makes the second more keenly felt | causal | mental state | 1 | 1 |
| lets it run | the first leaves the second undisturbed | causal, loosely | mental state | 1 | 0 |
| lacks | the first is missing the second | attributive | environment | 1 | 0 |
| shared with | the first is held in common with the second | associative | environment | 1 | 0 |
| within reach of | the second can be got to from the first | none of the six: place | environment | 1 | 2 |
| by | the first is done by means of the second | causal, loosely: means | environment | 1 | 1 |
| takes | the first requires the second | causal: dependence | environment | 1 | 0 |
| only if | the first holds only when the second does | causal: dependence | environment | 1 | 1 |
| part of | the first is a piece of the second | hierarchical | none | 0 | 0 |
| blocks | the first stands in the way of the second | oppositional | assumptions | 0 | 1 |
| where it starts | the first is the starting point of the second (what was said) | sequential | what was said | 1 | 0 |

### Across maps

The method document: "These are where the world hangs together, and they
are few."

| Label | From | To | Says (method document) | Family (Claude's) | Bobby | Darlene |
|---|---|---|---|---|---|---|
| read as a lack | what was said | environment | one reading of an ambiguous word | none of the six: a reading | 1 | 0 |
| read as a want | what was said | mental state | another reading of it | none: a reading | 1 | 0 |
| read as an ought | what was said | assumptions | a third | none: a reading | 1 | 0 |
| gives rise to | environment | mental state | a situation produces a want or a worry | causal | 1 | 2 |
| is who | environment | mental state | a person in the world is the person in mind | none: identity | 1 | 0 |
| is trusted | environment | mental state | a fact is taken for granted | none: belief about a fact | 2 | 1 |
| makes it worth doing | assumptions | mental state | a rule gives the intention its point | causal, loosely: purpose | 1 | 1 |
| limits how | assumptions | mental state | a rule constrains the way | oppositional, loosely | 1 | 1 |
| presses | assumptions or mental state | mental state | adds urgency | causal | 1 | 1 |
| carried out as | mental state | what was said | the intention became the act | sequential | 1 | 1 |

The From and To columns held in every sample link (run). The code does not
enforce them.

Three design choices in the method bear on these labels:

- **The three "read as" labels exist so that a question is not answered
  for the person.** "He needs milk" is read once on each map. Method
  document §5: "Placing it would have answered for him. Reading it once on
  each map lays the question out to be looked at."
- **"is trusted" exists because a fact and the trust in it are two items.**
  Method document §5: "Keeping them apart is what lets a surprise be drawn
  later: the fact fails while the trust was intact."
- **There is no map of motivation, so the across-map labels carry it.**
  Method document §5: "what moves Bobby shows up as the links that cross
  between maps ('gives rise to', 'makes it worth doing', 'presses')." It
  adds: "It is not settled."

---

## 5. Words in neither list

**The owner's sample has five.** `src/server/owner-sample.js:56-59`:
"tests", "grounds", "reframes", "raised with", "same session". They came
with the mockup's hand-written sample and were never in any list. They
draw like any other label. The traceback will not walk them, and that has
a visible cost: in that sample, the idea titled "The alarm guards who you
are" shows no path to an anchor, though it is joined by "tests" to an idea
that traces to one. Six ideas in that sample have no path for this reason
alone: they would have one if the walk refused only "tension with" and
"replaces" (run).

**A script can write anything.** `link a b: any words` stores the words as
written, cut at 40 characters (run). Nothing compares them to a list.
The AI's labels are put in lower case before they are checked; a script's
are not, so a script that writes "Leads To" makes a label that is not
"leads to" and is not walked (run).

---

## 6. Relationships the app keeps without a label

These join two things as surely as a link does, but they are not links and
have no label. An engine that reads relationships would have to decide
whether they count.

| What | Joins | Kept as |
|---|---|---|
| what a reading rests on | a reading to the ideas under it | `basis` on the reading |
| said again | an idea to a later saying of it | `also` and `touches` on the idea |
| replaced | an older idea to the one that replaced it | `replaced` on the idea, beside the "replaces" link |
| a loose end | a tension, an echo, a correction to the ideas it is about | `nodes` on the loose end |
| a goal reached | a goal to the fact it became | `stateId` on the goal, `goalId` on the fact |
| a move | a move to its goal, with closer, same, farther or not said | inside the goal |
| a suggestion | a Help analysis suggestion to what it rests on | `about` on the suggestion |
| an open question | a question to the item it hangs on | `slots` on the item |
| a goal read in text | a goal to the idea it came from | `ideaId`, which is never set |

Three relationships exist twice, once as a loose end waiting on the person
and once as a link: tension, echo, and correction. Only an echo's loose
end can turn into a link. A tension the person chooses to hold ("Kept
both") leaves no link behind.

A move's effect (closer, same, farther) is the nearest thing in the app to
a link with a weight on it. It joins an act to a goal and says which way
the act moved it. It lives in the state layer, not on any map.

---

## 7. The families

The 39 labels against the brief's six families. Claude's sorting.

| Family | Labels | Count |
|---|---|---|
| Causal or influence | leads to, explains, rests on, serves, allows, presses, sharpens, lets it run, by, takes, only if, gives rise to, makes it worth doing | 13 |
| Hierarchical | example of, refines, includes, traces to, part of | 5 |
| Associative | extends to, pairs with, echoes, connects to, shared with | 5 |
| Oppositional | tension with, blocks, limits how | 3 |
| Sequential | replaces, where it starts, carried out as | 3 |
| Attributive | lacks | 1 |
| None of the six | raises, answers, my reading, within reach of, read as a lack, read as a want, read as an ought, is who, is trusted | 9 |

What this shows:

- **A third of the labels are causal, and the family is not one thing.**
  It holds at least four different relations: bringing about (leads to,
  gives rise to), depending on (rests on, takes, only if), being for the
  sake of (serves, makes it worth doing), and changing how strongly
  something is felt (presses, sharpens). The brief's "causal" is too wide a
  word for what the world maps do.
- **Nine labels fit no family, and they are the most particular to this
  app.** Four kinds: question and answer (raises, answers); a reading of
  words (the three "read as", and "my reading"); a fact and the belief
  about it (is trusted, is who); and place (within reach of). The first
  three are about how a mind stands toward something, which the six
  families do not cover.
- **Attributive is nearly empty.** The app puts a quality in the item
  itself ("The store is open at this hour") and not on a link.
- **The two lists split the families between them.** The idea list holds
  the hierarchical and associative labels. The world list holds nearly all
  the causal ones. Opposition has one word on each side: "tension with"
  for ideas, "blocks" for world items.

---

## 8. The set as a whole

The brief's five checks. These are observations. Whether any of them is a
fault depends on what the labels are for, which section 10 leaves open.

**Coverage.** Formally complete, because "connects to" takes whatever does
not fit and a script can write any words. What has no word of its own:

- "supports" was in the first design and is in neither list.
- Before and after. The only time words are "replaces", "where it starts"
  and "carried out as".
- Opposition between two world items other than "blocks": nothing says one
  supposition contradicts another.
- How an act felt, or what came of it. The state layer has closer, same
  and farther for a move; the maps have nothing.

**Orthogonality.** Places where two labels cover the same ground:

- "leads to" and "gives rise to" have the same written meaning. The
  difference is only whether the link crosses maps.
- "rests on", "takes" and "only if" are three words for depending on
  something.
- "includes" (idea list) and "part of" (world list) are one relation
  pointed opposite ways.
- "pairs with", "echoes" and "connects to" are three associative words
  with no written difference.
- "refines", "replaces" and "extends to" all say the first is a later or
  better version of the second, to different degrees.
- "leads to" is in both lists. On a map of ideas it can be the AI's choice
  or the leftover of a kept reading; on a world map it is the method's
  word.

**Minimality.**

- "part of" appears in no sample.
- "echoes", "raises", "answers" and "connects to" appear in no sample.
  They can still arrive from the AI.
- Seventeen of the 25 world labels appear exactly once in Bobby's world.
  That is what a list gathered from one worked example looks like.
- Which of the AI's thirteen it actually uses on real text is not known
  here.

**Consistency.**

- *The sentence does not always read the way the arrow points.* Most
  labels read as "first, label, second". Some do not. "within reach of" is
  defined as "the second can be got to from the first", so the arrow runs
  from home to the store while the words say the store is within reach of
  home. "is trusted", "is who" and "where it starts" read as statements
  about the first item with the second left hanging. In "lacks", the
  second item is itself the statement of the lack ("There is no milk in
  the house").
- *Two-way relations are stored and drawn one-way.* "pairs with", "tension
  with", "echoes", "shared with" and "connects to" have no natural
  direction and get an arrowhead anyway.
- *The traceback list is a list of what may be walked, though the reason
  given is about two labels that may not.* The comment says a contradiction
  or a replacement is not a derivation. The code allows only the 13 named
  labels, so every world label but "leads to", every free word from a
  script, and the five extra words in the owner's sample are also not
  walked. Section 5 has the visible result.
- *Upper and lower case.* The AI's labels are lowered; a script's are kept
  as typed.
- *One pair, one link, except from the AI across two readings* (section
  2).
- *The same label by two routes.* "replaces" (section 3).
- *One list typed twice.* `LINK_CHOICES` repeats thirteen of `LINK_LABELS`
  by hand. Adding a label to one and not the other would not fail a test.

**Reversibility.** No label has a stated opposite-direction form. The
direction of the arrow carries it, and the panel shows "← label" from the
far end. That reads well for some ("← leads to") and badly for others
("← lacks", "← by", "← is who"). The only pair of true inverses in the 39
is "includes" and "part of", and they sit in different lists.

---

## 9. Where the brief and the code differ

The brief was written without sight of the code and says so. For the next
reader of both:

| The brief expects | The code has |
|---|---|
| labels in "an enum, a config, a schema, a constants file" | two constants in `src/shared/replay.js`, one repeated in `src/server/ideaify.js` |
| "at least half a dozen" | 39 in the lists, and free words beyond them |
| strength, weight or confidence | none |
| type constraints on what a label may join | none enforced; one rule for "traces to" |
| a "meaning enhancement generator" as a source of inferred links | the nearest thing is Ideaify (`src/server/ideaify.js`), one AI call that reads text into ideas and links. It chooses a label from thirteen bare words and proposes links only among ideas read from text, never on the world maps |
| visual encoding by label | none; the word is the only thing that differs |
| "ancient historical texts and matching Bible quotes" as a source of links | not in the code. The owner's sample has two scripture quotes as anchors and four hand-written "traces to" links to them. No step reads source texts or matches quotes |

On the last row: the first design does describe a background corpus
(`VISION.md` §9, E9, proposed and not built). The brief describes
something intended, not something present.

---

## 10. What the labels could do (open)

Everything in this section is Claude's, set down to keep the question
wide, as Phil asked. None of it is decided, and the list is not ranked.
It is recorded in `VISION.md` §9 as experiment E20, status *proposed*.

The starting fact is in section 1: today nothing that reasons reads a
label. The engine is unbuilt, so each of these is a thing the labels could
be made to carry.

**A. The label as a record, not a word.** Each label could have a small
entry the engine reads: which way it points, whether it is two-way, how it
reads from the far end, what family it is in, which maps it may join,
which questions it may be walked for, and what question it raises. Today
that knowledge is in three places in the code and one table in the method
document. Every use below would lean on such a record.

**B. Different walks for different questions.** The traceback is one walk:
follow anything that is not a contradiction or a replacement until an
anchor is reached. The same map could be walked other ways, each by a
different set of labels:
- *What does this set in motion?* Forward along leads to, gives rise to,
  allows.
- *What has to hold for this to work?* Along takes, only if, rests on, by.
- *Why does this matter?* Up along serves and makes it worth doing, which
  is the ladder the method climbs by hand in its step 5.
- *What stands against it?* Collect blocks, limits how, tension with.
- *What else could these words mean?* The fan of "read as" from one saying.

The Drive document *From Energy to Decisions* (2026-10-02), Part IV, asks
for the first, third and fourth of these: "Judging a decision becomes a
graph operation: trace the edges from a contemplated bubble."

**C. Loop or build.** The same document's sharpest test: "does this path
leave a structure standing when the motion stops, or does it return the
person to where they began?" On a map that is a walk that comes back to its start
against one that ends in something that lasts. It would need a way to say
what lasts, which no label does now.

**D. A question from every link.** Each label implies the question that
would check it: "only if" asks whether the condition holds, "is trusted"
asks what happens if the fact fails, "takes" asks whether the person has
it. The first design said "Links get slots too, because the arcs explode
as well as the nodes" (`VISION.md` §4.1, step 5). Open questions hang on
items today and never on links.

**E. A link that can be supposed.** An item is given or supposed, and a
supposition can be confirmed or ruled out. A link has no standing of its
own; it is dashed only when one end is. "The store being far *gives rise
to* his worry" is a claim separate from the store and the worry, and could
be confirmed or ruled out by itself. `ARCHITECTURE.md` (step 3) asks for
one record of "who claimed it … on what basis … and how it stands" on
every item; the same record could sit on every link.

**F. Naming a surprise.** A fact and the trust in it are two items joined
by "is trusted". When the fact is ruled out and the trust still stands,
that is the surprise the method says it wants to be able to draw. The
label is what would let the engine see it.

**G. Motivation read off the crossing links.** If what moves a person
shows up as the links that cross between maps, then counting and following
those links is a way to read motivation without a map of its own. This
bears on the open question between the gap and the battery (`VISION.md`,
end of §9).

**H. What came of it.** The Drive document *Sunlight, Movement, and the
Meaning Problem* ends on a loop: act, experience, interpret, want again.
The maps have no label for how an act felt or what it left behind. A
family of labels from a move to what it built or cost would be the place
that loop is kept.

**I. Two people, one world.** Two maps with the same items and different
labels describe different worlds; the brief opens on that. Where two
people's maps of one situation differ in a label, that is a disagreement
that can be pointed at.

**J. The AI given the meanings.** The world labels have written meanings
and the AI is not asked to use them. The idea labels have no written
meanings and the AI is asked to use them. Either could change: the AI
could be given the meanings, or could propose world links as suppositions.

**K. Evidence for labels.** The Evidence view counts how the machine's
readings and goals fared. It could count how its labels fared, if a person
could say "not that word, this one". That needs links that can be
relabelled, which needs links that can be pointed at.

**L. A library that answers.** If old texts are a store of earlier answers
to "what is worth doing", then "answers" and "echoes" are the labels that
would join a person's live question to them. Both are in the list and in
no sample.

**M. What sets off an old pattern.** Phil, 2026-10-02, while this was
being written: "A person's mental map has components of trauma, and long
recorded behavior patterns, that are triggered by discovered patterns he
encounters." Read against the labels, that names a relationship none of
the 39 says: something met in the environment *sets off* something long
held in the mental state, which then drives what the person does. The
nearest word today is "gives rise to" ("a situation produces a want or a
worry"), and it does not tell a fresh response from an old one firing
again. Three things in the statement have no place on a map yet: that a
mental item can be old and laid down by many repetitions or by one wound;
that what sets it off is a *pattern* the person recognises, not one fact;
and that the response is a pattern of behaviour, not one act. This is
Claude's reading of one sentence, and Phil had not finished speaking.

Three things nearly all of these would need first, whichever are chosen: a
link that can be pointed at; a way to change or withdraw a link, as a step
like any other; and the labels' meanings kept in one place the engine can
read.

---

## 11. Questions that are Phil's to answer

None of these needs an answer now. They are the places where the code has
made a choice that looks like his to make.

1. Are the labels between ideas and the labels on the world maps one
   vocabulary or two? They overlap at "leads to" and split opposition and
   containment between them.
2. May two items hold more than one relationship? Darlene's rule about not
   forcing someone both "blocks" and "limits how", but toward two
   different items. The same two items cannot say both.
3. Does a relationship have a standing of its own (supposed, confirmed,
   ruled out), apart from the two things it joins?
4. The five words in the owner's sample that are in no list ("tests",
   "grounds", "reframes", "raised with", "same session"): are they
   distinctions worth keeping as labels?
5. Is a label a word the person would say, or a term of the engine's? The
   world labels were written as plain speech ("lets it run", "makes it
   worth doing"). An engine that reasons over them may want fewer and
   stricter ones. Both could exist, one shown and one underneath.

---

## 12. Change log

| Version | Date | What changed |
|---|---|---|
| 1 | 2026-10-02 | First written, from the code at app 0.11.0 (commit 823ee87). No code was changed. |
| 1, note | 2026-10-02 | The same day, at app 0.12.0, the help gained a section listing all 39 words (`HELP.md`, "The links"). Two things in this document are changed by that. Section 3 says no idea label has a written meaning: the help now gives each one, in the wording of the "Reading" column here. The AI is still given only the bare words. And a test now holds the help's tables to `LINK_LABELS` and `WORLD_LINKS`. The help sorts the words into eleven kinds: the six families of section 7, in plainer words, and five more for the nine labels that fit none. |

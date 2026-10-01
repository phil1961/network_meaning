# Method: Deriving the Maps of a World

Version 2, 2026-09-30. Written by Claude at Phil's request: "I love what you
have invented so far with regard to deriving the map data. Make sure to
create a document of your thinking so it can be reliably replicated and to
have an artifact we can track over time in our repo."

This is the method used to make *Bobby's world*, written down so that a
person or an AI can follow it and get the same kind of result, and so that
changes to the method can be seen over time. The change log is at the end.
Everything here is Claude's design, under test, unless it is marked as
Phil's words. The design record is `VISION.md` §9, experiment E14.

---

## 1. What the method is for

Input: a little that was said about a person. It can be one sentence.

Output: four maps of that person's world.

| Map | Holds | Script word |
|---|---|---|
| What was said | the evidence, verbatim | `said` |
| Environment | the situation: places, people, things, means | `environment` |
| Mental state | what they want, take for granted, and mean to do | `mental` |
| Assumptions | what they take to be right (moral presuppositions) | `assumption` |

Phil's framing (2026-09-30): "We are modelling a world... It consists of
facts about his environment, his mental furniture, and his motivations,"
and the software "ought to have maps that represent each of those features.
His environment, mental state, and assumptions (moral presuppositions)."

The method's one job is to get from a thin sentence to those maps without
pretending to know more than was said.

## 2. The stance: an investigator, not an author

An author invents a character. An investigator has a file with very little
in it and works outward, keeping what is known apart from what is supposed.
Six rules follow from that stance. They are the method; the rest is detail.

1. **Evidence first.** Only what was actually said is *given*. Write it
   down word for word and add nothing to it.
2. **Everything else is a supposition and says so.** It is drawn dashed.
   It can later be *confirmed* (solid, dated) or *ruled out* (kept, struck
   through). Nothing is deleted.
3. **Every supposition carries the question that would check it.** If no
   question could check it, it does not belong on a map.
4. **Read an ambiguous word every way it can be read before choosing.**
   Put one reading on each map it could belong to, and link each back to
   the words. Choosing is the person's job, not the method's.
5. **One item, one claim.** A sentence that makes two claims is two items.
6. **Plain words.** Write each item as the person might say it. No
   technical terms on the map.

Why this stance: the project's oldest rule is that an AI "has no stuckness
and will find profound meaning in anything." A made-up world is exactly
where that failure would show. Marking every invented item as supposed, and
making it name its own test, is what keeps a fluent guess from passing as a
fact.

## 3. The procedure

Do the steps in this order. The order is part of the method: each map is
built on the one before.

### Step 1. What was said

- Copy each thing that was said, verbatim, as its own item. Do not tidy
  the wording.
- If the same thing was said two ways, keep the earlier wording and hang
  the difference on it as an open question. (Bobby: "get" milk, later
  "buy" milk.)
- Put them in story order. The first one is the middle of this map.
- Link them to each other only where the words themselves do. (Bobby:
  the need is "where it starts" for the act.)

### Step 2. Find the words that could mean more than one thing

Read each item and mark any word that could be a fact about the world, a
state of mind, or a rule. "Needs" is all three: a lack, a want, an ought.
Verbs of purpose ("to get") and of obligation ("has to", "should") are the
usual places.

You will come back to these in steps 3 to 5 and place one reading on each
map, each linked from the original words with a label that begins "read
as".

### Step 3. Environment, from near to far

Ask these in order and write one supposed item for each that the words
imply. Skip any the words give no reason for.

1. **Where does it start?** The place the person sets out from. This is
   the middle of the map.
2. **What is lacking or present there?** The reading of any "need" as a
   lack goes here.
3. **Who else is there?**
4. **Where is the thing they are going to?**
5. **What is the way there?**
6. **What does it take?** Money, time, a tool, permission.
7. **What has to be true for it to work?** Open, available, in stock.

Link each to the middle item, or to the item it depends on, so that
nothing is more than two links from the middle. For each, write the
question that would check it.

### Step 4. Mental state: want, taken for granted, intention

1. **Intention.** What the person means to do, taken from the act. This is
   the middle of the map. It is still a supposition: the teller said what
   was done, and the purpose is the teller's reading.
2. **Want.** The reading of any "need" as a want goes here. It leads to
   the intention.
3. **Who it is for,** if step 3 supposed someone else.
4. **What is taken for granted.** For each environment item the plan
   depends on, the person's trust in it is a separate item: "He takes it
   for granted that the store will have milk." This is what Phil calls
   mental furniture. It is not the same item as the fact about the store,
   because the trust can be wrong while the fact is right, and the other
   way round.
5. **Pressure.** Is there any sense that it should be now?
6. **Alarm.** Is anything about it alarming to the person? "Nothing about
   the errand alarms him" is a real item: it says the furniture is intact.

Link want, trust, pressure and calm to the intention, each with a label
that says how it bears on it.

### Step 5. Assumptions, by asking "why does that matter?"

Start from the intention and ask "why does that matter?" Write the answer
as a general rule the person would hold, not as a fact about this day.
Then ask the same question of the answer. Stop when the answer stops
changing or the words give no more reason.

- Phrase each as a rule: "Those at home should not go without." "You pay
  for what you take from a store."
- The first answer is the middle of the map. The reading of any "need" as
  an ought goes here.
- Add the rules that govern *how*, not only *why*: paying, keeping one's
  word.
- Leave the top of the ladder open. The last item carries the question
  "What is this grounded in, for this person?" The method does not supply
  the person's foundation for them.

### Step 6. Links, within a map and across maps

A link says how the first item bears on the second, in a few plain words.
There is one list of these words. It lives in the code as `WORLD_LINKS` in
`src/shared/replay.js`, the panel offers the same words when an item is
added by hand, and a test fails if this document and that list differ. A
script can still write any words; these are the ones the method uses.

**Within one map:**

| Word | Says |
|---|---|
| leads to | the first brings about the second |
| rests on | the first depends on the second |
| serves | the first is for the sake of the second |
| allows | the first makes the second possible |
| presses | the first adds urgency to the second |
| sharpens | the first makes the second more keenly felt |
| lets it run | the first leaves the second undisturbed |
| lacks | the first is missing the second |
| shared with | the first is held in common with the second |
| within reach of | the second can be got to from the first |
| by | the first is done by means of the second |
| takes | the first requires the second |
| only if | the first holds only when the second does |
| part of | the first is a piece of the second |
| blocks | the first stands in the way of the second |
| where it starts | the first is the starting point of the second (what was said) |

**Across maps.** These are where the world hangs together, and they are few:

| Word | From | To | Says |
|---|---|---|---|
| read as a lack | what was said | environment | one reading of an ambiguous word |
| read as a want | what was said | mental state | another reading of it |
| read as an ought | what was said | assumptions | a third |
| gives rise to | environment | mental state | a situation produces a want or a worry |
| is who | environment | mental state | a person in the world is the person in mind |
| is trusted | environment | mental state | a fact is taken for granted |
| makes it worth doing | assumptions | mental state | a rule gives the intention its point |
| limits how | assumptions | mental state | a rule constrains the way |
| presses | assumptions or mental state | mental state | adds urgency |
| carried out as | mental state | what was said | the intention became the act |

The links the AI proposes between ideas it reads from text use a different,
older list (`LINK_LABELS`: example of, refines, tension with, and so on).
That list is for what was said. This one is for the world maps.

### Step 7. Check the result

A world made by this method passes all of these. `tests/script.test.js`
checks the first five for Bobby's world.

1. What was said holds only what was said, word for word.
2. Every item on the other three maps is supposed.
3. No item is left unlinked.
4. Each ambiguous word has exactly one reading on each map it could
   belong to.
5. Each map has a middle item, and it is the one named in steps 1 to 5.
6. Most suppositions carry a question, and each question could be
   answered by the person in a sentence.
7. No item appears on two maps. If one seems to belong on two, it is two
   claims: split it (the fact, and the trust in the fact).
8. Nothing on any map uses a word the person would not use.

### Step 8. Then improve it

The first version is a starting position. It is improved by the person,
one item at a time: confirm a supposition, rule one out, answer a
question, add a complication. Each change is a dated step, so the earlier
world can always be brought back.

## 4. The worked example: Bobby

Given: "He needs milk." and "Bobby went to the store to get milk."

| Map | Items (middle item first) |
|---|---|
| What was said (2) | He needs milk. · Bobby went to the store to get milk. |
| Environment (7) | Bobby sets out from home. · There is no milk in the house. · Someone else lives there and uses milk. · A store that sells milk is within reach. · He has a way to get there and back. · He has the money to pay for it. · The store is open at this hour. |
| Mental state (7) | He means to go to the store and come back with milk. · He wants there to be milk at home. · He has someone in mind who is waiting for it. · He takes it for granted that the store will have milk. · He takes it for granted that he can get there and back. · Nothing about the errand alarms him. · He feels it should be done now, not later. |
| Assumptions (5) | Those at home should not go without. · You look after the people near you. · The one who can go, goes. · If you said you would get it, you get it. · You pay for what you take from a store. |

Counts: 21 items, 29 links, 13 open questions.

The exact world is the built-in script *Bobby's world, assembled* in
`src/shared/script.js` (`SCRIPT_EXAMPLES.world`). The built-in sample is
that script run in the page, so the example and the app cannot drift. To
replicate it, run the script in the stepper and watch the order.

### A second example: Darlene

Given: "Darlene took Thursday morning off to drive her mother to the eye
doctor." The built-in sample *Darlene and the appointment* applies the same
steps to a different person and goal: 5 environment items, 5 mental-state
items and 4 assumptions beside the facts, the goal and its moves. It shows
two things Bobby's world does not. A supposition is **ruled out** when the
world answers ("She takes it for granted that Mom will want to go" meets
"Mom says she doesn't want to go"), and stays on the map struck through.
And an assumption **blocks** another: "You don't make someone go against
their will" stands in the way of "You look after your mother when she can't
look after herself."

## 5. Decisions, and the thinking behind each

- **"He needs milk" is read three times, not placed once.** Phil was asked
  which map it belongs to and set the question aside. Placing it would
  have answered for him. Reading it once on each map lays the question out
  to be looked at.
- **There is no map of motivation.** Phil's first list had "motivations";
  his second had "assumptions" in its place. In the made-up world, what
  moves Bobby shows up as the links that cross between maps ("gives rise
  to", "makes it worth doing", "presses"). That fits the earlier note that
  motivation is read off the distance between layers. It is not settled.
- **A fact and the trust in it are separate items.** The store having milk
  is environment. Bobby taking that for granted is mental state. Keeping
  them apart is what lets a surprise be drawn later: the fact fails while
  the trust was intact.
- **"Get", not "buy".** The sentence fixed earlier says "get". Phil later
  said "buy". Buying implies paying, which is an assumption. So the world
  keeps "get" as given, supposes "You pay for what you take from a store",
  and hangs the question on both.
- **The intention is supposed, though the sentence states a purpose.** The
  teller reported an act and attributed a purpose. An investigator treats
  the attribution as a reading until the person says so.
- **The top of the assumptions is left open.** The method stops at "You
  look after the people near you" and asks what that is grounded in. It
  does not write Phil's theology, or anyone's, into Bobby.
- **Home is the middle of the environment,** because the situation is
  worked from near to far and home is nearest.

## 6. Replicating it with an AI

Give the AI this document and the words that were said, and ask for the
output as a script in the app's language (see README, "Scripts and the
stepper"), in the order of steps 1 to 6. Then run the script in the
stepper. Two things make the result checkable: the script either runs or
stops at a line with a reason, and step 7 is a list of tests.

Whatever an AI produces by this method arrives as supposed. A person
confirms it or rules it out.

The app does not yet do this on its own. Today the model reads text into
ideas and goals (Ideaify) and makes suggestions (Help analysis); it does
not propose items for the three world maps. Phil has agreed that the model
may write scripts, which is the natural way for it to start.

## 7. Where the method is weak

- **It has been run once, on one sentence, by its own author.** It is not
  yet shown to give the same result in other hands.
- **The three maps can blur.** "He has the money to pay for it" is
  environment; "He can afford it" would be mental state. Rule 7 in step 7
  is the only guard.
- **The questions in step 3 fit an errand.** A world about a quarrel or a
  loss will need different questions under the same headings.
- **Depth is arbitrary.** The ladder in step 5 stops where the words run
  out, which is a judgment.
- **The borrowed ideas are from memory.** The method draws on Kurt Lewin's
  life space, Henry Murray's pairing of need and press, the belief, desire
  and intention account of action, the cognitive-therapy case formulation,
  and laddering from personal construct psychology. These are recalled,
  not checked against sources, and should be verified before any of this
  is published.

## 8. Change log

| Version | Date | What changed |
|---|---|---|
| 1 | 2026-09-30 | First written, from the making of Bobby's world (app 0.5.0). |
| 2 | 2026-09-30 | Step 6 rewritten: the link words are one list (`WORLD_LINKS`), given in full here, offered by the panel, and held to this document by a test. A second worked example, Darlene, added. Prompted by Grok's review, which found three link vocabularies. (App 0.8.0.) |

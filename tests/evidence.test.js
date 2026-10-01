/* ─────────────────────────────────────────────
   File: tests/evidence.test.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   Evidence: what became of the machine's claims, counted from the steps
   alone. No server, no model, no database. */
import test from "node:test";
import assert from "node:assert/strict";
import { evidence, evidenceEmpty } from "../src/shared/evidence.js";
import { replay } from "../src/shared/replay.js";

const said = t => ({ t, kind: "idea", stuck: true, src: "user_said", words: t, slots: [], history: [] });
const reading = (t, basis) => ({ t, kind: "idea", stuck: false, src: "inferred", reading: t, basis, slots: [], history: [] });
const flag = (id, type) => ({ id, type, text: type, detail: "", nodes: [], phrase: "", suggestion: "", question: "" });
const act = (action, date = "Sep 30") => ({ kind: "action", date, source: "test", action });
const pass = (model, result, dropped = 0) => ({ kind: "ingest", date: "Sep 30", source: "text", text: "t", model, tier: "default", usage: { model, dropped }, result: { add: {}, touch: [], replace: [], links: [], flags: [], goals: [], question: "", ...result } });

function story() {
  return [
    pass("model-a", { add: { i1: said("One"), i2: said("Two"), r1: reading("Reading one", ["i1"]), r2: reading("Reading two", ["i2"]), r3: reading("Reading three", ["i1"]) },
      flags: [flag("f1", "garble"), flag("f2", "echo"), flag("f3", "gap")],
      goals: [{ id: "g1", t: "Get milk", words: "get milk", moves: [{ text: "went to the store" }] }, { id: "g2", t: "Fix the car", words: "fix the car", moves: [] }] }, 2),
    act({ type: "keep", id: "r1" }),
    act({ type: "discard", id: "r2" }),
    act({ type: "acceptgoal", goalId: "g1" }),
    act({ type: "rejectgoal", goalId: "g2" }),
    act({ type: "flag", flagId: "f1", choice: "accept" }),
    act({ type: "flag", flagId: "f2", choice: "later" }),
    pass("model-b", { add: { i3: said("Three"), r4: reading("Reading four", ["i3"]) }, touch: [{ id: "i1", also: { words: "one again" }, slots: [] }], replace: [{ id: "i2", by: "i3" }],
      goals: [{ id: "g1", existing: true, moves: [{ text: "paid" }, { text: "came home" }] }] }, 1),
    act({ type: "item", id: "w1", map: "env", text: "A store is near.", supposed: true }),
    act({ type: "item", id: "w2", map: "mind", text: "He wants milk.", supposed: true }),
    act({ type: "item", id: "w3", map: "moral", text: "You pay.", supposed: true }),
    act({ type: "item", id: "w4", map: "env", text: "He is at home.", supposed: false }),
    act({ type: "item", id: "w5", map: "said", text: "He needs milk." }),
    act({ type: "confirm", id: "w1" }),
    act({ type: "ruleout", id: "w2" }),
    act({ type: "analysis", id: "h1", model: "model-b", standing: "s", suggestions: [{ id: "h1-1", kind: "move", text: "Go.", why: "", about: [] }, { id: "h1-2", kind: "question", text: "Why?", why: "", about: [] }, { id: "h1-3", kind: "question", text: "  ", why: "", about: [] }] }),
    act({ type: "verdict", analysisId: "h1", suggestionId: "h1-1", mark: "wrong" }),
    act({ type: "verdict", analysisId: "h1", suggestionId: "h1-1", mark: "new" }),
    act({ type: "verdict", analysisId: "h1", suggestionId: "h1-9", mark: "new" }),
    act({ type: "verdict", analysisId: "h1", suggestionId: "h1-2", mark: "splendid" })
  ];
}

test("every verdict the person gave is counted from the steps: readings, goals, loose ends, suppositions, suggestions", () => {
  const E = evidence(story());
  assert.equal(E.steps, 20);
  assert.equal(E.passes, 2);
  assert.equal(E.dropped, 3, "dropped for citing nothing, as each pass recorded it");
  assert.deepEqual(E.words, { ideas: 3, again: 1, replaced: 1 });
  assert.deepEqual(E.readings, { made: 4, kept: 1, discarded: 1, open: 2 });
  assert.deepEqual(E.goals, { read: 2, accepted: 1, rejected: 1, open: 0, moves: 3 });
  assert.equal(E.loose.raised, 3);
  assert.equal(E.loose.settled, 1);
  assert.equal(E.loose.open, 2);
  assert.equal(E.loose.later, 1, "“later” is not an answer: it stays open, counted as put off");
  assert.deepEqual(E.loose.byType, { garble: 1, echo: 1, gap: 1 });
  assert.deepEqual(E.loose.byChoice, { accept: 1 });
  assert.deepEqual(E.suppositions, { made: 3, confirmed: 1, ruledOut: 1, open: 1, given: 1 }, "an item on what was said is not a supposition and is not counted");
  assert.deepEqual(E.help, { analyses: 1, suggestions: 2, new: 1, knew: 0, wrong: 0, unmarked: 1 }, "the latest word on a suggestion stands; a blank suggestion, an unknown one and an unknown mark count for nothing");
});

test("the counts are split by the model that made each claim", () => {
  const E = evidence(story());
  const a = E.byModel.find(m => m.model === "model-a"), b = E.byModel.find(m => m.model === "model-b");
  assert.deepEqual([a.passes, a.ideas, a.dropped, a.readings, a.kept, a.discarded, a.goals, a.accepted, a.rejected], [1, 2, 2, 3, 1, 1, 2, 1, 1]);
  assert.deepEqual([b.passes, b.ideas, b.dropped, b.readings, b.kept, b.discarded, b.goals, b.suggestions, b.new], [1, 1, 1, 1, 0, 0, 0, 2, 1]);
  const E2 = evidence([pass(null, { add: { i1: said("One") } })]);
  assert.equal(E2.byModel[0].model, "not recorded", "a pass with no model named is still counted");
});

test("a prefix of the steps gives the counts as they stood then", () => {
  const steps = story();
  const early = evidence(steps.slice(0, 2));
  assert.deepEqual(early.readings, { made: 3, kept: 1, discarded: 0, open: 2 });
  assert.deepEqual(early.goals, { read: 2, accepted: 0, rejected: 0, open: 2, moves: 1 });
  assert.equal(evidenceEmpty(evidence([])), true);
  assert.equal(evidenceEmpty(evidence([act({ type: "state", stateId: "s1", text: "A fact." })])), true, "a fact the person put forth is not a claim by the machine");
  assert.equal(evidenceEmpty(early), false);
});

test("it agrees with the reducer on what can be kept or discarded, and nothing odd breaks it", () => {
  const steps = story();
  const S = replay(steps);
  assert.equal(S.nodes.r1.kept, true);
  assert.equal(S.nodes.r2, undefined);
  /* keeping a reading twice, discarding one already kept, acting on the person's own words, and ids that are not ids */
  const odd = steps.concat([act({ type: "keep", id: "r1" }), act({ type: "discard", id: "r1" }), act({ type: "discard", id: "i1" }), act({ type: "keep", id: "__proto__" }), act({ type: "flag", flagId: "nope", choice: "ok" }), null, { kind: "action" }, { kind: "ingest" }, "junk"]);
  const E = evidence(odd);
  assert.deepEqual(E.readings, { made: 4, kept: 1, discarded: 1, open: 2 });
  assert.equal(E.passes, 3, "a pass with no result is still a pass");
  assert.deepEqual(evidence(null).readings, { made: 0, kept: 0, discarded: 0, open: 0 });
  assert.equal(({}).fate, undefined, "nothing was written where it should not be");
});

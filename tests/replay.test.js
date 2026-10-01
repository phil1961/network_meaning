/* ─────────────────────────────────────────────
   File: tests/replay.test.js
   File Version: 0.6.0
   ───────────────────────────────────────────── */
import test from "node:test";
import assert from "node:assert/strict";
import { replay, actOf, traceToAnchor, pickFocus, pickFocusIn, mapMiddle, mapOf, neighbors, mapListing, currentState, pastState, movement, stateListing, actionOk, safeId, WORLD_LINKS } from "../src/shared/replay.js";

const node = (t, extra = {}) => ({ t, kind: "idea", stuck: true, src: "user_said", words: t + " words", slots: [], history: [], ...extra });

function sampleSteps() {
  return [
    { kind: "ingest", seq: 0, date: "Sep 20", source: "anchors", result: { add: { a: node("Anchor", { anchor: true, src: "quoted_text", kind: "quote" }) }, touch: [], replace: [], links: [], flags: [], question: "" } },
    { kind: "ingest", seq: 1, date: "Sep 21", source: "chat one", result: {
      add: { x: node("Idea X"), y: node("Idea Y"), r1: { t: "Reading", kind: "idea", stuck: false, src: "inferred", reading: "machine text", basis: ["x"], slots: [], history: [] } },
      touch: [], replace: [],
      links: [{ a: "x", b: "a", f: "traces to", read: false }, { a: "y", b: "x", f: "tension with", read: false }, { a: "x", b: "r1", f: "my reading", read: true }],
      flags: [{ id: "f1", type: "gap", text: "gap", detail: "", nodes: ["x"], phrase: "", suggestion: "", question: "q" }], question: "One question?" } }
  ];
}

test("replay builds nodes, links, flags and the question", () => {
  const S = replay(sampleSteps());
  assert.equal(Object.keys(S.nodes).length, 4);
  assert.equal(S.links.length, 3);
  assert.equal(S.flags.length, 1);
  assert.equal(S.question.text, "One question?");
  assert.equal(S.ingests, 2);
  assert.deepEqual(S.nodes.x.touches, [1]);
});

test("a match touches the existing node instead of cloning it", () => {
  const steps = sampleSteps();
  steps.push({ kind: "ingest", seq: 2, date: "Sep 22", source: "again", result: { add: {}, touch: [{ id: "x", also: { words: "said again", date: "Sep 22", source: "again" }, slots: ["why?"] }], replace: [], links: [], flags: [], question: "" } });
  const S = replay(steps);
  assert.deepEqual(S.nodes.x.touches, [1, 2]);
  assert.equal(S.nodes.x.also.length, 1);
  assert.deepEqual(S.nodes.x.slots, ["why?"]);
  assert.equal(actOf(S, S.nodes.x), "settled");
  assert.equal(actOf(S, S.nodes.y), "settled");
});

test("keep makes a reading fixed but never turns it into the person's words", () => {
  const steps = sampleSteps();
  steps.push({ kind: "action", seq: 2, date: "Sep 22", source: "keep", action: { type: "keep", id: "r1" } });
  const S = replay(steps);
  const r = S.nodes.r1;
  assert.equal(r.stuck, true);
  assert.equal(r.kept, true);
  assert.equal(r.src, "user_confirmed");
  assert.equal(r.words, undefined, "the reading text must not become words");
  assert.equal(r.reading, "machine text");
  const l = S.links.find(x => x.b === "r1");
  assert.equal(l.read, false);
  assert.equal(l.f, "leads to");
});

test("discard removes a reading and its links; other nodes are untouched", () => {
  const steps = sampleSteps();
  steps.push({ kind: "action", seq: 2, date: "Sep 22", source: "discard", action: { type: "discard", id: "r1" } });
  const S = replay(steps);
  assert.equal(S.nodes.r1, undefined);
  assert.equal(S.links.length, 2);
  assert.equal(S.nodes.x.words, "Idea X words");
});

test("traceback follows derivation links only", () => {
  const S = replay(sampleSteps());
  assert.deepEqual(traceToAnchor(S, "x").map(p => p.id), ["x", "a"]);
  assert.deepEqual(traceToAnchor(S, "y"), [], "y reaches the anchor only through a tension link");
  assert.equal(traceToAnchor(S, "a"), null);
});

test("flag outcomes: accept adds a history note and clears the slot; link adds an echo link", () => {
  const steps = sampleSteps();
  steps[1].result.flags.push({ id: "f2", type: "garble", text: "g", detail: "", nodes: ["y"], phrase: "Capsaro", suggestion: "Kastrup", question: "" });
  steps[1].result.add.y.slots = ["Who is Capsaro?"];
  steps[1].result.flags.push({ id: "f3", type: "echo", text: "e", detail: "", nodes: ["y", "a"], phrase: "", suggestion: "", question: "" });
  steps.push({ kind: "action", seq: 2, date: "Sep 22", source: "flag", action: { type: "flag", flagId: "f2", choice: "accept" } });
  steps.push({ kind: "action", seq: 3, date: "Sep 22", source: "flag", action: { type: "flag", flagId: "f3", choice: "link" } });
  const S = replay(steps);
  assert.match(S.outcomes.f2, /Kastrup/);
  assert.deepEqual(S.nodes.y.slots, []);
  assert.equal(S.nodes.y.history.length, 1);
  assert.ok(S.links.some(l => l.f === "echoes"));
  assert.equal(S.outcomes.f3, "Linked on the map.");
});

test("pickFocus prefers a recently touched stuck node with the most links; listing is bounded", () => {
  const S = replay(sampleSteps());
  assert.equal(pickFocus(S), "x");
  assert.equal(neighbors(S, "x").length, 3);
  const listing = mapListing(S, 2).split("\n");
  assert.equal(listing.length, 2);
  assert.match(mapListing(S), /a \| quote \| ANCHOR \| Anchor/);
  assert.match(mapListing(S), /r1 \| reading \| Reading/);
});

/* The state layer: Bobby went to the store to get milk. */
const act = (seq, date, action) => ({ kind: "action", seq, date, source: "state", action });
function bobbySteps() {
  return [
    act(0, "Sep 30", { type: "state", stateId: "s-home", text: "Bobby is at home." }),
    act(1, "Sep 30", { type: "state", stateId: "s-nomilk", text: "There is no milk in the house." }),
    { kind: "ingest", seq: 2, date: "Sep 30", source: "the story", result: { add: {}, touch: [], replace: [], links: [], flags: [], question: "Did Bobby get the milk?",
      goals: [{ id: "g-milk", t: "Get milk", words: "Bobby went to the store to get milk.", at: "¶ 1", ideaId: null, moves: [{ text: "Bobby went to the store to get milk.", at: "¶ 1" }] }] } },
    act(3, "Sep 30", { type: "acceptgoal", goalId: "g-milk" }),
    act(4, "Sep 30", { type: "release", stateId: "s-home" }),
    act(5, "Sep 30", { type: "move", goalId: "g-milk", text: "Bobby is at the store. They have milk.", effect: "closer" }),
    act(6, "Sep 30", { type: "move", goalId: "g-milk", text: "The line is long.", effect: "same" }),
    act(7, "Oct 1", { type: "reach", goalId: "g-milk", text: "Bobby has milk." }),
    act(8, "Oct 1", { type: "release", stateId: "s-nomilk", note: "He brought some home." })
  ];
}

test("state layer: a goal is put forth, moves are tracked, and reaching it changes the state", () => {
  const S = replay(bobbySteps());
  const g = S.goals["g-milk"];
  assert.equal(g.status, "reached");
  assert.equal(g.proposed, true, "it was read in the text first");
  assert.equal(g.acceptedOn, "Sep 30");
  assert.equal(g.moves.length, 3);
  assert.equal(g.moves[0].read, true, "confirming the goal does not turn a move read in the text into the person's own report");
  assert.equal(g.moves[0].effect, "unsaid", "and no effect is invented for it");
  assert.deepEqual(movement(g), { moves: 3, closer: 1, same: 1, farther: 0, unsaid: 1, last: g.moves[2] });
  assert.equal(g.reachedOn, "Oct 1");
  const now = currentState(S);
  assert.deepEqual(now.map(s => s.text), ["Bobby has milk."], "the goal is now part of the state; the released facts are gone from now");
  assert.equal(now[0].from, "reached");
  assert.equal(now[0].goalId, "g-milk");
  assert.equal(S.state[g.stateId].text, "Bobby has milk.");
  const past = pastState(S);
  assert.deepEqual(past.map(s => [s.text, s.ended]), [["Bobby is at home.", "Sep 30"], ["There is no milk in the house.", "Oct 1"]]);
  assert.equal(past[1].endNote, "He brought some home.");
  assert.equal(S.question.text, "Did Bobby get the milk?");
});

test("state layer in time: rewinding shows the goal before it was reached", () => {
  const S = replay(bobbySteps().slice(0, 6));
  assert.equal(S.goals["g-milk"].status, "open");
  assert.deepEqual(currentState(S).map(s => s.text), ["There is no milk in the house."]);
  assert.match(stateListing(S), /state \| s-nomilk \| There is no milk/);
  assert.match(stateListing(S), /goal \| g-milk \| open \| Get milk \| 2 moves/);
  const S2 = replay(bobbySteps().slice(0, 3));
  assert.equal(S2.goals["g-milk"].status, "proposed");
  assert.equal(S2.goals["g-milk"].moves[0].read, true, "a move read in the text stays marked as the machine's until the goal is accepted");
});

test("state layer: stuck, dropped, rejected, and what is refused", () => {
  const steps = [
    act(0, "Sep 28", { type: "goal", goalId: "g-car", text: "Fix the car." }),
    act(1, "Sep 29", { type: "move", goalId: "g-car", text: "Called the mechanic. Booked for next month.", effect: "same" }),
    act(2, "Sep 29", { type: "regoal", goalId: "g-car", status: "stuck", note: "Nothing moves until next month." }),
    act(3, "Sep 30", { type: "move", goalId: "g-car", text: "Cancellation. Car goes in Friday.", effect: "closer" }),
    act(4, "Sep 30", { type: "goal", goalId: "g-car", text: "A duplicate id is ignored." }),
    act(5, "Sep 30", { type: "goal", goalId: "g-blank", text: "   " }),
    act(6, "Sep 30", { type: "move", goalId: "g-none", text: "no such goal", effect: "closer" }),
    { kind: "ingest", seq: 7, date: "Sep 30", source: "text", result: { add: {}, touch: [], replace: [], links: [], flags: [], question: "", goals: [{ id: "g-read", t: "Read more", words: "w", at: "¶ 1", moves: [] }] } },
    act(8, "Sep 30", { type: "rejectgoal", goalId: "g-read" }),
    act(9, "Sep 30", { type: "move", goalId: "g-read", text: "refused: dropped goals take no moves", effect: "closer" })
  ];
  const S = replay(steps);
  const car = S.goals["g-car"];
  assert.equal(car.status, "open", "a move on a stuck goal reopens it");
  assert.equal(car.text, "Fix the car.");
  assert.match(car.history[1], /ground is stuck\. Nothing moves until next month\./);
  assert.match(car.history[2], /moved again after being stuck/);
  assert.equal(S.goals["g-blank"], undefined);
  assert.equal(S.goals["g-none"], undefined);
  assert.equal(S.goals["g-read"].status, "dropped");
  assert.equal(S.goals["g-read"].moves.length, 0);
  const S2 = replay([...steps.slice(0, 1), act(1, "Sep 29", { type: "regoal", goalId: "g-car", status: "dropped" }), act(2, "Sep 29", { type: "reach", goalId: "g-car" })]);
  assert.equal(S2.goals["g-car"].status, "dropped", "a dropped goal cannot be reached");
  assert.deepEqual(currentState(S2), []);
});

test("help analysis: the latest one is in view, counts the steps since, changes nothing else, and rewinds", () => {
  const sug = (id, text) => ({ id, kind: "reached", text, why: "w", about: [{ on: "goal", id: "g-milk" }, { on: "", id: "x" }, null] });
  const steps = bobbySteps().slice(0, 7);
  const before = replay(steps);
  assert.equal(before.analysis, null);
  steps.push(act(7, "Sep 30", { type: "analysis", id: "h1", model: "m", standing: " Bobby is at the store. ", suggestions: [sug("h1-1", "Did Bobby get the milk?"), { kind: "move", text: "  " }, "junk"] }));
  const S = replay(steps);
  assert.deepEqual(S.analysis, { id: "h1", date: "Sep 30", model: "m", standing: "Bobby is at the store.", since: 0, leftOut: [],
    suggestions: [{ id: "h1-1", kind: "reached", text: "Did Bobby get the milk?", why: "w", about: [{ on: "goal", id: "g-milk" }] }] });
  assert.deepEqual(S.goals, before.goals, "an analysis changes no goal");
  assert.deepEqual(S.state, before.state, "and no fact");
  steps.push(act(8, "Oct 1", { type: "reach", goalId: "g-milk", text: "Bobby has milk." }));
  assert.equal(replay(steps).analysis.since, 1, "one step since it was made");
  steps.push(act(9, "Oct 1", { type: "analysis", id: "h2", standing: "", suggestions: [] }));
  const S2 = replay(steps);
  assert.equal(S2.analysis.id, "h2");
  assert.equal(S2.analysis.since, 0);
  assert.deepEqual(S2.analysis.suggestions, []);
  assert.equal(replay(steps.slice(0, 9)).analysis.id, "h1", "rewinding brings the earlier analysis back");
});

test("a verdict marks one suggestion of the analysis in view, changes nothing else, and does not make the analysis stale", () => {
  const sug = (id, text) => ({ id, kind: "question", text, why: "", about: [] });
  const steps = bobbySteps().slice(0, 7);
  steps.push(act(7, "Sep 30", { type: "analysis", id: "h1", model: "m", standing: "s", suggestions: [sug("h1-1", "One?"), sug("h1-2", "Two?")] }));
  const before = replay(steps);
  steps.push(act(8, "Oct 1", { type: "verdict", analysisId: "h1", suggestionId: "h1-2", mark: "knew" }));
  const S = replay(steps);
  assert.deepEqual(S.analysis.suggestions.map(x => x.verdict), [undefined, "knew"]);
  assert.equal(S.analysis.suggestions[1].verdictOn, "Oct 1");
  assert.equal(S.analysis.since, 0, "giving your word on a suggestion is not a change in the state of play");
  assert.deepEqual([S.goals, S.state, S.nodes], [before.goals, before.state, before.nodes]);
  steps.push(act(9, "Oct 2", { type: "verdict", analysisId: "h1", suggestionId: "h1-2", mark: "wrong" }));
  assert.equal(replay(steps).analysis.suggestions[1].verdict, "wrong", "the latest word stands");
  /* what is refused: an unknown mark, another analysis, a suggestion that is not there, an id that is not an id */
  for (const bad of [{ mark: "splendid" }, { analysisId: "h0" }, { suggestionId: "h1-9" }, { suggestionId: "__proto__" }]) {
    const S2 = replay(steps.slice(0, 8).concat([act(8, "Oct 1", { type: "verdict", analysisId: "h1", suggestionId: "h1-1", mark: "new", ...bad })]));
    assert.deepEqual(S2.analysis.suggestions.map(x => x.verdict), [undefined, undefined], JSON.stringify(bad));
  }
  assert.equal(actionOk({ type: "verdict", analysisId: "h1", suggestionId: "h1-1", mark: "new" }), true);
  assert.equal(actionOk({ type: "verdict", analysisId: "constructor", suggestionId: "h1-1", mark: "new" }), false);
  assert.equal(replay(steps.slice(0, 8)).analysis.suggestions[1].verdict, undefined, "rewinding takes the mark off again");
});

test("world maps: items are given or supposed, linked across maps, confirmed or ruled out, and nothing is deleted", () => {
  const steps = [
    act(0, "Sep 30", { type: "item", id: "w1", map: "said", text: "He needs milk." }),
    act(1, "Sep 30", { type: "item", id: "w2", map: "env", text: "There is no milk in the house." }),
    act(2, "Sep 30", { type: "item", id: "w3", map: "mind", text: "He wants milk.", supposed: false }),
    act(3, "Sep 30", { type: "item", id: "w4", map: "moral", text: "Those at home should not go without." }),
    act(4, "Sep 30", { type: "item", id: "w2", map: "env", text: "A duplicate id is ignored." }),
    act(5, "Sep 30", { type: "item", id: "w9", map: "nowhere", text: "An unknown map is ignored." }),
    act(6, "Sep 30", { type: "link", a: "w1", b: "w2", f: "read as a lack" }),
    act(7, "Sep 30", { type: "link", a: "w2", b: "w1", f: "the same pair again is ignored" }),
    act(8, "Sep 30", { type: "link", a: "w2", b: "w3", f: "gives rise to" }),
    act(9, "Sep 30", { type: "link", a: "w2", b: "ghost", f: "ignored" }),
    act(10, "Sep 30", { type: "ask", id: "w2", text: "Is the milk gone, or only low?" }),
    act(11, "Oct 1", { type: "confirm", id: "w2", note: "He looked." }),
    act(12, "Oct 1", { type: "confirm", id: "w3" }),
    act(13, "Oct 1", { type: "ruleout", id: "w4", note: "Bobby lives alone." }),
    act(14, "Oct 1", { type: "ruleout", id: "w1" })
  ];
  const S = replay(steps);
  assert.deepEqual(Object.keys(S.nodes), ["w1", "w2", "w3", "w4"]);
  assert.deepEqual(Object.values(S.nodes).map(mapOf), ["said", "env", "mind", "moral"]);
  assert.equal(S.nodes.w1.map, undefined, "what was said is an ordinary idea in the person's words");
  assert.equal(S.nodes.w1.src, "user_said");
  assert.equal(S.nodes.w1.ruledOut, undefined, "only a world item can be ruled out");
  assert.equal(S.nodes.w2.words, "There is no milk in the house.");
  assert.equal(S.nodes.w2.stuck, true, "the words put forth are fixed; whether they hold is the supposition");
  assert.equal(replay(steps.slice(0, 11)).nodes.w2.supposed, true, "supposed unless said to be given");
  assert.equal(S.nodes.w2.supposed, false);
  assert.equal(S.nodes.w2.confirmedOn, "Oct 1");
  assert.match(S.nodes.w2.history[0], /Oct 1: confirmed\. He looked\./);
  assert.equal(S.nodes.w3.supposed, false, "put forth as given");
  assert.equal(S.nodes.w3.confirmedOn, undefined, "confirming what is already given does nothing");
  assert.deepEqual(S.nodes.w2.slots, ["Is the milk gone, or only low?"]);
  assert.deepEqual(S.links, [{ a: "w1", b: "w2", f: "read as a lack", read: false }, { a: "w2", b: "w3", f: "gives rise to", read: false }]);
  assert.equal(S.nodes.w4.ruledOut, true);
  assert.equal(S.nodes.w4.replaced, true, "kept, drawn struck through");
  assert.match(S.nodes.w4.history[0], /ruled out\. Bobby lives alone\./);
  assert.equal(actOf(S, S.nodes.w2), "settled", "an item put forth by hand does not fade with passes");
  assert.equal(pickFocusIn(S, "env"), "w2");
  assert.equal(pickFocusIn(S, "moral"), null, "a map whose only item is ruled out has no middle");
  assert.equal(mapListing(S), "w1 | idea | He needs milk.", "the model's listing of the map holds what was said, not the world items");
});

test("hostile and malformed actions do nothing: reserved ids, unknown types, ids that are not ids", () => {
  const cleanProto = () => Object.keys(Object.prototype).length === 0 && ({}).stuck === undefined && ({}).ended === undefined && ({}).kept === undefined;
  const steps = sampleSteps();
  const before = JSON.stringify(replay(steps));
  for (const action of [
    { type: "keep", id: "__proto__" }, { type: "discard", id: "__proto__" }, { type: "anchor", id: "constructor" },
    { type: "release", stateId: "__proto__" }, { type: "state", stateId: "__proto__", text: "x" }, { type: "goal", goalId: "constructor", text: "x" },
    { type: "move", goalId: "__proto__", text: "x", effect: "closer" }, { type: "reach", goalId: "prototype" }, { type: "regoal", goalId: "__proto__", status: "dropped" },
    { type: "item", id: "__proto__", map: "env", text: "x" }, { type: "link", a: "__proto__", b: "x", f: "leads to" }, { type: "ask", id: "__proto__", text: "q" },
    { type: "confirm", id: "toString" }, { type: "ruleout", id: "__proto__" }, { type: "flag", flagId: "__proto__", choice: "accept" },
    { type: "explode" }, { type: "keep", id: { toString: () => "x" } }, { type: "keep", id: "has space" }, { type: "keep", id: "x".repeat(81) }, null, "keep", ["keep"]
  ]) {
    const S = replay([...steps, { kind: "action", seq: 2, date: "d", source: "attack", action }]);
    assert.equal(JSON.stringify(S), before, JSON.stringify(action));
    assert.ok(cleanProto(), "nothing was written to the object every other object inherits from: " + JSON.stringify(action));
  }
  /* a stored result with a reserved id is skipped too, and replay does not throw */
  const S = replay([{ kind: "ingest", seq: 0, date: "d", source: "x", result: { add: JSON.parse('{"__proto__": {"t": "x", "stuck": true}, "ok1": {"t": "Fine", "kind": "idea", "stuck": true, "words": "w"}}'), goals: [{ id: "__proto__", t: "x" }], flags: [{ id: "constructor", type: "gap", text: "x" }] } }]);
  assert.deepEqual(Object.keys(S.nodes), ["ok1"]);
  assert.deepEqual([Object.keys(S.goals), S.flags], [[], []]);
  assert.ok(cleanProto());
  assert.equal(Object.getPrototypeOf(S.nodes), null, "the state's maps have no prototype to reach");
  assert.deepEqual([safeId("w12"), safeId("t1abc-r2"), safeId("__proto__"), safeId(""), safeId(7), safeId("a b")], [true, true, false, false, false, false]);
  assert.deepEqual([actionOk({ type: "keep", id: "r1" }), actionOk({ type: "keep", id: "__proto__" }), actionOk({ type: "nope" }), actionOk({ type: "link", a: "x", b: "y y" })], [true, false, false, false]);
});

test("the person's own words cannot be kept, discarded or relabelled by any route: the reducer decides", () => {
  const steps = sampleSteps();
  const before = replay(steps);
  for (const type of ["keep", "discard"]) {
    const S = replay([...steps, { kind: "action", seq: 2, date: "d", source: "x", action: { type, id: "x" } }]);
    assert.deepEqual(S.nodes.x, before.nodes.x, type + " on the person's own words does nothing");
    assert.equal(S.links.length, before.links.length);
  }
  const anchored = replay([...steps, { kind: "action", seq: 2, date: "d", source: "x", action: { type: "anchor", id: "r1" } }]);
  assert.equal(anchored.nodes.r1.anchor, undefined, "a reading cannot be an anchor");
  const world = [{ kind: "action", seq: 0, date: "d", source: "x", action: { type: "item", id: "w1", map: "env", text: "A store is near." } }];
  for (const type of ["keep", "discard"]) assert.ok(replay([...world, { kind: "action", seq: 1, date: "d", source: "x", action: { type, id: "w1" } }]).nodes.w1 && !replay([...world, { kind: "action", seq: 1, date: "d", source: "x", action: { type, id: "w1" } }]).nodes.w1.kept, type + " does nothing to a world item");
});

test("“later” leaves a loose end open; a map of only ruled-out items still has a middle; the world's link words are one list", () => {
  const steps = sampleSteps();
  steps.push({ kind: "action", seq: 2, date: "Sep 22", source: "flag", action: { type: "flag", flagId: "f1", choice: "later" } });
  const S = replay(steps);
  assert.equal(S.outcomes.f1, undefined, "no outcome: it is still open");
  assert.equal(S.flags[0].later, "Sep 22");
  const w = [
    { kind: "action", seq: 0, date: "d", source: "x", action: { type: "item", id: "w1", map: "moral", text: "You pay." } },
    { kind: "action", seq: 1, date: "d", source: "x", action: { type: "ruleout", id: "w1" } }
  ];
  const R = replay(w);
  assert.equal(pickFocusIn(R, "moral"), null);
  assert.equal(mapMiddle(R, "moral"), "w1", "so the ruled-out item is drawn, struck through, instead of an empty map");
  assert.equal(mapMiddle(R, "env"), null);
  assert.ok(WORLD_LINKS.within.includes("rests on") && WORLD_LINKS.across.includes("gives rise to"));
  assert.equal(new Set(WORLD_LINKS.within).size, WORLD_LINKS.within.length);
});

test("cursor semantics: replaying a prefix gives the earlier map", () => {
  const S0 = replay([]);
  assert.equal(Object.keys(S0.nodes).length, 0);
  assert.equal(pickFocus(S0), null);
  const S1 = replay(sampleSteps().slice(0, 1));
  assert.deepEqual(Object.keys(S1.nodes), ["a"]);
});

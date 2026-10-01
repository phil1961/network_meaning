/* ─────────────────────────────────────────────
   File: tests/replay.test.js
   File Version: 0.2.0
   ───────────────────────────────────────────── */
import test from "node:test";
import assert from "node:assert/strict";
import { replay, actOf, traceToAnchor, pickFocus, neighbors, mapListing, currentState, pastState, movement, stateListing } from "../src/shared/replay.js";

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
  assert.equal(g.moves[0].read, false, "accepting the goal makes its read moves the person's own");
  assert.deepEqual(movement(g), { moves: 3, closer: 2, same: 1, farther: 0, last: g.moves[2] });
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

test("cursor semantics: replaying a prefix gives the earlier map", () => {
  const S0 = replay([]);
  assert.equal(Object.keys(S0.nodes).length, 0);
  assert.equal(pickFocus(S0), null);
  const S1 = replay(sampleSteps().slice(0, 1));
  assert.deepEqual(Object.keys(S1.nodes), ["a"]);
});

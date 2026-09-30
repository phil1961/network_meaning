/* ─────────────────────────────────────────────
   File: tests/replay.test.js
   File Version: 0.1.0
   ───────────────────────────────────────────── */
import test from "node:test";
import assert from "node:assert/strict";
import { replay, actOf, traceToAnchor, pickFocus, neighbors, mapListing } from "../src/shared/replay.js";

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

test("cursor semantics: replaying a prefix gives the earlier map", () => {
  const S0 = replay([]);
  assert.equal(Object.keys(S0.nodes).length, 0);
  assert.equal(pickFocus(S0), null);
  const S1 = replay(sampleSteps().slice(0, 1));
  assert.deepEqual(Object.keys(S1.nodes), ["a"]);
});

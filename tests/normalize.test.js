/* ─────────────────────────────────────────────
   File: tests/normalize.test.js
   File Version: 0.2.0
   ───────────────────────────────────────────── */
import test from "node:test";
import assert from "node:assert/strict";
import { normalize, LIMITS } from "../src/server/normalize.js";
import { ideaify, buildPrompt, OUTPUT_SCHEMA } from "../src/server/ideaify.js";
import { replay } from "../src/shared/replay.js";

const spans = ["The car starts every morning.", "After a while it becomes part of the furniture.", "Peter began to think and sank."];

test("an idea's words are assembled verbatim from its cited spans; uncited ideas are dropped and counted", () => {
  const { result, dropped } = normalize({
    ideas: [
      { key: "i1", title: "Faith becomes furniture", kind: "idea", spans: [1, 0], match: null, replaces: null, slots: ["When does it fail?"] },
      { key: "i2", title: "Invented", kind: "idea", spans: [], match: null, replaces: null, slots: [] },
      { key: "i3", title: "Out of range", kind: "idea", spans: [99], match: null, replaces: null, slots: [] }
    ], readings: [], links: [], flags: [], question: "Q"
  }, spans, "test.md", "s1", "Sep 29", {});
  assert.equal(dropped, 2);
  const [id, n] = Object.entries(result.add)[0];
  assert.equal(id, "s1-1");
  assert.equal(n.words, spans[0] + " " + spans[1], "spans are sorted and joined, the title is not used as words");
  assert.equal(n.at, "¶ 1–2");
  assert.equal(n.src, "user_said");
  assert.equal(n.stuck, true);
  assert.deepEqual(n.slots, ["When does it fail?"]);
  assert.equal(result.question, "Q");
});

test("match touches an existing node; readings need a basis; unknown kinds and labels fall back", () => {
  const nodes = replay([{ kind: "ingest", seq: 0, date: "Sep 1", source: "x", result: { add: { old1: { t: "Old", kind: "idea", stuck: true, src: "user_said", words: "w", slots: [], history: [] } }, touch: [], replace: [], links: [], flags: [], question: "" } }]).nodes;
  const { result } = normalize({
    ideas: [{ key: "i1", title: "Same as old", kind: "banana", spans: [2], match: "old1", replaces: null, slots: [] }, { key: "i2", title: "New", kind: "image", spans: [0], match: "nope", replaces: null, slots: [] }],
    readings: [{ key: "r1", title: "R", text: "reads", basis: ["i2"] }, { key: "r2", title: "No basis", text: "x", basis: ["ghost"] }],
    links: [{ from: "i2", to: "old1", label: "not a label" }, { from: "i2", to: "r1", label: "explains" }, { from: "i2", to: "i2", label: "refines" }],
    flags: [], question: ""
  }, spans, "t", "s2", "Sep 29", nodes);
  assert.equal(result.touch.length, 1);
  assert.equal(result.touch[0].id, "old1");
  assert.equal(Object.keys(result.add).length, 2);
  assert.equal(result.add["s2-1"].kind, "image");
  assert.equal(result.add["s2-r1"].stuck, false);
  const toOld = result.links.find(l => l.b === "old1");
  assert.equal(toOld.f, "connects to");
  assert.ok(result.links.find(l => l.b === "s2-r1" && l.read === true));
  assert.ok(!result.links.some(l => l.a === l.b));
});

test("replaces keeps both versions, links them, and marks the old one", () => {
  const { result } = normalize({
    ideas: [{ key: "i1", title: "Creation", kind: "idea", spans: [0], match: null, replaces: null, slots: [] }, { key: "i2", title: "Realization", kind: "idea", spans: [1], match: null, replaces: "i1", slots: [] }],
    readings: [], links: [], flags: [], question: ""
  }, spans, "t", "s3", "Sep 29", {});
  assert.equal(result.add["s3-1"].replaced, true);
  assert.match(result.add["s3-2"].history[0], /replaced “Creation”/);
  assert.ok(result.links.some(l => l.f === "replaces" && l.a === "s3-2" && l.b === "s3-1"));
});

test("traces to is only allowed toward an anchor; limits are enforced", () => {
  const nodes = { anc: { t: "A", kind: "quote", stuck: true, anchor: true, words: "w", slots: [], history: [], touches: [0] }, plain: { t: "P", kind: "idea", stuck: true, words: "w", slots: [], history: [], touches: [0] } };
  const many = Array.from({ length: 40 }, (_, i) => ({ key: "i" + i, title: "t" + i, kind: "idea", spans: [0], match: null, replaces: null, slots: ["a", "b", "c"] }));
  const { result } = normalize({
    ideas: many, readings: Array.from({ length: 6 }, (_, i) => ({ key: "r" + i, title: "r", text: "t", basis: ["i0"] })),
    links: [{ from: "i0", to: "anc", label: "traces to" }, { from: "i1", to: "plain", label: "traces to" }],
    flags: Array.from({ length: 20 }, () => ({ type: "gap", text: "g", detail: "", nodes: ["i0"], phrase: "", suggestion: "", question: "" })), question: ""
  }, spans, "t", "s4", "Sep 29", nodes);
  const adds = Object.values(result.add);
  assert.equal(adds.filter(n => n.stuck).length, LIMITS.ideas);
  assert.equal(adds.filter(n => !n.stuck).length, LIMITS.readings);
  assert.equal(result.flags.length, LIMITS.flags);
  assert.equal(adds[0].slots.length, LIMITS.slotsPerIdea);
  assert.equal(result.links.find(l => l.b === "anc").f, "traces to");
  assert.equal(result.links.find(l => l.b === "plain").f, "connects to");
});

test("garbage in produces an empty result, never a throw", () => {
  for (const raw of [null, "x", 42, [], { ideas: "no" }, { ideas: [null, 1, { spans: "z" }] }]) {
    const { result } = normalize(raw, spans, "t", "s5", "Sep 29", {});
    assert.deepEqual(Object.keys(result.add), []);
  }
});

test("ideaify runs the prompt through an injected model and returns a step result with usage", async () => {
  const seen = {};
  const callModel = async ({ model, prompt }) => {
    seen.model = model; seen.prompt = prompt;
    return { raw: { ideas: [{ key: "i1", title: "Furniture", kind: "idea", spans: [1], match: null, replaces: null, slots: [] }], readings: [], links: [], flags: [], question: "So?" }, inputTokens: 10, outputTokens: 5 };
  };
  const out = await ideaify({ text: spans.join(" "), source: "unit", tier: "quick", state: replay([]), stepId: "s6", date: "Sep 29", callModel });
  assert.equal(seen.model, "claude-haiku-4-5");
  assert.match(seen.prompt, /\[1\] After a while/);
  assert.match(seen.prompt, /\(empty: this is the first text\)/);
  assert.equal(out.result.add["s6-1"].words, spans[1]);
  assert.equal(out.usage.spans, 3);
  assert.equal(out.usage.input_tokens, 10);
  await assert.rejects(() => ideaify({ text: "   ", source: "unit", state: replay([]), stepId: "s7", date: "Sep 29", callModel }), e => e.code === "empty_input");
});

test("the output schema is strict on structure and names every field the prompt promises", () => {
  assert.equal(OUTPUT_SCHEMA.additionalProperties, false);
  assert.deepEqual(OUTPUT_SCHEMA.required, ["ideas", "readings", "links", "flags", "goals", "question"]);
  const prompt = buildPrompt(["a."], "src", "(empty)");
  for (const word of ["spans", "match", "replaces", "readings", "basis", "slots", "links", "flags", "goals", "moves", "existing", "question"]) assert.match(prompt, new RegExp(`"${word}"`));
  assert.match(prompt, /no state facts or goals yet/);
});

const bobby = ["Bobby went to the store to get milk.", "He also wants to fix the car someday.", "The store was out of eggs."];

test("goals and moves are assembled verbatim from cited spans; uncited ones are dropped and counted", () => {
  const { result, dropped } = normalize({
    ideas: [{ key: "i1", title: "Bobby went for milk", kind: "idea", spans: [0], match: null, replaces: null, slots: [] }], readings: [], links: [], flags: [],
    goals: [
      { key: "g1", title: "Get milk", spans: [0], existing: null, moves: [{ text: "went to the store", spans: [0] }, { text: "invented move", spans: [] }] },
      { key: "g2", title: "Fix the car", spans: [1], existing: null, moves: [] },
      { key: "g3", title: "Invented goal", spans: [], existing: null, moves: [] }
    ], question: "Did Bobby get the milk?"
  }, bobby, "story", "s8", "Sep 30", {}, {});
  assert.equal(dropped, 2, "one uncited move and one uncited goal");
  assert.equal(result.goals.length, 2);
  assert.equal(result.goals[0].id, "s8-g1");
  assert.equal(result.goals[0].t, "Get milk");
  assert.equal(result.goals[0].words, bobby[0], "the goal's words are the span, not the title");
  assert.equal(result.goals[0].at, "¶ 1");
  assert.deepEqual(result.goals[0].moves.map(m => m.text), [bobby[0]], "a move's text is its cited span");
  assert.equal(result.goals[1].moves.length, 0, "a wish with no action is a goal with no moves");
});

test("a goal naming an existing open goal contributes moves to it instead of starting a new one", () => {
  const goals = { "g-milk": { text: "Get milk", status: "open", moves: [] }, "g-done": { text: "Done", status: "reached", moves: [] } };
  const { result } = normalize({
    ideas: [], readings: [], links: [], flags: [],
    goals: [
      { key: "g1", title: "Get milk", spans: [0], existing: "g-milk", moves: [{ text: "went to the store", spans: [0] }] },
      { key: "g2", title: "Eggs", spans: [2], existing: "g-done", moves: [] },
      { key: "g3", title: "Nothing new", spans: [1], existing: "g-milk", moves: [] }
    ], question: ""
  }, bobby, "story", "s9", "Sep 30", {}, goals);
  assert.equal(result.goals.length, 2);
  assert.deepEqual(result.goals[0], { id: "g-milk", existing: true, moves: [{ text: bobby[0], at: "¶ 1" }] });
  assert.equal(result.goals[1].id, "s9-g1", "a reached goal cannot take moves, so this becomes a new proposal");
  const S = replay([{ kind: "ingest", seq: 0, date: "Sep 30", source: "story", result }]);
  assert.equal(S.goals["s9-g1"].status, "proposed");
  assert.equal(S.goals["g-milk"], undefined, "moves for a goal the stream does not have are ignored");
});

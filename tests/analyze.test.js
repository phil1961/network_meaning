/* ─────────────────────────────────────────────
   File: tests/analyze.test.js
   File Version: 0.2.0
   ─────────────────────────────────────────────
   Help analysis: the listing the model sees, the brake on its answer, and
   the step it becomes. No network: the model is injected. */
import test from "node:test";
import assert from "node:assert/strict";
import { analyze, normalizeAnalysis, buildHelpPrompt, playListing, HELP_SCHEMA, HELP_LIMITS, SUGGESTION_KINDS } from "../src/server/analyze.js";
import { replay } from "../src/shared/replay.js";

const act = (seq, date, action) => ({ kind: "action", seq, date, source: "state", action });
function play() {
  return replay([
    act(0, "Sep 28", { type: "state", stateId: "s-home", text: "Bobby is at home." }),
    act(1, "Sep 28", { type: "state", stateId: "s-nomilk", text: "There is no milk in the house." }),
    act(2, "Sep 28", { type: "goal", goalId: "g-car", text: "Fix the car." }),
    act(3, "Sep 29", { type: "regoal", goalId: "g-car", status: "stuck", note: "Nothing moves until next month." }),
    { kind: "ingest", seq: 4, date: "Sep 30", source: "the story", result: {
      add: { bobby1: { t: "Bobby went to the store to get milk", kind: "idea", stuck: true, src: "user_said", words: "Bobby went to the store to get milk.", slots: ["Which store?"], history: [] } },
      touch: [], replace: [], links: [], question: "Did Bobby get the milk?",
      flags: [{ id: "b-open", type: "unanswered", text: "Did Bobby get the milk?", detail: "", nodes: ["bobby1"], phrase: "", suggestion: "", question: "" },
        { id: "b-done", type: "gap", text: "Already settled", detail: "", nodes: [], phrase: "", suggestion: "", question: "" }],
      goals: [{ id: "g-milk", t: "Get milk", words: "Bobby went to the store to get milk.", at: "¶ 1", ideaId: "bobby1", moves: [{ text: "Bobby went to the store to get milk.", at: "¶ 1" }] }] } },
    act(5, "Sep 30", { type: "acceptgoal", goalId: "g-milk" }),
    act(6, "Sep 30", { type: "release", stateId: "s-home", note: "He left for the store." }),
    act(7, "Sep 30", { type: "flag", flagId: "b-done", choice: "drop" }),
    act(8, "Sep 30", { type: "goal", goalId: "g-eggs", text: "Get eggs." }),
    act(9, "Sep 30", { type: "regoal", goalId: "g-eggs", status: "dropped" })
  ]);
}

test("the listing gives typed ids to what can be pointed at, and none to the past or to dropped goals", () => {
  const p = playListing(play());
  assert.match(p.now, /^state:s-nomilk \| since Sep 28 \| There is no milk in the house\.$/);
  assert.match(p.past, /Sep 28 to Sep 30 \| Bobby is at home\. \| He left for the store\./);
  assert.doesNotMatch(p.past, /s-home/);
  assert.match(p.goals, /goal:g-car \| ground is stuck \| put forth Sep 28 \| Fix the car\./);
  assert.match(p.goals, /note \| Sep 29: the ground is stuck\. Nothing moves until next month\./);
  assert.match(p.goals, /goal:g-milk \| open \| put forth Sep 30 \| Get milk\n {4}move \| Sep 30 \| effect not said \| Bobby went to the store to get milk\. \(read in the text, not confirmed\)/, "a move read in the text is shown with no effect, and stays marked after the goal is confirmed");
  assert.equal(p.dropped, "Get eggs.");
  assert.doesNotMatch(p.goals, /g-eggs/);
  assert.equal(p.flags, "flag:b-open | unanswered | Did Bobby get the milk?", "a resolved loose end is not listed");
  assert.match(p.ideas, /idea:bobby1 \| idea \| Bobby went to the store to get milk \| open: Which store\?/);
  assert.equal(p.question, "Did Bobby get the milk?");
});

test("a suggestion that points at nothing, or whose kind does not fit what it points at, is dropped and counted", () => {
  const st = play();
  const { result, dropped } = normalizeAnalysis({
    standing: "Bobby is out for milk. The car waits on the mechanic.",
    suggestions: [
      { kind: "reached", text: "Did Bobby come home with the milk?", why: "One move, and no word on how it ended.", about: ["goal:g-milk", "flag:b-open", "goal:g-milk"] },
      { kind: "move", text: "Invented.", why: "", about: [] },
      { kind: "move", text: "Points at a ghost.", why: "", about: ["goal:g-ghost", "constructor"] },
      { kind: "stuck", text: "Is the car stuck?", why: "It is already marked stuck.", about: ["goal:g-car"] },
      { kind: "move", text: "Ask the mechanic about a cancellation.", why: "The only note is the wait.", about: ["g-car"] },
      { kind: "move", text: "Buy eggs too.", why: "", about: ["goal:g-eggs"] },
      { kind: "loose", text: "That gap is settled.", why: "", about: ["flag:b-done"] },
      { kind: "loose", text: "The unanswered question is the goal itself.", why: "", about: ["flag:b-open"] },
      { kind: "fact", text: "Is there still no milk in the house?", why: "The goal is to get some.", about: ["state:s-nomilk"] },
      { kind: "question", text: "Which store did Bobby go to?", why: "Open on the map.", about: ["idea:bobby1"] },
      { kind: "banana", text: "Unknown kind.", why: "", about: ["goal:g-milk"] },
      { kind: "question", text: "   ", why: "", about: ["goal:g-milk"] }
    ]
  }, st, "h1");
  assert.equal(dropped, 7);
  assert.deepEqual(result.suggestions.map(s => s.kind), ["reached", "move", "loose", "fact", "question"]);
  assert.deepEqual(result.suggestions[0], { id: "h1-1", kind: "reached", text: "Did Bobby come home with the milk?", why: "One move, and no word on how it ended.", about: [{ on: "goal", id: "g-milk" }, { on: "flag", id: "b-open" }] });
  assert.deepEqual(result.suggestions[1].about, [{ on: "goal", id: "g-car" }], "a bare id resolves; a move may name a stuck goal");
  assert.equal(result.standing, "Bobby is out for milk. The car waits on the mechanic.");
});

test("limits are enforced and garbage in is an empty analysis, never a throw", () => {
  const st = play();
  const many = Array.from({ length: 12 }, (_, i) => ({ kind: "question", text: "q" + i, why: "", about: ["goal:g-milk", "state:s-nomilk", "flag:b-open", "idea:bobby1", "goal:g-car"] }));
  const { result } = normalizeAnalysis({ standing: "x".repeat(900), suggestions: many }, st, "h2");
  assert.equal(result.suggestions.length, HELP_LIMITS.suggestions);
  assert.equal(result.suggestions[0].about.length, HELP_LIMITS.about);
  assert.equal(result.standing.length, 400);
  for (const raw of [null, "x", 42, [], { suggestions: "no" }, { suggestions: [null, 1, { about: "z" }] }]) {
    assert.deepEqual(normalizeAnalysis(raw, st, "h3").result.suggestions, []);
  }
});

test("the schema is strict and the prompt names every field, kind and section it promises", () => {
  assert.equal(HELP_SCHEMA.additionalProperties, false);
  assert.deepEqual(HELP_SCHEMA.required, ["standing", "suggestions"]);
  assert.deepEqual(HELP_SCHEMA.properties.suggestions.items.properties.kind.enum, SUGGESTION_KINDS);
  const prompt = buildHelpPrompt(play(), "Sep 30");
  for (const word of ["about", "kind", "text", "why", "standing"]) assert.match(prompt, new RegExp(`"${word}"`));
  for (const k of SUGGESTION_KINDS) assert.match(prompt, new RegExp(`\\n   ${k}: `));
  assert.match(prompt, /TODAY: Sep 30/);
  assert.match(prompt, /state:s-nomilk/);
  assert.match(prompt, /goal:g-milk/);
});

test("analyze runs an injected model, passes its own schema, and its result replays as the latest analysis", async () => {
  const seen = {};
  const callModel = async ({ model, prompt, schema }) => {
    seen.model = model; seen.schema = schema; seen.prompt = prompt;
    return { raw: { standing: "Bobby is out for milk.", suggestions: [{ kind: "reached", text: "Did he get it?", why: "No word yet.", about: ["goal:g-milk"] }, { kind: "move", text: "Invented.", why: "", about: [] }] }, inputTokens: 20, outputTokens: 8 };
  };
  const out = await analyze({ state: play(), tier: "quick", stepId: "h9", date: "Sep 30", callModel });
  assert.equal(seen.model, "claude-haiku-4-5");
  assert.equal(seen.schema, HELP_SCHEMA);
  assert.equal(out.dropped, 1);
  assert.equal(out.usage.input_tokens, 20);
  assert.equal(out.result.suggestions.length, 1);
  await assert.rejects(() => analyze({ state: replay([]), stepId: "h0", date: "Sep 30", callModel }), e => e.code === "empty_input");
  await assert.rejects(() => analyze({ state: play(), stepId: "h0", date: "Sep 30", callModel: async () => { throw { code: "refused", message: "Claude declined this text. Try a different excerpt." }; } }),
    e => e.code === "refused" && /declined to analyze/.test(e.message));
});

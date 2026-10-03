/* ─────────────────────────────────────────────
   File: tests/scenes.test.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   Bobby's arc (src/shared/scenes.js): the shape of the model, that every
   option is authored with its loadings and signals, the tallies, the
   picture in plain words with its quiet threshold, the coverage the
   admin view shows, and the promises about never grading anyone. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { TRAITS, ASPECTS, PICTURE, ARC, sceneById, optionById, aspectById, arcAnswers, nextScene, tally, describe, itemRows, coverage } from "../src/shared/scenes.js";
import { STATES, stateById } from "../src/shared/states.js";
import { replay } from "../src/shared/replay.js";

const act = (date, action) => ({ kind: "action", date, source: "answer", action });
const answer = (scene, option, date = "Oct 3") => act(date, { type: "answer", arc: ARC.id, scene, option });
const BRIDGE = 5;

test("the model is the spec's: ten aspects, two under each trait, each with an honourable line for both ends", () => {
  assert.equal(TRAITS.length, 5);
  assert.equal(ASPECTS.length, 10);
  for (const t of TRAITS) assert.equal(ASPECTS.filter(a => a.trait === t.id).length, 2, t.name);
  for (const a of ASPECTS) {
    assert.ok(a.low.length >= 40 && a.high.length >= 40 && a.low !== a.high, a.id);
    assert.doesNotMatch(a.low + " " + a.high, /\b(unimaginative|lazy|rude|cold|weak|neurotic|unstable|disorganised|disorganized|boring|selfish|aggressive|anxious wreck)\b/i, `${a.id} regards both ends honourably`);
    assert.match(a.low + " " + a.high, /\b(lean|tend|something in you)\b/, `${a.id} uses a mild qualifier`);
  }
  assert.ok(aspectById("compassion") && aspectById("nope") === null);
});

test("Bobby's arc: five scenes in order, three options each, every option authored with loadings, a note and what happens next", () => {
  assert.equal(ARC.scenes.length, BRIDGE);
  assert.deepEqual(ARC.scenes.map(s => s.order), [1, 2, 3, 4, 5]);
  const ids = new Set();
  for (const s of ARC.scenes) {
    assert.ok(s.title && s.text.length >= 60 && s.prompt, s.id);
    assert.equal(s.options.length, 3, s.id);
    for (const o of s.options) {
      assert.ok(!ids.has(o.id), "no option id twice"); ids.add(o.id);
      assert.ok(Object.keys(o.aspects).length >= 1, `${o.id} loads at least one aspect`);
      for (const [k, w] of Object.entries(o.aspects)) { assert.ok(aspectById(k), `${o.id}: ${k} is an aspect`); assert.ok(Number.isInteger(w) && w !== 0 && Math.abs(w) <= 3, `${o.id}: ${k} has a small signed integer weight`); }
      for (const [k, w] of Object.entries(o.states)) { assert.ok(stateById(k), `${o.id}: ${k} is a state`); assert.ok(Number.isInteger(w) && w !== 0 && Math.abs(w) <= 2, `${o.id}: ${k} has a small signed integer weight`); }
      assert.ok(o.note.length >= 20, `${o.id} says why`);
      assert.ok(o.then.length >= 20 && /[.!?]$/.test(o.then), `${o.id} says what happens next`);
    }
  }
  assert.ok(sceneById("s3") && optionById("s3b").scene.id === "s3" && optionById("nope") === null);
  assert.equal(itemRows().length, 15);
});

test("answers are read from the stream: the latest for each scene, in scene order, unknown ones ignored", () => {
  const S = replay([answer("s2", "s2a"), answer("s1", "s1c"), answer("s2", "s2b"), answer("s9", "s9a"), answer("s3", "nope"), act("Oct 3", { type: "answer", arc: "other", scene: "s1", option: "s1a" })]);
  assert.deepEqual(arcAnswers(S.answers), [{ scene: "s1", option: "s1c" }, { scene: "s2", option: "s2b" }]);
  assert.equal(nextScene(S.answers).id, "s3");
  assert.equal(nextScene(replay(ARC.scenes.map(s => answer(s.id, s.options[0].id))).answers), null, "all five answered: no next scene");
  assert.equal(nextScene([]).id, "s1");
  /* an answer is a step like any other, and it does not make a Help analysis stale */
  const withHelp = replay([act("Oct 1", { type: "analysis", id: "h1", model: "m", standing: "s", suggestions: [] }), answer("s1", "s1a")]);
  assert.equal(withHelp.analysis.since, 0);
  assert.deepEqual(replay([act("Oct 3", { type: "answer", arc: "bobby", scene: "s1" })]).answers, [], "an answer with a part missing does nothing");
});

test("the tallies add what was authored and nothing else, and roll up to the traits", () => {
  const S = replay([answer("s1", "s1a"), answer("s2", "s2a")]);
  const t = tally(S.answers);
  assert.equal(t.answered, 2);
  assert.equal(t.aspects.compassion, 2); assert.equal(t.aspects.enthusiasm, 2); assert.equal(t.aspects.assertiveness, 2);
  assert.equal(t.aspects.industriousness, -1); assert.equal(t.aspects.orderliness, -1); assert.equal(t.aspects.volatility, 0);
  assert.equal(t.traits.E, 4, "enthusiasm and assertiveness together");
  assert.equal(t.traits.C, -2);
  assert.deepEqual(t.states.map(s => s.id), ["loneliness", "love", "decision"], "states ranked by weight, ties in the order first signalled, and only positive weights");
  assert.deepEqual(tally([]).states, []);
  /* a negative signal can cancel a positive one, and then the state is not ranked */
  const S2 = replay([answer("s3", "s3c"), answer("s4", "s4a")]);
  assert.ok(!tally(S2.answers).states.some(s => s.id === "inertia"), "inertia +1 and -1 cancel");
});

test("the picture: only a lean past the quiet threshold is described, the strongest first, never more than the cap, never a number", () => {
  assert.deepEqual(describe(tally([])), [], "nothing answered, nothing said");
  const S = replay([answer("s1", "s1a"), answer("s2", "s2a"), answer("s3", "s3b"), answer("s4", "s4a"), answer("s5", "s5a")]);
  const t = tally(S.answers), lines = describe(t);
  assert.ok(lines.length >= 1 && lines.length <= PICTURE.most);
  for (const l of lines) assert.ok(Math.abs(t.aspects[l.aspect]) >= PICTURE.quiet, `${l.aspect} is past the threshold`);
  for (let i = 1; i < lines.length; i++) assert.ok(Math.abs(t.aspects[lines[i - 1].aspect]) >= Math.abs(t.aspects[lines[i].aspect]), "strongest first");
  assert.equal(lines[0].aspect, "assertiveness"); assert.equal(lines[0].end, "high"); assert.equal(lines[0].says, aspectById("assertiveness").high);
  assert.ok(lines.every(l => !/\d/.test(l.says)), "no number in what the person is told");
  assert.ok(!describe(t).some(l => Math.abs(t.aspects[l.aspect]) < PICTURE.quiet));
  /* the threshold is a setting, and a stricter one says less */
  assert.ok(describe(t, { quiet: 99, most: 4 }).length === 0);
  assert.equal(PICTURE.tuned, false, "the threshold is marked untuned until it is tuned");
});

test("coverage: what the arc reaches, and which states no option reaches", () => {
  const c = coverage(STATES.map(s => s.id));
  assert.equal(c.aspects.length, 10);
  for (const a of c.aspects) { assert.ok(a.items >= 1, `${a.aspect} is loaded by at least one option`); assert.equal(a.net, a.pos + a.neg); }
  assert.equal(c.states.length, 25);
  assert.ok(c.unreached.length > 0 && c.unreached.length < 25, "a first arc reaches some states and not others, and says which");
  assert.ok(c.unreached.includes("mortality") && !c.unreached.includes("loneliness"));
  assert.ok(c.states.find(s => s.state === "loneliness").routes >= 3);
});

test("nothing the person is shown grades them, and the help says what is kept and what is not", () => {
  const graded = /\b(scores?|points?|levels?|streaks?|badges?|grades?|failed|failure|ranks?|leaderboards?|wrong answer|correct answer|personality test|profile)\b/i;
  for (const s of ARC.scenes) { assert.doesNotMatch(s.text + " " + s.prompt, graded, s.id); for (const o of s.options) assert.doesNotMatch(o.text + " " + o.then, graded, o.id); }
  assert.doesNotMatch(ARC.lead, graded);
  for (const a of ASPECTS) assert.doesNotMatch(a.low + " " + a.high, graded, a.id);
  const page = fs.readFileSync(new URL("../src/client/92-start.js", import.meta.url), "utf8");
  assert.match(page, /builds a picture of how you see things/, "the person is told from the start that a picture is being formed");
  assert.match(page, /You will be able to see it too/, "and that it is not kept from them for good");
  const help = fs.readFileSync(new URL("../HELP-Start.md", import.meta.url), "utf8");
  assert.match(help, /never see a number|never shows you a number/i);
  assert.match(help, /authored hypotheses|first guesses/i);
});

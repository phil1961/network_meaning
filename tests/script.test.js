/* ─────────────────────────────────────────────
   File: tests/script.test.js
   File Version: 0.3.0
   ─────────────────────────────────────────────
   The scripting language: reading a script, pointing at things, and what
   each line asks the app to do. The built-in scripts are run here against
   the real reducer, with no server and no model. */
import test from "node:test";
import assert from "node:assert/strict";
import { parseScript, planStep, findRef, scriptToSteps, SCRIPT_VERBS, SCRIPT_HELP, SCRIPT_EXAMPLES } from "../src/shared/script.js";
import fs from "node:fs";
import { replay, currentState, pastState, mapOf, pickFocusIn, WORLD_MAPS, WORLD_LINKS } from "../src/shared/replay.js";

/* Run a script the way the stepper does, minus the server: every action
   plan becomes a step, and the next line sees the replayed state. */
function run(text, seed = []) {
  const p = parseScript(text);
  assert.deepEqual(p.errors, []);
  const steps = seed.slice(); const names = {}; let date = "today", n = 0, cursor = null;
  const log = [];
  for (const s of p.steps) {
    const plan = planStep(s, replay(steps), names, pre => pre + (++n));
    if (plan.error) return { error: plan.error, line: s.line, steps, log };
    log.push(plan.do);
    if (plan.do === "date") date = plan.date;
    if (plan.do === "rewind") cursor = plan.to;
    if (plan.do === "latest") cursor = null;
    if (plan.do === "action") { steps.push({ kind: "action", seq: steps.length, date, source: "script", action: plan.action }); if (plan.bind) names[plan.bind.name] = { on: plan.bind.on, id: plan.bind.id }; }
  }
  return { S: replay(steps), steps, names, log, cursor };
}

test("a script is read line by line; comments and blank lines are skipped", () => {
  const p = parseScript(`# a comment\n\nstream: Bobby, scripted\r\ndate: Sep 28\nfact home: Bobby is at home.\nfact: It is 10:30 now.\nmove home farther: He left: by car.\nmove "the milk": closer, perhaps\nrewind 7\nlatest\nhelp\nshow state\nresolve “Did Bobby” drop\ntext "Bobby, the story": Bobby went: to the store.`);
  assert.deepEqual(p.errors, []);
  assert.deepEqual(p.steps.map(s => s.verb), ["stream", "date", "fact", "fact", "move", "move", "rewind", "latest", "help", "show", "resolve", "text"]);
  assert.deepEqual(p.steps.map(s => s.line), [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  assert.equal(p.steps[0].text, "Bobby, scripted");
  assert.equal(p.steps[2].name, "home");
  assert.equal(p.steps[3].name, undefined);
  assert.equal(p.steps[3].text, "It is 10:30 now.", "only the first colon splits the line");
  assert.deepEqual([p.steps[4].ref, p.steps[4].word, p.steps[4].text], [{ q: false, v: "home" }, "farther", "He left: by car."]);
  assert.deepEqual([p.steps[5].ref, p.steps[5].word], [{ q: true, v: "the milk" }, "closer"], "closer when the effect is left out");
  assert.equal(p.steps[6].num, 7);
  assert.equal(p.steps[9].word, "state");
  assert.deepEqual([p.steps[10].ref, p.steps[10].word], [{ q: true, v: "Did Bobby" }, "drop"], "curly quotes from dictation work");
  assert.deepEqual([p.steps[11].source, p.steps[11].text], ["Bobby, the story", "Bobby went: to the store."], "a colon inside quotes does not split the line");
});

test("a text block runs to the closing quotes and counts as one line to run", () => {
  const p = parseScript(`text "car ride":\n  """\nFirst line.\n\n# not a comment here\nSecond line.\n"""\nhelp`);
  assert.deepEqual(p.errors, []);
  assert.equal(p.steps.length, 2);
  assert.equal(p.steps[0].text, "First line.\n\n# not a comment here\nSecond line.");
  assert.match(p.steps[0].raw, /\(4 lines\)$/);
  assert.equal(p.steps[1].line, 8);
  assert.equal(parseScript(`text: """\nSame line opener.\n"""`).steps[0].text, "Same line opener.");
  assert.match(parseScript(`text: """\nnever closed`).errors[0].message, /never closed/);
});

test("lines that can't be read are reported with their line number, in plain words, and are not run", () => {
  const p = parseScript(["dance: all night", "fact", "fact two words: x", "fact home: a", "goal home: b", "move: text", "move milk sideways: x", "rewind soon", "help: please", "show kitchen", "release \"unclosed: x", "reach a b: x", "resolve \"x\""].join("\n"));
  assert.deepEqual(p.steps.map(s => s.verb), ["fact"], "only the one good line survives");
  const at = n => p.errors.find(e => e.line === n).message;
  assert.match(at(1), /“dance” is not a word a script can use/);
  assert.match(at(2), /needs its words after a colon/);
  assert.match(at(3), /Didn't expect “words” here/);
  assert.match(at(5), /already used on line 4/);
  assert.match(at(6), /needs to say which goal/);
  assert.match(at(7), /doesn't know “sideways”.*closer, same, farther/);
  assert.match(at(8), /needs a step number/);
  assert.match(at(9), /takes nothing after a colon/);
  assert.match(at(10), /doesn't know “kitchen”/);
  assert.match(at(11), /quote is opened and never closed/);
  assert.match(at(12), /Didn't expect “b” here/);
  assert.match(at(13), /needs one more word/);
  assert.equal(p.errors.length, 12);
});

test("every verb has a line in the reference, and the reference names no verb the parser lacks", () => {
  const text = SCRIPT_HELP.map(r => r[0]).join("\n");
  for (const v of Object.keys(SCRIPT_VERBS)) assert.match(text, new RegExp(`(^|\\s)${v}(\\s|:|$)`, "m"), v);
});

test("the built-in script by hand runs clean and ends where the Bobby sample ends", () => {
  const r = run(SCRIPT_EXAMPLES.hand.text);
  assert.equal(r.error, undefined);
  assert.equal(r.steps.length, 13, "13 actions; stream, date, note, rewind and latest add no step");
  assert.deepEqual(r.steps.map(s => s.date), ["Sep 28", "Sep 28", "Sep 28", "Sep 28", "Sep 29", "Sep 29", "Sep 30", "Sep 30", "Sep 30", "Sep 30", "Oct 1", "Oct 1", "Oct 1"]);
  assert.ok(r.steps.every(s => s.source === "script"));
  assert.deepEqual(currentState(r.S).map(s => s.text), ["The car makes a grinding noise when it starts.", "Bobby has milk.", "Bobby is home again."]);
  assert.deepEqual(pastState(r.S).map(s => [s.text, s.ended, s.endNote]), [["Bobby is at home.", "Sep 30", "He left for the store."], ["There is no milk in the house.", "Oct 1", "He brought some home."]]);
  const milk = r.S.goals[r.names.milk.id], car = r.S.goals[r.names.car.id];
  assert.equal(milk.status, "reached");
  assert.deepEqual(milk.moves.map(m => m.effect), ["closer", "same"]);
  assert.equal(r.S.state[milk.stateId].text, "Bobby has milk.");
  assert.equal(car.status, "stuck");
  assert.equal(r.cursor, null, "it rewinds to look, then comes back to latest");
  const at10 = replay(r.steps.slice(0, 10));
  assert.equal(at10.goals[r.names.milk.id].status, "open", "rewind 10 shows the goal before it was reached");
});

test("the built-in script with the model parses, and its lines after the text find the goal the model read", () => {
  const p = parseScript(SCRIPT_EXAMPLES.model.text);
  assert.deepEqual(p.errors, []);
  assert.deepEqual(p.steps.filter(s => s.verb === "text" || s.verb === "help").length, 3);
  /* stand in for the model: the ingest step it would have produced */
  const read = { kind: "ingest", seq: 0, date: "Sep 30", source: "Bobby, the story", result: { add: {}, touch: [], replace: [], links: [], flags: [], question: "",
    goals: [{ id: "t1-g1", t: "Get milk", words: "Bobby went to the store to get milk.", at: "¶ 1", ideaId: null, moves: [{ text: "Bobby went to the store to get milk.", at: "¶ 1" }] }] } };
  const r = run(`accept "milk"\nmove "milk" closer: Bobby is at the store.\nreach "milk": Bobby has milk.`, [read]);
  assert.equal(r.error, undefined);
  assert.equal(r.S.goals["t1-g1"].status, "reached");
  assert.equal(r.S.goals["t1-g1"].moves.length, 2);
});

test("pointing at things: names, words, and the plain refusals", () => {
  const base = `fact home: Bobby is at home.\nfact: There is no milk in the house.\ngoal milk: Get milk.\ngoal: Get oat milk for Ann.\n`;
  const fail = tail => { const r = run(base + tail); assert.ok(r.error, tail); return r.error; };
  assert.match(fail(`move "milk": x`), /“milk” matches 2 goals\. Use more of its words\./);
  assert.equal(run(base + `move "Get milk": x`).error, undefined, "the whole text of one thing wins over a fragment of two");
  assert.equal(run(base + `move "oat": x`).error, undefined);
  assert.match(fail(`move "eggs": x`), /No goal that “move” could act on matches “eggs”/);
  assert.match(fail(`move home: x`), /“home” is a fact, and “move” needs a goal/);
  assert.match(fail(`release milk`), /“milk” is a goal, and “release” needs a fact/);
  assert.match(fail(`reach milk\nmove milk: again`), /“move” can't act on “milk” at this point: it is reached/);
  assert.match(fail(`release home\nrelease home`), /already stopped being true/);
  assert.match(fail(`accept milk`), /can't act on “milk”.*it is open/);
  assert.equal(run(base + `release "no milk"\nstuck milk: wait\nreopen milk\ndrop milk\nreopen milk`).error, undefined);
  const r = run(base + `release house`);
  assert.equal(r.error, undefined, "a bare word that is not a name is tried as a few words");
  assert.equal(pastState(r.S)[0].text, "There is no milk in the house.");
  const st = replay([]);
  assert.match(findRef(st, {}, "idea", { q: true, v: "x" }, "keep").error, /No idea/);
  assert.match(findRef(st, { ghost: { on: "goal", id: "g9" } }, "goal", { q: false, v: "ghost" }, "move").error, /not in this stream/);
});

test("the built-in world script assembles four maps of one world, with what is given kept apart from what is supposed", () => {
  const r = scriptToSteps(SCRIPT_EXAMPLES.world.text, replay);
  assert.equal(r.error, null);
  const S = replay(r.steps);
  const on = m => Object.values(S.nodes).filter(n => mapOf(n) === m);
  assert.deepEqual(Object.keys(WORLD_MAPS).map(m => on(m).length), [2, 7, 7, 5]);
  assert.deepEqual(on("said").map(n => n.words), ["He needs milk.", "Bobby went to the store to get milk."], "the evidence is exactly the two things that were said");
  assert.ok(Object.values(S.nodes).filter(n => n.map).every(n => n.supposed), "everything beyond what was said is a supposition");
  const linked = new Set(S.links.flatMap(l => [l.a, l.b]));
  assert.ok(Object.keys(S.nodes).every(id => linked.has(id)), "no item is left unlinked");
  const need = r.names.need.id;
  const readings = S.links.filter(l => l.a === need && S.nodes[l.b].map).map(l => [S.nodes[l.b].map, l.f]);
  assert.deepEqual(readings, [["env", "read as a lack"], ["mind", "read as a want"], ["moral", "read as an ought"]], "“he needs milk” is read once on each map");
  assert.deepEqual(Object.keys(WORLD_MAPS).map(m => S.nodes[pickFocusIn(S, m)].t), ["He needs milk.", "Bobby sets out from home.", "He means to go to the store and come back with milk.", "Those at home should not go without."]);
  assert.ok(Object.values(S.nodes).filter(n => n.slots.length).length >= 12, "most suppositions carry the question that would check them");
  assert.ok(r.steps.every(s => s.date === "Sep 30" && s.source === "script"));
  /* one vocabulary of link words: the sample uses only the method's, and the method document names every one */
  const words = [...WORLD_LINKS.within, ...WORLD_LINKS.across];
  assert.deepEqual(S.links.map(l => l.f).filter(f => !words.includes(f)), [], "every link in Bobby's world uses a word from WORLD_LINKS");
  const method = fs.readFileSync(new URL("../METHOD-Deriving-the-Maps.md", import.meta.url), "utf8");
  assert.deepEqual(words.filter(w => !method.includes(w)), [], "METHOD-Deriving-the-Maps.md names every word in WORLD_LINKS");
});

test("world-map lines: given or supposed, links across maps, questions, confirm and rule out", () => {
  const p = parseScript(`environment given: It is raining.\nmental want given: He wants milk.\nassumption: You pay.\nlink want "raining": despite\nshow assumptions\nlink want: x\nenvironment a b: x`);
  assert.deepEqual(p.steps.map(s => [s.verb, s.name, s.word]), [["environment", undefined, "given"], ["mental", "want", "given"], ["assumption", undefined, "supposed"], ["link", undefined, undefined], ["show", undefined, "assumptions"]]);
  assert.deepEqual(p.steps[3].ref2, { q: true, v: "raining" });
  assert.match(p.errors.find(e => e.line === 6).message, /needs two things to join/);
  assert.match(p.errors.find(e => e.line === 7).message, /doesn't know “b”.*supposed, given/);
  const base = `said need: He needs milk.\nenvironment nomilk: There is no milk in the house.\nmental want given: He wants milk.\nlink need nomilk: read as a lack\n`;
  const r = run(base + `ask nomilk: Gone, or only low?\nconfirm nomilk: He looked.\nruleout want: He is lactose intolerant.\nshow mental`);
  assert.equal(r.error, undefined);
  assert.deepEqual(r.log.slice(-4), ["action", "action", "action", "show"]);
  assert.equal(r.S.nodes[r.names.nomilk.id].supposed, false);
  assert.equal(r.S.nodes[r.names.want.id].ruledOut, true);
  assert.deepEqual(planStep(parseScript("show mental").steps[0], r.S, {}, x => x), { do: "show", view: "map", map: "mind" });
  assert.deepEqual(planStep(parseScript("show state").steps[0], r.S, {}, x => x), { do: "show", view: "state" });
  const fail = tail => run(base + tail).error;
  assert.match(fail(`confirm want`), /“confirm” can't act on “want” at this point: it is not a supposition/);
  assert.match(fail(`confirm need`), /it is not a supposition/, "what was said is not a supposition to confirm");
  assert.match(fail(`ruleout need`), /“ruleout” can't act on “need”/);
  assert.match(fail(`ruleout nomilk\nconfirm nomilk`), /it is ruled out/);
  assert.match(fail(`link need need: x`), /two different things/);
  assert.match(fail(`link need "eggs": x`), /No idea that “link” could act on matches “eggs”/);
});

test("map and loose-end lines become the same actions the buttons make", () => {
  const seed = [{ kind: "ingest", seq: 0, date: "Sep 30", source: "the story", result: {
    add: { b1: { t: "Bobby went to the store", kind: "idea", stuck: true, src: "user_said", words: "Bobby went to the store to get milk.", slots: [], history: [] },
      r1: { t: "Someone is waiting", kind: "idea", stuck: false, src: "inferred", reading: "A person at home expects the milk.", basis: ["b1"], slots: [], history: [] } },
    touch: [], replace: [], links: [{ a: "b1", b: "r1", f: "my reading", read: true }], question: "",
    flags: [{ id: "f1", type: "unanswered", text: "Did Bobby get the milk?", detail: "", nodes: ["b1"], phrase: "", suggestion: "", question: "" }] } }];
  const r = run(`focus "went to the store"\nanchor "Bobby went"\nkeep "waiting"\nresolve "Did Bobby" drop\nshow loose\nbranch`, seed);
  assert.equal(r.error, undefined);
  assert.deepEqual(r.log, ["focus", "action", "action", "action", "show", "branch"]);
  assert.deepEqual(r.steps.slice(1).map(s => s.action), [{ type: "anchor", id: "b1" }, { type: "keep", id: "r1" }, { type: "flag", flagId: "f1", choice: "drop" }]);
  assert.equal(r.S.nodes.b1.anchor, true);
  assert.equal(r.S.nodes.r1.kept, true);
  assert.match(r.S.outcomes.f1, /Dropped/);
  assert.match(run(`keep "went to the store"`, seed).error, /No idea that “keep” could act on/, "only a reading can be kept");
  assert.match(run(`resolve "Did Bobby" drop\nresolve "Did Bobby" drop`, seed).error, /No loose end/, "a settled loose end can't be settled again");
});

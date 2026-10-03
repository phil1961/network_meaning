/* ─────────────────────────────────────────────
   File: tests/states.test.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   The state taxonomy (src/shared/states.js): the twenty-five states in
   five families, the way a few words are placed against them, and the
   first offer each state leads to on the Start tab. */
import test from "node:test";
import assert from "node:assert/strict";
import { FAMILIES, STATES, stateById, familyById, statesIn, placeWords } from "../src/shared/states.js";
import { gapById, newWalk, offerThese, REACH } from "../src/shared/gaps.js";

test("the taxonomy is the document's: twenty-five states in five families, 5, 5, 5, 6 and 4", () => {
  assert.equal(STATES.length, 25);
  assert.deepEqual(FAMILIES.map(f => statesIn(f.id).length), [5, 5, 5, 6, 4]);
  assert.equal(new Set(STATES.map(s => s.id)).size, 25, "no id twice");
  assert.ok(STATES.every(s => familyById(s.family)), "every state is in a family that exists");
  const names = STATES.map(s => s.name);
  for (const n of ["Facing mortality", "Feeling lost or without direction", "Grief and loss", "Self-deception versus honesty", "Doubt and faith as a pair"]) assert.ok(names.includes(n), n);
});

test("each state has a doorway line, enough words to be found by, and three gaps of reach 1 to lead to", () => {
  for (const s of STATES) {
    assert.ok(s.door.length >= 40 && /[.!?]$/.test(s.door), `${s.id} has a doorway line`);
    assert.ok(s.words.length >= 10, `${s.id} has words to be found by`);
    assert.equal(new Set(s.words).size, s.words.length, `${s.id} lists no word twice`);
    assert.ok(["out", "in"].includes(s.to));
    assert.equal(s.leads.length, 3, `${s.id} leads to three gaps`);
    assert.ok(s.leads.every(id => gapById(id) && gapById(id).reach === REACH.min), `${s.id} leads to gaps nobody can fail`);
    assert.ok(s.leads.some(id => gapById(id).to === s.to), `${s.id} leads to at least one gap of its own kind`);
  }
  assert.doesNotMatch(STATES.map(s => s.door).join(" "), /\b(diagnos|disorder|depress|therap|symptom|should see a)\w*/i, "a doorway is not a diagnosis");
});

test("a few plain words are placed on the state they point at", () => {
  const first = w => placeWords(w)[0]?.id;
  assert.equal(first("I feel lost and don't know which way to go"), "lost");
  assert.equal(first("My mother died in March and I still miss her every day."), "grief");
  assert.equal(first("I can't forgive him for what he did"), "forgiveness");
  assert.equal(first("I'm so angry I want to scream"), "anger");
  assert.equal(first("I used to believe. I'm not sure I do any more, and I don't know what to do with the doubt."), "doubt");
  assert.equal(first("I keep putting it off. I just can't get going."), "inertia");
  assert.equal(first("Nobody calls. I'm on my own most evenings."), "loneliness");
  assert.equal(first("Should I take the job or stay? I can't decide."), "decision");
  assert.equal(first("The stars last night took my breath away"), "awe");
  assert.equal(first("I'm scared of what the scan will say"), "fear");
});

test("it returns at most three, the most pointed-at first, and nothing when nothing matches", () => {
  const got = placeWords("Since she died I feel lost, and I'm afraid of what comes next.");
  assert.ok(got.length >= 2 && got.length <= 3);
  assert.ok(got.map(s => s.id).includes("grief") && got.map(s => s.id).includes("lost"));
  assert.deepEqual(placeWords(""), []);
  assert.deepEqual(placeWords("   "), []);
  assert.deepEqual(placeWords("Tuesday. The bins go out."), []);
  /* the document's own example of what a keyword layer misses: it is missed, and not guessed at */
  assert.deepEqual(placeWords("I feel like a ship with no harbour"), []);
  /* a word inside another word is not a match */
  assert.deepEqual(placeWords("We made a nomad costume for the play."), [], "“made” is not “mad”, “nomad” is not “mad”");
  assert.equal(placeWords("I am LOST")[0].id, "lost", "capitals do not matter");
  assert.equal(placeWords("I don’t know which way to go")[0].id, "lost", "a curly apostrophe is an apostrophe");
});

test("a state is a way in: it picks the first three small goods and the kind of good to offer next", () => {
  const w = newWalk();
  const st = stateById("loneliness");
  w.state = st.id; w.to = st.to;
  const gaps = offerThese(w, st.leads);
  assert.deepEqual(gaps.map(g => g.id), st.leads);
  assert.ok(gaps.every(g => g.to === "out"), "loneliness leads first to goods for someone else");
  assert.deepEqual(w.offered, [st.leads], "the offer is noted like any other");
  assert.deepEqual(offerThese(newWalk(), ["i1a", "nope", "i1a", "o1b", "o1c", "i1b"]).map(g => g.id), ["i1a", "o1b", "o1c"], "unknown ids are dropped, repeats folded, and three at most");
});

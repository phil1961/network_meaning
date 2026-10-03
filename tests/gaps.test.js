/* ─────────────────────────────────────────────
   File: tests/gaps.test.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   The Start tab's small goods and the sizing of the next one
   (src/shared/gaps.js): what is offered, what each answer does to the
   reach, and the promises the page makes about never grading anyone. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { GAPS, FIRST_OFFER, REACH, BRIDGE, OUTCOMES, gapById, crossedByChoosing, newWalk, offer, settle, newBridge, trail } from "../src/shared/gaps.js";

const ids = gs => gs.map(g => g.id);
/* Cross a gap the way the page does: choose the first of what is offered, and say it was done. */
const crossFirst = w => { const g = offer(w)[0]; return { g, r: settle(w, g.id, "did") }; };

test("the list: three small goods of each kind at each reach, each with its own words", () => {
  for (let r = REACH.min; r <= REACH.max; r++) for (const to of ["out", "in"]) {
    assert.equal(GAPS.filter(g => g.reach === r && g.to === to).length, 3, `three ${to} at reach ${r}`);
  }
  assert.equal(new Set(ids(GAPS)).size, GAPS.length, "no id twice");
  assert.equal(new Set(GAPS.map(g => g.act)).size, GAPS.length, "no act twice");
  for (const g of GAPS) {
    assert.ok(g.act.length >= 12 && g.act.length <= 90, `“${g.act}” fits on a button`);
    assert.ok(g.done.length >= 20 && /[.!?]$/.test(g.done), `${g.id} says what happened once it is crossed`);
  }
  assert.ok(gapById("o1a") && gapById("nope") === null);
});

test("the first offer is the same for everyone: three thoughts, for someone else and for you, crossed by choosing", () => {
  const w = newWalk();
  const first = offer(w);
  assert.deepEqual(ids(first), FIRST_OFFER);
  assert.ok(first.every(g => g.reach === REACH.min && crossedByChoosing(g)));
  assert.deepEqual([...new Set(first.map(g => g.to))].sort(), ["in", "out"], "it offers both kinds");
  assert.equal(crossedByChoosing(gapById("o3a")), false, "anything bigger is done away from the page");
});

test("an offer is always three different gaps at the walk's reach, toward the chosen kind first", () => {
  const w = newWalk();
  settle(w, offer(w)[0].id, "did");
  w.to = "in";
  const next = offer(w);
  assert.equal(next.length, 3);
  assert.equal(new Set(ids(next)).size, 3);
  assert.ok(next.every(g => g.reach === 2 && g.to === "in"), "one step bigger, and for the person themselves");
  /* a long sitting never runs out and never offers one gap twice at once */
  const long = newWalk(); long.to = "out";
  for (let i = 0; i < 60; i++) {
    const o = offer(long);
    assert.equal(o.length, 3); assert.equal(new Set(ids(o)).size, 3);
    assert.ok(o.every(g => g.reach === long.reach), "every offer is at the reach the person showed");
    settle(long, o[i % 3].id, OUTCOMES[i % 3]);
    assert.ok(long.reach >= REACH.min && long.reach <= REACH.max);
  }
});

test("“I did it” lays a plank and reaches one further; five planks is a bridge", () => {
  const w = newWalk(); w.to = "out";
  const seen = [];
  for (let i = 1; i <= BRIDGE; i++) {
    const { g, r } = crossFirst(w);
    seen.push(g.reach);
    assert.equal(r.plank, true);
    assert.equal(r.across, i === BRIDGE, "only the last plank finishes the bridge");
    assert.equal(w.planks, i);
  }
  assert.deepEqual(seen, [1, 2, 3, 4, 5], "one step bigger each time, never ten");
  assert.equal(w.reach, REACH.max, "the reach stops at the top");
  newBridge(w);
  assert.deepEqual([w.planks, w.bridges, w.reach], [0, 1, REACH.max], "a new bridge starts empty, at the reach the person showed");
  assert.equal(trail(w).did.length, BRIDGE, "what was done on the first bridge is still theirs");
});

test("“later” keeps the gap for the person and offers others the same size; “smaller” offers smaller ones; neither lays a plank", () => {
  const w = newWalk(); w.to = "in";
  crossFirst(w);
  const kept = offer(w)[0];
  assert.deepEqual(settle(w, kept.id, "later"), { plank: false, across: false });
  assert.equal(w.reach, kept.reach, "the same size");
  const others = offer(w);
  assert.ok(!ids(others).includes(kept.id), "the one kept for later is not offered again straight away");
  assert.deepEqual(ids(trail(w).later), [kept.id]);
  const big = others[0];
  assert.deepEqual(settle(w, big.id, "smaller"), { plank: false, across: false });
  assert.equal(w.reach, big.reach - 1);
  assert.equal(w.planks, 1, "no plank is taken away, and none is laid");
  assert.ok(offer(w).every(g => g.reach === big.reach - 1));
  /* smaller than the smallest is still the smallest */
  const low = newWalk(); settle(low, "o2a", "smaller"); settle(low, "o1b", "smaller");
  assert.equal(low.reach, REACH.min);
  /* something kept for later and then done is no longer waiting */
  settle(w, kept.id, "did");
  assert.deepEqual(trail(w).later, []);
  assert.ok(ids(trail(w).did).includes(kept.id));
});

test("an answer the page does not know, or a gap that is not on the list, changes nothing", () => {
  const w = newWalk();
  assert.deepEqual(settle(w, "o1a", "failed"), { plank: false, across: false });
  assert.deepEqual(settle(w, "nope", "did"), { plank: false, across: false });
  assert.deepEqual([w.planks, w.reach, w.log.length], [0, REACH.min, 0]);
});

test("nothing in the words, on the page or in its help, grades the person", () => {
  const graded = /\b(scores?|points?|levels?|streaks?|badges?|grades?|failed|failure|ranks?|leaderboards?)\b/i;
  for (const g of GAPS) assert.doesNotMatch(g.act + " " + g.done, graded, g.id);
  const page = fs.readFileSync(new URL("../src/client/92-start.js", import.meta.url), "utf8");
  const shown = [...page.matchAll(/(?:said|lead): (?:later \? )?"([^"]+)"|>([^<>`$]{12,})</g)].map(m => m[1] || m[2]);
  assert.ok(shown.length >= 8, "the page's own sentences were found");
  for (const s of shown) assert.doesNotMatch(s, graded, s);
  /* the help may say what the page will never do; it must not promise any of it */
  const help = fs.readFileSync(new URL("../HELP-Start.md", import.meta.url), "utf8");
  assert.match(help, /It does not grade you/);
  assert.match(help, /no points, no marks, no streaks/);
  assert.match(help, /not saved, it is not sent anywhere/);
});

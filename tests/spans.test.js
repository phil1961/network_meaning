/* ─────────────────────────────────────────────
   File: tests/spans.test.js
   File Version: 0.1.0
   ───────────────────────────────────────────── */
import test from "node:test";
import assert from "node:assert/strict";
import { splitSpans, chunkText, spanLabel } from "../src/shared/spans.js";

test("splitSpans cuts sentences and folds short fragments forward", () => {
  const s = splitSpans("Yeah. So the car starts every morning. After a while you stop thinking of it!\n\nSecond paragraph here?");
  assert.deepEqual(s, ["Yeah. So the car starts every morning.", "After a while you stop thinking of it!", "Second paragraph here?"]);
});

test("splitSpans keeps a trailing sentence without punctuation and ignores blank input", () => {
  assert.deepEqual(splitSpans("No period at the end of this one"), ["No period at the end of this one"]);
  assert.deepEqual(splitSpans("   \n\n "), []);
  assert.deepEqual(splitSpans(null), []);
});

test("chunkText splits on blank lines under the limit and never loses text", () => {
  const paras = Array.from({ length: 40 }, (_, i) => `Paragraph ${i} ` + "x".repeat(500));
  const text = paras.join("\n\n");
  const chunks = chunkText(text, 5000);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every(c => c.length <= 5000));
  assert.equal(chunks.join("\n\n"), text);
});

test("chunkText hard-splits a single oversized paragraph", () => {
  const chunks = chunkText("y".repeat(12000), 5000);
  assert.deepEqual(chunks.map(c => c.length), [5000, 5000, 2000]);
});

test("spanLabel prints one-based runs", () => {
  assert.equal(spanLabel([0]), "¶ 1");
  assert.equal(spanLabel([0, 1, 2, 6, 8, 9]), "¶ 1–3, 7, 9–10");
  assert.equal(spanLabel([]), "");
});

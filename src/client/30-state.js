/* ─────────────────────────────────────────────
   File: src/client/30-state.js
   File Version: 0.6.0
   ─────────────────────────────────────────────
   App state. S is the replayed map (see src/shared/replay.js, inlined
   above). stream is the current stream, cursor how many of its steps are
   applied, focus the idea in the middle of the map. builtin is the sample
   key ("darlene", "world") for a built-in stream, false for a saved one. */
let S = emptyState();
let stream = { id: null, name: SAMPLES[DEFAULT_SAMPLE].name, builtin: DEFAULT_SAMPLE, steps: SAMPLES[DEFAULT_SAMPLE].steps.map(clone) };
let cursor = stream.steps.length;
let focus = null;
let mapSel = "said";      /* which map the diagram shows: a key of WORLD_MAPS */
let me = null;            /* {id, email, level, admin} once signed in */
let visiting = false;     /* true once someone chose to look around as a guest, with no account */
let savedStreams = [];    /* [{id, name, stepCount, updatedAt}] from the server */

function rebuild() {
  S = replay(stream.steps.slice(0, cursor));
  if (!S.nodes[focus]) focus = mapMiddle(S, mapSel) || pickFocus(S);
  /* the map in view follows the focus unless the person chose a map that has items of its own (ruled-out ones count: they are still on the map) */
  if (focus && mapOf(S.nodes[focus]) !== mapSel && !mapMiddle(S, mapSel)) mapSel = mapOf(S.nodes[focus]);
  renderAll();
}
/* A guest is someone with no account who chose to look around, or an
   account at the guest level. What a guest does stays in this tab and is
   not stored (Phil, 2026-09-30). */
function isGuest() { return me ? me.level === "guest" : visiting; }

/* What a field holds. A blank field with an "e.g. …" suggestion takes the
   suggestion as the entry (Phil, 2026-09-30). */
function entered(input) {
  const v = input.value.trim();
  if (v) return v;
  const m = /^e\.g\.\s+(.+)$/.exec(input.placeholder || "");
  return m ? m[1].trim() : "";
}
function isRewound() { return cursor < stream.steps.length; }

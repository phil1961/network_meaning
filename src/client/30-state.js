/* ─────────────────────────────────────────────
   File: src/client/30-state.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   App state. S is the replayed map (see src/shared/replay.js, inlined
   above). stream is the current stream, cursor how many of its steps are
   applied, focus the idea in the middle of the map. */
let S = emptyState();
let stream = { id: null, name: SAMPLE_NAME, builtin: true, steps: SAMPLE_STEPS.map(clone) };
let cursor = stream.steps.length;
let focus = "furnished";
let me = null;            /* {id, email} once signed in */
let savedStreams = [];    /* [{id, name, stepCount, updatedAt}] from the server */

function rebuild() {
  S = replay(stream.steps.slice(0, cursor));
  if (!S.nodes[focus]) focus = pickFocus(S);
  renderAll();
}
function isRewound() { return cursor < stream.steps.length; }

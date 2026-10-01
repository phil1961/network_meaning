/* ─────────────────────────────────────────────
   File: src/client/40-streams.js
   File Version: 0.2.0
   ─────────────────────────────────────────────
   Opening, forking, branching, deleting streams and appending steps.
   Ingest steps are made by the server (80-add.js); action steps are
   appended here, optimistically, and posted in order. */
let saveChain = Promise.resolve(), saveProblem = null, pendingSaves = 0;

function queueSave(fn) {
  pendingSaves++;
  saveChain = saveChain.then(fn).then(() => { saveProblem = null; }, e => { saveProblem = e && e.message ? e.message : "Couldn't save the last change. It's still here in this tab."; })
    .then(() => { pendingSaves--; renderSave(); });
  renderSave();
}

async function refreshList() {
  try { savedStreams = await api.listStreams(); } catch (e) { if (e.code !== "signed_out") saveProblem = "Couldn't load your saved streams."; }
  renderStreamBar();
}

/* Strip a sample step down to what the server stores. */
function snapshotStep(st) {
  const c = clone(st); delete c.seq; delete c.at; return c;
}

async function openSaved(id) {
  try {
    const s = await api.getStream(id);
    stream = { id: s.id, name: s.name, builtin: false, steps: s.steps };
    cursor = stream.steps.length; focus = null; lsSet("nm.lastStream", id);
    rebuild();
  } catch (e) { if (e.code !== "signed_out") toast("Couldn't open that stream. Try again."); }
}
function openSample(key = "sample") {
  const s = SAMPLES[key] || SAMPLES.sample; key = SAMPLES[key] ? key : "sample";
  stream = { id: null, name: s.name, builtin: key, steps: s.steps.map(clone) };
  cursor = stream.steps.length; focus = key === "sample" ? "furnished" : null; lsSet("nm.lastStream", key); rebuild();
}
async function newEmpty() {
  try {
    const s = await api.createStream({ name: "Untitled · " + stamp(new Date().toISOString()), steps: [] });
    stream = { id: s.id, name: s.name, builtin: false, steps: [] };
    cursor = 0; focus = null; lsSet("nm.lastStream", s.id);
    await refreshList(); rebuild();
    return true;
  } catch (e) { if (e.code !== "signed_out") toast(e.message || "Couldn't create a stream."); return false; }
}
async function branchHere() {
  const base = stream.builtin ? stream.name.replace(/^Sample: /, "") : stream.name;
  const name = `${base} (branch at step ${cursor})`;
  try {
    const s = stream.builtin
      ? await api.createStream({ name, steps: stream.steps.slice(0, cursor).map(snapshotStep) })
      : await api.createStream({ name, fromStreamId: stream.id, atSeq: cursor });
    await openSaved(s.id); await refreshList();
    toast("Branched. The new stream is saved.");
  } catch (e) { if (e.code !== "signed_out") toast(e.message || "Couldn't branch."); }
}
async function deleteCurrent() {
  if (stream.builtin || !stream.id) return;
  const id = stream.id;
  try { await api.deleteStream(id); } catch (e) { if (e.code !== "signed_out") { toast(e.message || "Couldn't delete."); return; } }
  openSample(); await refreshList(); toast("Stream deleted.");
}
async function renameCurrent(name) {
  if (stream.builtin || !stream.id) return;
  stream.name = name;
  queueSave(async () => { await api.renameStream(stream.id, name); await refreshList(); });
  renderStreamBar();
}

/* Make sure the current stream can take a new step: fork the sample into a
   saved stream, refuse while rewound. Async because forking is a request. */
async function ensureWritable(onTopOfSample) {
  if (isRewound()) { toast("You're looking at an earlier step. Go back to latest or branch from here first."); return false; }
  if (!stream.builtin) return true;
  const steps = onTopOfSample ? stream.steps.map(snapshotStep) : [];
  const name = onTopOfSample ? stream.name.replace(/^Sample: /, "") + " + yours · " + stamp(new Date().toISOString()) : "Untitled · " + stamp(new Date().toISOString());
  try {
    const s = await api.createStream({ name, steps });
    stream = { id: s.id, name: s.name, builtin: false, steps: onTopOfSample ? stream.steps.map(clone) : [] };
    cursor = stream.steps.length; lsSet("nm.lastStream", s.id);
    await refreshList(); rebuild();
    return true;
  } catch (e) { if (e.code !== "signed_out") toast(e.message || "Couldn't start a saved stream."); return false; }
}

/* Append an already-stored step (from /ingest) to the local stream. */
function addStoredStep(step) {
  stream.steps.push(step); cursor = stream.steps.length;
}

/* Append an action step: local first, then posted in order. */
async function recordAction(action, label) {
  if (!await ensureWritable(true)) return false;
  const step = { kind: "action", at: new Date().toISOString(), date: today(), source: label, action, seq: stream.steps.length };
  stream.steps.push(step); cursor = stream.steps.length;
  const sid = stream.id;
  queueSave(async () => { const r = await api.postAction(sid, { kind: "action", action, source: label, date: step.date }); step.seq = r.step.seq; step.at = r.step.at; });
  return true;
}

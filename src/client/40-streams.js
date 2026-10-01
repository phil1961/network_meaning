/* ─────────────────────────────────────────────
   File: src/client/40-streams.js
   File Version: 0.7.0
   ─────────────────────────────────────────────
   Opening, forking, branching, deleting streams and appending steps.
   A stream is read-only here when it is a built-in sample or one that
   someone else shared; acting on either starts a saved copy of your own.
   Ingest steps are made by the server (80-add.js); action steps are
   appended here, shown at once, and posted in order.

   The save queue keeps the page and the server the same stream. If a post
   fails, the queue stops: nothing later is sent, the page says so and goes
   on saying so, and no new change is taken until the two agree again. A
   failure of the connection is retried, in order. A change the server
   refuses is undone here and the stream is read again from the server. */
let saveQueue = [], saveChain = Promise.resolve(), saveProblem = null, saving = false;
function isReadOnly() { return !!(stream.builtin || stream.readonly); }
/* A guest's stream: it lives in this tab only and is never sent to the server. */
function goLocal(name, steps) { stream = { id: null, name, builtin: false, local: true, steps }; cursor = steps.length; }

function queueSave(fn, sid) {
  saveQueue.push({ fn, sid });
  saveChain = saveChain.then(drainSaves);
  renderSave();
  return saveChain;
}
async function drainSaves() {
  if (saving) return;
  saving = true; renderSave();
  while (saveQueue.length) {
    try { await saveQueue[0].fn(); saveQueue.shift(); saveProblem = null; }
    catch (e) {
      if (e && e.code === "signed_out") { saveProblem = "Not saved: sign in again, then click here to save."; break; }
      if (e && e.status >= 400 && e.status < 500 && e.status !== 429) { await undoUnsaved(e); break; }
      saveProblem = `Not saved yet (${saveQueue.length} change${saveQueue.length === 1 ? "" : "s"}): couldn't reach the server. Click here to try again.`;
      break;
    }
  }
  saving = false; renderSave();
}
/* The server will never take this change, so it is taken back here too, with
   everything queued behind it, and the stream is read again from the server. */
async function undoUnsaved(e) {
  const sid = saveQueue[0].sid;
  saveQueue = []; saveProblem = null;
  toast(`That change was not accepted and has been undone: ${e && e.message ? e.message : "the server refused it."}`);
  if (sid && stream.id === sid) { try { const s = await api.getStream(sid); stream.steps = s.steps; cursor = stream.steps.length; rebuild(); } catch (err) { /* the next open reads it */ } }
}
function retrySaves() { saveChain = saveChain.then(drainSaves); return saveChain; }
/* True when the page holds changes the server does not. */
async function unsavedBlocks() {
  if (!saveProblem || !saveQueue.length) return false;
  await retrySaves();
  if (!saveProblem) return false;
  toast("The last change isn't saved yet, so nothing new is taken. It will be tried again when you act, or click the note at the top right.");
  return true;
}

async function refreshList() {
  if (!me) { savedStreams = []; renderStreamBar(); return; }
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
    stream = { id: s.id, name: s.name, builtin: false, readonly: s.mine === false, shared: !!s.shared, steps: s.steps };
    cursor = stream.steps.length; focus = null; lsSet("nm.lastStream", id);
    rebuild();
  } catch (e) { if (e.code !== "signed_out") toast("Couldn't open that stream. Try again."); }
}
function openSample(key = DEFAULT_SAMPLE) {
  if (!SAMPLES[key]) key = DEFAULT_SAMPLE;
  const s = SAMPLES[key];
  stream = { id: null, name: s.name, builtin: key, steps: s.steps.map(clone) };
  cursor = stream.steps.length; focus = key === "sample" ? "furnished" : null; lsSet("nm.lastStream", key); rebuild();
}
async function newEmpty(name) {
  if (isGuest()) { goLocal(name || "Untitled", []); focus = null; rebuild(); return true; }
  try {
    const s = await api.createStream({ name: name || "Untitled · " + stamp(new Date().toISOString()), steps: [] });
    stream = { id: s.id, name: s.name, builtin: false, steps: [] };
    cursor = 0; focus = null; lsSet("nm.lastStream", s.id);
    await refreshList(); rebuild();
    return true;
  } catch (e) { if (e.code !== "signed_out") toast(e.message || "Couldn't create a stream."); return false; }
}
async function branchHere() {
  const base = stream.name.replace(/^Sample: /, "");
  const name = `${base} (branch at step ${cursor})`;
  if (isGuest()) { goLocal(name, stream.steps.slice(0, cursor).map(clone)); rebuild(); toast("Branched. As a guest, it is not saved."); return true; }
  try {
    const s = stream.builtin
      ? await api.createStream({ name, steps: stream.steps.slice(0, cursor).map(snapshotStep) })
      : await api.createStream({ name, fromStreamId: stream.id, atSeq: cursor });
    await openSaved(s.id); await refreshList();
    toast("Branched. The new stream is saved.");
    return true;
  } catch (e) { if (e.code !== "signed_out") toast(e.message || "Couldn't branch."); return false; }
}
async function deleteCurrent() {
  if (stream.local) { openSample(); toast("Gone. It was never saved."); return; }
  if (isReadOnly() || !stream.id) return;
  const id = stream.id;
  try { await api.deleteStream(id); } catch (e) { if (e.code !== "signed_out") { toast(e.message || "Couldn't delete."); return; } }
  openSample(); await refreshList(); toast("Stream deleted.");
}
/* Share the open stream with everyone signed in, or stop. Admin only; the server checks. */
async function shareCurrent(shared) {
  if (isReadOnly() || !stream.id) return;
  try { await api.shareStream(stream.id, shared); stream.shared = shared; await refreshList(); renderAdd(); toast(shared ? "Shared. Everyone signed in can read it and branch from it." : "No longer shared."); }
  catch (e) { if (e.code !== "signed_out") toast(e.message || "Couldn't change sharing."); }
}
async function renameCurrent(name) {
  if (stream.local) { stream.name = name; renderStreamBar(); return; }
  if (isReadOnly() || !stream.id) return;
  stream.name = name;
  const sid = stream.id;
  queueSave(async () => { await api.renameStream(sid, name); await refreshList(); }, sid);
  renderStreamBar();
}

/* Make sure the current stream can take a new step: fork the sample into a
   saved stream, refuse while rewound. Async because forking is a request. */
async function ensureWritable(onTopOfSample) {
  if (isRewound()) { toast("You're looking at an earlier step. Go back to latest or branch from here first."); return false; }
  if (stream.local) return true;
  if (isGuest()) { goLocal(onTopOfSample ? stream.name.replace(/^Sample: /, "") + " + yours" : "Untitled", onTopOfSample ? stream.steps.map(clone) : []); rebuild(); return true; }
  if (!isReadOnly()) return true;
  const steps = onTopOfSample ? stream.steps.map(snapshotStep) : [];
  const name = onTopOfSample ? stream.name.replace(/^Sample: /, "") + " + yours · " + stamp(new Date().toISOString()) : "Untitled · " + stamp(new Date().toISOString());
  try {
    /* a built-in sample is copied from the steps in hand; a shared stream is copied on the server */
    const fromShared = onTopOfSample && !stream.builtin;
    const s = await api.createStream(fromShared ? { name, fromStreamId: stream.id } : { name, steps });
    /* the server's copy of a shared stream is the truth: its owner may have added to it since it was opened here */
    const copied = fromShared ? (await api.getStream(s.id)).steps : onTopOfSample ? stream.steps.map(clone) : [];
    stream = { id: s.id, name: s.name, builtin: false, readonly: false, shared: false, steps: copied };
    cursor = stream.steps.length; lsSet("nm.lastStream", s.id);
    await refreshList(); rebuild();
    return true;
  } catch (e) { if (e.code !== "signed_out") toast(e.message || "Couldn't start a saved stream."); return false; }
}

/* Append an already-stored step (from /ingest) to the local stream. */
function addStoredStep(step) {
  stream.steps.push(step); cursor = stream.steps.length;
}

/* Append an action step: local first, then posted in order. A script may
   give the date label; everything else is dated today. */
async function recordAction(action, label, date) {
  if (await unsavedBlocks()) return false;
  if (!await ensureWritable(true)) return false;
  const step = { kind: "action", at: new Date().toISOString(), date: date || today(), source: label, action, seq: stream.steps.length };
  stream.steps.push(step); cursor = stream.steps.length;
  if (stream.local) return true; /* a guest's step stays here */
  const sid = stream.id;
  queueSave(async () => { const r = await api.postAction(sid, { kind: "action", action, source: label, date: step.date }); step.seq = r.step.seq; step.at = r.step.at; }, sid);
  return true;
}

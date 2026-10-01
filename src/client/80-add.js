/* ─────────────────────────────────────────────
   File: src/client/80-add.js
   File Version: 0.2.0
   ─────────────────────────────────────────────
   Add text: paste, drop, split long text into passes, send each pass to
   the server's /ingest, append the returned step. The one question. */
let busy = false, ctl = null, fileQueue = [], lastSummary = null, openQ = null, dismissedQ = null;

function setStatus(msg, bad) { const s = $("#status"); s.textContent = msg || ""; s.classList.toggle("bad", !!bad); }

async function ingestOne(text, source, tier) {
  ctl = new AbortController();
  const t0 = Date.now();
  const tick = setInterval(() => setStatus(`Thinking… ${Math.round((Date.now() - t0) / 1000)}s. A pass usually takes 10 to 60 seconds.`), 1000);
  setStatus("Thinking… A pass usually takes 10 to 60 seconds.");
  let r;
  try { r = await api.ingest(stream.id, { text, source, tier }, ctl.signal); }
  finally { clearInterval(tick); }
  addStoredStep(r.step);
  focus = null; rebuild();
  const res = r.step.result || {};
  const nIdeas = Object.values(res.add || {}).filter(n => n.stuck).length, nRead = Object.values(res.add || {}).filter(n => !n.stuck).length;
  const goals = res.goals || [];
  lastSummary = { source, ideas: nIdeas, readings: nRead, again: (res.touch || []).length, links: (res.links || []).length, flags: (res.flags || []).length, goals: goals.filter(g => !g.existing).length, moves: goals.reduce((n, g) => n + (g.moves || []).length, 0), dropped: r.dropped || 0 };
  dismissedQ = null;
  return r;
}
async function runIngest(onTop) {
  if (busy) return;
  const text = $("#entry").value; const files = fileQueue.slice();
  if (!text.trim() && !files.length) { setStatus("Paste or drop some text first.", true); return; }
  if (!await ensureWritable(onTop)) return;
  busy = true; renderAdd();
  const jobs = [];
  if (text.trim()) { const src = $("#source").value.trim() || "Pasted text"; const ch = chunkText(text); ch.forEach((c, i) => jobs.push({ text: c, source: ch.length > 1 ? `${src} (part ${i + 1} of ${ch.length})` : src, fromBox: true })); }
  for (const f of files) { const ch = chunkText(f.text); ch.forEach((c, i) => jobs.push({ text: c, source: ch.length > 1 ? `${f.name} (part ${i + 1} of ${ch.length})` : f.name, file: f })); }
  let ok = 0, boxDone = 0, boxJobs = jobs.filter(j => j.fromBox).length;
  for (let i = 0; i < jobs.length; i++) {
    const j = jobs[i]; if (j.file) { j.file.status = "working"; renderQueue(); }
    try {
      if (jobs.length > 1) setStatus(`Pass ${i + 1} of ${jobs.length}: ${j.source}`);
      await ingestOne(j.text, j.source, $("#tier").value); ok++;
      if (j.file) { j.file.status = "done"; renderQueue(); }
      if (j.fromBox) boxDone++;
    } catch (e) {
      const code = e && e.code;
      if (j.file) { j.file.status = "failed"; renderQueue(); }
      if (code === "empty_input") { setStatus("There's no readable text in that entry.", true); continue; }
      setStatus(e && e.message ? e.message : "Something went wrong on the way. Your text is still here. Try again.", code !== "cancelled");
      break;
    }
  }
  busy = false; ctl = null;
  if (boxJobs && boxDone === boxJobs) { $("#entry").value = ""; $("#source").value = ""; } /* the pasted text is on the map; don't ingest it twice */
  fileQueue = fileQueue.filter(f => f.status !== "done");
  if (ok) setStatus(ok > 1 ? `Done. ${ok} passes added to the stream.` : "Done. The map is updated.");
  renderAdd();
}

function openQuestion(text, from) { if (!text) return; openQ = { text, from }; dismissedQ = null; renderAdd(); setTimeout(() => $("#answer").focus(), 0); }
function currentQuestion() {
  if (openQ) return openQ;
  if (S.question && S.question.text !== dismissedQ) return { text: S.question.text, from: "One question · after " + S.question.source };
  return null;
}
function renderQueue() {
  const ul = $("#queue"); ul.hidden = !fileQueue.length;
  ul.innerHTML = fileQueue.map((f, i) => `<li><span>${esc(f.name)} · ${f.text.length.toLocaleString()} chars</span><span>${f.status === "working" ? "working…" : f.status === "done" ? "added" : f.status === "failed" ? "not added" : `<button class="linkbtn" data-unq="${i}">remove</button>`}</span></li>`).join("");
}
function renderCharCount() { const cnt = $("#entry").value.length; $("#charcount").textContent = `${cnt.toLocaleString()} characters` + (cnt > MAX_CHUNK ? ` · will run as ${chunkText($("#entry").value).length} passes` : ""); }
function renderAdd() {
  renderCharCount(); renderQueue();
  const acts = $("#addactions"); const rew = isRewound();
  let h = "";
  if (busy) h = `<button class="btn danger" id="stop">Stop</button>`;
  else if (!me) h = `<span class="small">Sign in to ideaify.</span>`;
  else if (rew) h = `<span class="small">You're viewing an earlier step. Go back to latest or branch to add text.</span>`;
  else if (stream.builtin) h = `<button class="btn primary" data-run="empty">Ideaify in a new empty stream</button><button class="btn" data-run="ontop">Add on top of the sample</button>`;
  else h = `<button class="btn primary" data-run="go">Ideaify</button>`;
  acts.innerHTML = h;
  const sm = $("#summary");
  if (lastSummary && !busy) {
    const L = lastSummary; sm.hidden = false;
    sm.innerHTML = `<p><b>Added from ${esc(L.source)}:</b> ${L.ideas} ideas in your words, ${L.readings} readings, ${L.again} said again, ${L.links} links, ${L.flags} loose ends${L.goals || L.moves ? `, ${L.goals} goal${L.goals === 1 ? "" : "s"} read in the text to confirm, ${L.moves} move${L.moves === 1 ? "" : "s"}` : ""}.</p>` + (L.dropped > 0 ? `<p class="small">${L.dropped} suggested items were dropped because they didn't point to your text.</p>` : "") + `<div class="actions"><button class="btn" data-gomap="1">See it on the map</button>${L.goals || L.moves ? `<button class="btn" data-gostate="1">Review goals</button>` : ""}${L.flags ? `<button class="btn" data-gole="1">Review loose ends</button>` : ""}</div>`;
  } else sm.hidden = true;
  const cq = currentQuestion(); const qb = $("#qbox");
  if (cq && !busy) { qb.hidden = false; $("#qboxfrom").textContent = cq.from; $("#qboxtext").textContent = cq.text; $("#sendanswer").disabled = !me || rew; }
  else qb.hidden = true;
  $("#streamname").value = stream.name; $("#streamname").disabled = stream.builtin;
  $("#streaminfo").textContent = stream.builtin ? "The built-in sample is read-only. Adding text or acting on it starts your own saved copy." : (stream.steps.length ? `${stream.steps.length} steps. Select one to see the map as it was then.` : "Empty. Add text to begin.");
  const list = $("#steplist");
  list.innerHTML = `<li class="${cursor === 0 ? "cur" : ""}"><button class="stepbtn" data-cur="0"><span class="n">0</span><span><span class="s">Empty map</span><span class="d">Reset to zero</span></span></button></li>` + stream.steps.map((st, i) => {
    const r = st.result;
    const counts = r ? `${Object.keys(r.add || {}).length} new · ${(r.links || []).length} links · ${(r.flags || []).length} loose ends` : "";
    return `<li class="${i + 1 === cursor ? "cur" : ""}${i + 1 > cursor ? " future" : ""}"><button class="stepbtn" data-cur="${i + 1}"><span class="n">${i + 1}</span><span><span class="s">${esc(stepLabel(st))}</span><span class="d">${esc(st.date || "")}${st.at ? " · " + esc(stamp(st.at)) : ""}${counts ? " · " + counts : ""}${st.model ? " · " + esc(st.model) : ""}</span></span></button>${st.text ? `<details><summary>Show the text</summary><pre>${esc(clip(st.text, 6000))}</pre></details>` : ""}</li>`;
  }).join("");
  $("#streamactions").innerHTML = stream.builtin ? "" : `<button class="btn" id="branch2" ${cursor === 0 ? "disabled" : ""}>Branch at step ${cursor}</button><button class="btn danger" id="del">Delete this stream</button>`;
}
$("#addactions").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.id === "stop") { if (ctl) ctl.abort(); return; }
  if (b.dataset.run) runIngest(b.dataset.run === "ontop" || b.dataset.run === "go");
});
$("#summary").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.gomap) showView("map"); if (b.dataset.gostate) showView("state"); if (b.dataset.gole) showView("loose"); });
$("#entry").addEventListener("input", renderCharCount);
$("#queue").addEventListener("click", e => { const b = e.target.closest("[data-unq]"); if (b) { fileQueue.splice(+b.dataset.unq, 1); renderQueue(); } });
$("#sendanswer").addEventListener("click", async () => {
  const ans = $("#answer").value.trim(); const cq = currentQuestion();
  if (!ans) { $("#answer").focus(); return; }
  if (busy || !await ensureWritable(true)) return;
  busy = true; renderAdd();
  try { await ingestOne(ans, `Your answer to: “${clip(cq ? cq.text : "a question", 70)}”`, $("#tier").value); $("#answer").value = ""; openQ = null; setStatus("Your answer is on the map."); }
  catch (e) { setStatus(e && e.message ? e.message : "Something went wrong. Your answer is still here. Try again.", e && e.code !== "cancelled"); }
  busy = false; ctl = null; renderAdd();
});
$("#skipq").addEventListener("click", () => { const cq = currentQuestion(); if (openQ) openQ = null; else if (cq) dismissedQ = cq.text; renderAdd(); });
$("#steplist").addEventListener("click", e => { const b = e.target.closest("[data-cur]"); if (b) { cursor = +b.dataset.cur; rebuild(); } });
$("#streamactions").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.id === "branch2") branchHere();
  if (b.id === "del") {
    if (b.dataset.armed) { deleteCurrent(); return; }
    b.dataset.armed = "1"; b.textContent = "Delete for good? Click again"; setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = "Delete this stream"; } }, 4000);
  }
});
$("#streamname").addEventListener("change", e => { if (!stream.builtin) renameCurrent(e.target.value.trim() || "Untitled"); });

/* drag and drop */
const drop = $("#drop");
["dragenter", "dragover"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove("over")));
drop.addEventListener("drop", async e => {
  e.preventDefault();
  const files = [...(e.dataTransfer.files || [])];
  if (files.length) {
    const readable = files.filter(f => /^text\//.test(f.type) || /\.(md|markdown|txt|text|csv|json|html?)$/i.test(f.name));
    if (readable.length < files.length) toast("Only text files can be added: .txt, .md and similar.");
    const loaded = await Promise.all(readable.map(f => f.text().then(t => ({ name: f.name, text: t, status: "queued" })).catch(() => null)));
    const ok = loaded.filter(Boolean);
    if (ok.length === 1 && !$("#entry").value.trim()) { $("#entry").value = ok[0].text; if (!$("#source").value.trim()) $("#source").value = ok[0].name; }
    else fileQueue.push(...ok);
    renderAdd(); return;
  }
  const t = e.dataTransfer.getData("text/plain");
  if (t) { const ta = $("#entry"); ta.value = ta.value ? ta.value + "\n\n" + t : t; renderAdd(); }
});

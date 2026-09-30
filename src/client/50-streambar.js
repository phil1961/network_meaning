/* ─────────────────────────────────────────────
   File: src/client/50-streambar.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   The bar under the header: which stream, which step, save state. */
function stepLabel(step) {
  if (step.kind === "action") {
    const a = step.action || {};
    return { keep: "You kept a reading", discard: "You discarded a reading", anchor: "You changed an anchor", flag: "You resolved a loose end" }[a.type] || "You made a change";
  }
  return step.source || "Text";
}
function renderStreamBar() {
  const sel = $("#streamsel");
  let opts = `<option value="sample">${esc(SAMPLE_NAME)}</option>`;
  for (const s of savedStreams) opts += `<option value="${esc(s.id)}">${esc(s.name || "Untitled")} · ${s.stepCount || 0} steps</option>`;
  if (!stream.builtin && stream.id && !savedStreams.some(s => s.id === stream.id)) opts += `<option value="${esc(stream.id)}">${esc(stream.name)}</option>`;
  sel.innerHTML = opts;
  sel.value = stream.builtin ? "sample" : stream.id;
  const sc = $("#scrub"); sc.max = String(stream.steps.length); sc.value = String(cursor); sc.disabled = !stream.steps.length;
  const cur = cursor ? stream.steps[cursor - 1] : null;
  $("#scrubout").textContent = stream.steps.length ? `${cursor} of ${stream.steps.length}` + (cur ? ` · ${cur.date || ""} · ${stepLabel(cur)}` : " · empty map") : "No steps yet";
  const rw = $("#rewound");
  if (isRewound()) { rw.hidden = false; $("#rewoundtext").textContent = `You're viewing step ${cursor} of ${stream.steps.length}. Later steps are kept. Branch to continue from here without losing them.`; }
  else rw.hidden = true;
  renderSave();
}
function renderSave() {
  const el = $("#savestate"); el.className = "save";
  if (!me) { el.textContent = "Signed out"; return; }
  if (stream.builtin) { el.textContent = "Sample · read-only"; return; }
  if (saveProblem) { el.textContent = saveProblem; el.classList.add("bad"); return; }
  if (pendingSaves) { el.textContent = "Saving…"; return; }
  el.textContent = "Saved"; el.classList.add("ok");
}
$("#streamsel").addEventListener("change", e => { const v = e.target.value; if (v === "sample") openSample(); else openSaved(v); });
$("#newstream").addEventListener("click", async () => { if (await newEmpty()) { showView("add"); $("#entry").focus(); } });
$("#scrub").addEventListener("input", e => { cursor = +e.target.value; rebuild(); });
$("#tolatest").addEventListener("click", () => { cursor = stream.steps.length; rebuild(); });
$("#branch").addEventListener("click", branchHere);

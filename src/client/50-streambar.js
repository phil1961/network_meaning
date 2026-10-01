/* ─────────────────────────────────────────────
   File: src/client/50-streambar.js
   File Version: 0.2.0
   ─────────────────────────────────────────────
   The bar under the header: which stream, which step, save state. */
function stepLabel(step) {
  if (step.kind === "action") {
    const a = step.action || {};
    const g = a.goalId && S.goals && S.goals[a.goalId] ? ` · ${clip(S.goals[a.goalId].text, 40)}` : "";
    switch (a.type) {
      case "keep": return "You kept a reading";
      case "discard": return "You discarded a reading";
      case "anchor": return "You changed an anchor";
      case "flag": return "You resolved a loose end";
      case "state": return `State: ${clip(a.text, 60)}`;
      case "release": return "A state fact stopped being true";
      case "goal": return `Goal put forth: ${clip(a.text, 50)}`;
      case "acceptgoal": return "You confirmed a goal" + g;
      case "rejectgoal": return "Not a goal" + g;
      case "move": return `Move (${a.effect || "same"}): ${clip(a.text, 50)}`;
      case "reach": return "Goal reached" + g;
      case "regoal": return ({ stuck: "Ground is stuck", dropped: "Goal dropped", open: "Goal reopened" }[a.status] || "Goal changed") + g;
      default: return "You made a change";
    }
  }
  return step.source || "Text";
}
function renderStreamBar() {
  const sel = $("#streamsel");
  let opts = Object.entries(SAMPLES).map(([k, s]) => `<option value="${k}">${esc(s.name)}</option>`).join("");
  for (const s of savedStreams) opts += `<option value="${esc(s.id)}">${esc(s.name || "Untitled")} · ${s.stepCount || 0} steps</option>`;
  if (!stream.builtin && stream.id && !savedStreams.some(s => s.id === stream.id)) opts += `<option value="${esc(stream.id)}">${esc(stream.name)}</option>`;
  sel.innerHTML = opts;
  sel.value = stream.builtin ? stream.builtin : stream.id;
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
$("#streamsel").addEventListener("change", e => { const v = e.target.value; if (SAMPLES[v]) openSample(v); else openSaved(v); });
$("#newstream").addEventListener("click", async () => { if (await newEmpty()) { showView("add"); $("#entry").focus(); } });
$("#scrub").addEventListener("input", e => { cursor = +e.target.value; rebuild(); });
$("#tolatest").addEventListener("click", () => { cursor = stream.steps.length; rebuild(); });
$("#branch").addEventListener("click", branchHere);

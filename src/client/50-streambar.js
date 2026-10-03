/* ─────────────────────────────────────────────
   File: src/client/50-streambar.js
   File Version: 0.7.0
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
      case "item": return `${WORLD_MAPS[a.map] || "Map"}${a.map !== "said" && a.supposed !== false ? ", supposed" : ""}: ${clip(a.text, 50)}`;
      case "link": return `Linked: ${clip(S.nodes[a.a] ? S.nodes[a.a].t : "…", 26)} · ${a.f || "connects to"} · ${clip(S.nodes[a.b] ? S.nodes[a.b].t : "…", 26)}`;
      case "ask": return `Open question: ${clip(a.text, 50)}`;
      case "confirm": return `Confirmed: ${clip(S.nodes[a.id] ? S.nodes[a.id].t : "an item", 50)}`;
      case "ruleout": return `Ruled out: ${clip(S.nodes[a.id] ? S.nodes[a.id].t : "an item", 50)}`;
      case "analysis": { const k = (a.suggestions || []).length; return `Help analysis · ${k} suggestion${k === 1 ? "" : "s"}`; }
      case "place": return a.reset ? "You put the boxes on a diagram back" : `You moved a box: ${clip(S.nodes[a.id] ? S.nodes[a.id].t : "an item", 50)}`;
      case "verdict": return `Your word on a suggestion: ${{ new: "new to me", knew: "already knew", wrong: "wrong" }[a.mark] || "noted"}`;
      case "answer": { const f = optionById(a.option); return f ? `For ${ARC.character}, ${f.scene.title.toLowerCase()}: ${clip(f.option.text, 50)}` : "An answer for a character"; }
      default: return "You made a change";
    }
  }
  return step.source || "Text";
}
/* What a stream holds, said before it is chosen: its steps, and how many
   items sit on each of its world maps (Phil, 2026-09-30). */
function streamTally(steps, maps) {
  const c = maps || { env: 0, mind: 0, moral: 0 };
  return `${steps} step${steps === 1 ? "" : "s"} · ` + (c.env || c.mind || c.moral ? `Environment ${c.env || 0}, Mental state ${c.mind || 0}, Assumptions ${c.moral || 0}` : "no world maps");
}
function renderStreamBar() {
  const sel = $("#streamsel");
  let opts = Object.entries(SAMPLES).map(([k, s]) => `<option value="${k}">${esc(s.name)} · ${streamTally(s.steps.length, s.maps || (s.maps = worldCounts(s.steps)))}</option>`).join("");
  /* the open stream is counted from the steps in hand, so the line is right before the list is fetched again */
  for (const s of savedStreams) opts += `<option value="${esc(s.id)}">${s.mine === false ? "Shared: " : ""}${esc(s.name || "Untitled")} · ${s.id === stream.id ? streamTally(stream.steps.length, worldCounts(stream.steps)) : streamTally(s.stepCount || 0, s.maps)}${s.mine !== false && s.shared ? " · shared with everyone" : ""}</option>`;
  if (!stream.builtin && stream.id && !savedStreams.some(s => s.id === stream.id)) opts += `<option value="${esc(stream.id)}">${esc(stream.name)} · ${streamTally(stream.steps.length, worldCounts(stream.steps))}</option>`;
  if (stream.local) opts += `<option value="local">${esc(stream.name)} · ${streamTally(stream.steps.length, worldCounts(stream.steps))} · not saved</option>`;
  sel.innerHTML = opts;
  sel.value = stream.builtin ? stream.builtin : stream.local ? "local" : stream.id;
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
  if (stream.local) { el.textContent = "Guest · not saved"; return; }
  if (!me) { el.textContent = visiting ? "Guest" : "Signed out"; return; }
  if (stream.builtin) { el.textContent = "Sample · read-only"; return; }
  if (stream.readonly) { el.textContent = "Shared · read-only"; return; }
  if (saveProblem) { el.textContent = saveProblem; el.classList.add("bad"); return; }
  if (saveQueue.length) { el.textContent = "Saving…"; return; }
  el.textContent = "Saved"; el.classList.add("ok");
}
$("#streamsel").addEventListener("change", e => { const v = e.target.value; if (v === "local") return; if (SAMPLES[v]) openSample(v); else openSaved(v); });
$("#savestate").addEventListener("click", () => { if (saveProblem) retrySaves(); });
$("#newstream").addEventListener("click", async () => { if (await newEmpty()) { showView("add"); $("#entry").focus(); } });
$("#scrub").addEventListener("input", e => { cursor = +e.target.value; rebuild(); });
$("#tolatest").addEventListener("click", () => { cursor = stream.steps.length; rebuild(); });
$("#branch").addEventListener("click", branchHere);

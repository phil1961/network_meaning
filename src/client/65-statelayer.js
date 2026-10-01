/* ─────────────────────────────────────────────
   File: src/client/65-statelayer.js
   File Version: 0.2.0
   ─────────────────────────────────────────────
   The State view: Now (the person's standing facts), Goals (put forth,
   moved toward, reached, stuck, dropped) and the movement toward each goal.
   Every button here appends an action step, so the state layer rewinds
   and branches with the rest of the stream. Nothing is computed that the
   person did not report: a goal's movement is its moves, in order. */
const effectGlyph = { closer: "●", same: "○", farther: "◐" };
const effectWord = { closer: "closer", same: "no change", farther: "farther" };
let openForm = null; /* {goalId, kind:"move"|"reach"} or {stateId, kind:"release"} while an inline form is showing */

function newId(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

function goalCard(id, g) {
  const m = movement(g);
  const beads = g.moves.map(x => `<span class="bead e-${esc(x.effect)}${x.read ? " read" : ""}" title="${esc(x.date)} · ${esc(x.text)} · ${effectWord[x.effect] || x.effect}">${effectGlyph[x.effect] || "○"}</span>`).join("");
  const reached = g.status === "reached";
  let sum = m.moves ? `${m.moves} move${m.moves > 1 ? "s" : ""}` + (m.closer ? ` · ${m.closer} closer` : "") + (m.same ? ` · ${m.same} no change` : "") + (m.farther ? ` · ${m.farther} farther` : "") + (m.last ? ` · last ${esc(m.last.date)}` : "") : "No moves yet";
  if (reached) sum += ` · reached ${esc(g.reachedOn || "")}`;
  let h = `<article class="goal st-${esc(g.status)}" data-goal="${esc(id)}">
    <div class="goalhead"><div class="meta"><span class="chip gs-${esc(g.status)}">${esc(goalStatusLabel(g.status))}</span><span class="chip">${esc(g.date || "")}</span>${g.proposed && g.status !== "proposed" ? `<span class="chip reading">read in your text</span>` : ""}</div>
    <h3>${esc(g.text)}</h3></div>`;
  if (g.words) h += `<p class="words gwords">${esc(g.words)}</p><div class="src"><span>${esc(g.date || "")}</span><span>${esc(g.at || "")}</span><span>${esc(g.source || "")}</span>${g.ideaId && S.nodes[g.ideaId] ? `<button class="linkbtn" data-go="${esc(g.ideaId)}">on the map</button>` : ""}</div>`;
  h += `<div class="track"><span class="beads">${beads}${reached ? `<span class="bead reachedmark" title="reached">★</span>` : ""}</span><span class="small">${sum}</span></div>`;
  if (g.moves.length) h += `<ol class="moves">${g.moves.map(x => `<li class="${x.read ? "read" : ""}"><span class="mdate">${esc(x.date)}</span><span class="mglyph e-${esc(x.effect)}">${effectGlyph[x.effect] || "○"}</span><span class="mtext">${esc(x.text)}${x.read ? ` <span class="small">(read in your text)</span>` : ""}</span></li>`).join("")}</ol>`;
  if (reached && g.stateId && S.state[g.stateId]) h += `<p class="reachednote">Now part of your state: <b>${esc(S.state[g.stateId].text)}</b>${S.state[g.stateId].ended ? ` <span class="small">(no longer true since ${esc(S.state[g.stateId].ended)})</span>` : ""}</p>`;
  if (g.history && g.history.length > 1) h += `<details class="ghist"><summary>History</summary><ul class="hist">${g.history.map(x => `<li>${esc(x)}</li>`).join("")}</ul></details>`;
  const f = openForm && openForm.goalId === id ? openForm : null;
  if (f && f.kind === "move") {
    h += `<form class="inline" data-form="move" data-goal="${esc(id)}"><label class="small" for="mv-${esc(id)}">What happened, in your own words</label>
      <input class="input" id="mv-${esc(id)}" autocomplete="off" placeholder="e.g. Bobby is at the store. They have milk.">
      <div class="row"><span class="small">This moved the goal:</span>${["closer", "same", "farther"].map((e, i) => `<label class="radio"><input type="radio" name="eff-${esc(id)}" value="${e}" ${i === 0 ? "checked" : ""}> ${effectGlyph[e]} ${effectWord[e]}</label>`).join("")}</div>
      <div class="actions"><button class="btn primary" type="submit">Record the move</button><button class="btn" type="button" data-cancel="1">Cancel</button></div></form>`;
  } else if (f && f.kind === "reach") {
    h += `<form class="inline" data-form="reach" data-goal="${esc(id)}"><label class="small" for="rc-${esc(id)}">What is true now that this is reached? It becomes a fact in Now.</label>
      <input class="input" id="rc-${esc(id)}" autocomplete="off" value="${esc(g.text)}">
      <div class="actions"><button class="btn primary" type="submit">Reached</button><button class="btn" type="button" data-cancel="1">Cancel</button></div></form>`;
  } else {
    let acts = "";
    if (g.status === "proposed") acts = `<button class="btn primary" data-act="acceptgoal">Yes, this is a goal</button><button class="btn" data-act="rejectgoal">Not a goal</button>`;
    else if (g.status === "open") acts = `<button class="btn primary" data-open="move">Record a move</button><button class="btn" data-open="reach">Reached</button><button class="btn" data-act="stuck">Ground is stuck</button><button class="btn danger" data-act="dropped">Drop</button>`;
    else if (g.status === "stuck") acts = `<button class="btn primary" data-open="move">Record a move</button><button class="btn" data-act="open">Reopen</button><button class="btn danger" data-act="dropped">Drop</button>`;
    else if (g.status === "dropped" && !g.proposed) acts = `<button class="btn" data-act="open">Take it up again</button>`;
    if (acts) h += `<div class="actions">${isRewound() ? acts.replace(/<button /g, "<button disabled ") : acts}</div>`;
  }
  return h + `</article>`;
}

function renderStateView() {
  const now = currentState(S), past = pastState(S);
  const factRow = s => {
    const f = openForm && openForm.stateId === s.id ? openForm : null;
    return `<li class="fact${s.from === "reached" ? " reached" : ""}" data-state="${esc(s.id)}"><div class="factbody"><p class="ftext">${esc(s.text)}</p>
      <p class="small">since ${esc(s.date)}${s.from === "reached" && S.goals[s.goalId] ? ` · reached goal: <button class="linkbtn" data-goalgo="${esc(s.goalId)}">${esc(S.goals[s.goalId].text)}</button>` : ""}</p>
      ${f ? `<form class="inline" data-form="release" data-state="${esc(s.id)}"><input class="input" id="rl-${esc(s.id)}" placeholder="What changed? (optional)" autocomplete="off"><div class="actions"><button class="btn primary" type="submit">No longer true</button><button class="btn" type="button" data-cancel="1">Cancel</button></div></form>` : ""}</div>
      ${f ? "" : `<button class="btn" data-release="${esc(s.id)}">No longer true</button>`}</li>`;
  };
  $("#factlist").innerHTML = now.length ? now.map(factRow).join("") : `<li class="empty small">Nothing put forth yet. Say what is true for you right now, or reach a goal.</li>`;
  $("#pastwrap").hidden = !past.length;
  $("#pastsummary").textContent = `Past · ${past.length} fact${past.length === 1 ? "" : "s"} that stopped being true`;
  $("#pastlist").innerHTML = past.map(s => `<li class="fact ended"><div class="factbody"><p class="ftext">${esc(s.text)}</p><p class="small">${esc(s.date)} → ${esc(s.ended)}${s.endNote ? ` · ${esc(s.endNote)}` : ""}</p></div></li>`).join("");

  const order = ["proposed", "open", "stuck", "reached", "dropped"];
  const entries = Object.entries(S.goals).sort((a, b) => order.indexOf(a[1].status) - order.indexOf(b[1].status));
  const live = entries.filter(([, g]) => g.status !== "dropped"), dropped = entries.filter(([, g]) => g.status === "dropped");
  $("#goallist").innerHTML = (live.length ? live.map(([id, g]) => goalCard(id, g)).join("") : `<p class="empty small">No goals yet. Put one forth above, or add text: goals stated in it are read out for you to confirm.</p>`)
    + (dropped.length ? `<details class="ghist"><summary>Dropped · ${dropped.length}</summary>${dropped.map(([id, g]) => goalCard(id, g)).join("")}</details>` : "");
  const open = entries.filter(([, g]) => g.status === "open" || g.status === "proposed" || g.status === "stuck").length;
  const c = $("#goalcount"); c.textContent = open; c.hidden = !open;
  const rew = isRewound();
  document.querySelectorAll("#factform input, #factform button, #goalform input, #goalform button").forEach(el => { el.disabled = rew; });
}

async function stateAction(action, label, after) {
  if (!await recordAction(action, label)) return;
  openForm = null; rebuild(); if (after) after();
}

$("#factform").addEventListener("submit", async e => {
  e.preventDefault(); const t = $("#facttext").value.trim(); if (!t) { $("#facttext").focus(); return; }
  await stateAction({ type: "state", stateId: newId("s"), text: t }, "state", () => { $("#facttext").value = ""; toast("Added to Now."); });
});
$("#goalform").addEventListener("submit", async e => {
  e.preventDefault(); const t = $("#goaltext").value.trim(); if (!t) { $("#goaltext").focus(); return; }
  await stateAction({ type: "goal", goalId: newId("g"), text: t }, "goal", () => { $("#goaltext").value = ""; toast("Goal put forth."); });
});
$("#view-state").addEventListener("click", async e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.go) { setFocus(b.dataset.go); showView("map"); return; }
  if (b.dataset.goalgo) { const el = document.querySelector(`[data-goal="${CSS.escape(b.dataset.goalgo)}"]`); if (el) el.scrollIntoView({ block: "center" }); return; }
  if (b.dataset.cancel) { openForm = null; renderStateView(); return; }
  if (b.dataset.release) { if (isRewound()) { toast("You're looking at an earlier step. Go back to latest or branch first."); return; } openForm = { stateId: b.dataset.release, kind: "release" }; renderStateView(); $(`#rl-${CSS.escape(b.dataset.release)}`)?.focus(); return; }
  const card = b.closest("[data-goal]"); if (!card) return;
  const id = card.dataset.goal;
  if (b.dataset.open) { if (isRewound()) { toast("You're looking at an earlier step. Go back to latest or branch first."); return; } openForm = { goalId: id, kind: b.dataset.open }; renderStateView(); $(`#${b.dataset.open === "move" ? "mv" : "rc"}-${CSS.escape(id)}`)?.focus(); return; }
  const act = b.dataset.act; if (!act) return;
  if (act === "acceptgoal" || act === "rejectgoal") await stateAction({ type: act, goalId: id }, "goal", () => toast(act === "acceptgoal" ? "Goal confirmed." : "Marked as not a goal."));
  else await stateAction({ type: "regoal", goalId: id, status: act }, "goal", () => toast(act === "stuck" ? "Marked: the ground is stuck. It stays here; a move reopens it." : act === "dropped" ? "Dropped. It stays in the history." : "Reopened."));
});
$("#view-state").addEventListener("submit", async e => {
  const f = e.target.closest("form[data-form]"); if (!f) return;
  e.preventDefault();
  if (f.dataset.form === "move") {
    const id = f.dataset.goal; const text = f.querySelector("input.input").value.trim(); if (!text) { f.querySelector("input.input").focus(); return; }
    const effect = (f.querySelector("input[type=radio]:checked") || {}).value || "same";
    await stateAction({ type: "move", goalId: id, text, effect }, "move", () => toast("Move recorded."));
  } else if (f.dataset.form === "reach") {
    const id = f.dataset.goal; const text = f.querySelector("input.input").value.trim();
    await stateAction({ type: "reach", goalId: id, stateId: newId("s"), text }, "reach", () => toast("Reached. It is part of your state now."));
  } else if (f.dataset.form === "release") {
    const id = f.dataset.state; const note = f.querySelector("input.input").value.trim();
    await stateAction({ type: "release", stateId: id, note }, "state", () => toast("Moved to the past."));
  }
});

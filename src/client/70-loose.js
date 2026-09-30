/* ─────────────────────────────────────────────
   File: src/client/70-loose.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   Loose Ends: the inbox of things the map noticed but won't decide. */
const leIcon = { garble: "≈", unanswered: "?", echo: "↔", gap: "∅", tension: "⚡", bet: "⌛", correction: "✓" };
const leName = { garble: "Garble", unanswered: "Unanswered", echo: "Echo", gap: "Gap", tension: "Tension", bet: "Bet missed", correction: "Correction" };
function flagActs(f) {
  switch (f.type) {
    case "garble": return f.suggestion ? [[`Use “${clip(f.suggestion, 40)}”`, "accept", "primary"], ["Keep as written", "keep"]] : [["Keep as written", "keep"]];
    case "echo": return f.nodes.filter(id => S.nodes[id]).length >= 2 ? [["Link them", "link", "primary"], ["Not related", "unrelated"]] : [["Noted", "ok"]];
    case "unanswered": return [["Answer it", "talk", "primary"], ["Drop it", "drop"]];
    case "gap": return [["Fill it in", "talk", "primary"], ["Later", "later"]];
    case "tension": return [["Talk it through", "talk", "primary"], ["Both are true", "both"]];
    default: return [["Got it", "ok"]];
  }
}
function renderLE() {
  const open = S.flags.filter(f => !S.outcomes[f.id]), done = S.flags.filter(f => S.outcomes[f.id]);
  const row = f => `<li class="le${S.outcomes[f.id] ? " done" : ""}"><div class="type t-${esc(f.type)}"><i>${leIcon[f.type] || "•"}</i>${esc(leName[f.type] || f.type)}</div>
    <div class="body"><p class="text">${esc(f.text)}</p>${f.detail ? `<p class="detail">${esc(f.detail)}</p>` : ""}
    ${f.nodes.some(k => S.nodes[k]) ? `<p class="detail">On the map: ${f.nodes.filter(k => S.nodes[k]).map(k => `<button class="linkbtn" data-go="${esc(k)}">${esc(S.nodes[k].t)}</button>`).join(" · ")}</p>` : ""}
    ${S.outcomes[f.id] ? `<p class="outcome">✓ ${esc(S.outcomes[f.id])}</p>` : `<div class="actions">${flagActs(f).map(a => `<button class="btn ${a[2] || ""}" data-flag="${esc(f.id)}" data-choice="${a[1]}">${esc(a[0])}</button>`).join("")}</div>`}
    </div></li>`;
  $("#lelist").innerHTML = S.flags.length ? open.map(row).join("") + done.map(row).join("") : `<li class="empty">No loose ends yet. They appear as text is added.</li>`;
  const c = $("#lecount"); c.textContent = open.length; c.hidden = !open.length;
}
$("#lelist").addEventListener("click", async e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.go) { setFocus(b.dataset.go); showView("map"); return; }
  const id = b.dataset.flag, choice = b.dataset.choice; if (!id) return;
  const f = S.flags.find(x => x.id === id); if (!f) return;
  const qtext = f.question || f.text;
  if (!await recordAction({ type: "flag", flagId: id, choice }, "flag")) return;
  rebuild();
  if (choice === "talk") { openQuestion(qtext, "From Loose Ends"); showView("add"); }
});

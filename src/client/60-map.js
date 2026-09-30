/* ─────────────────────────────────────────────
   File: src/client/60-map.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   The map: a neighborhood around one idea, the side panel (your words,
   history, open questions, connections, traceback), search, and Draft. */
const svg = $("#map");
const CX = 480, CY = 300, RX = 320, RY = 215;

function boxFor(id, isFocus) {
  const n = S.nodes[id];
  const font = (n.stuck && !n.kept ? "" : "italic ") + (isFocus ? "600 15px" : "500 13px") + ' "IBM Plex Sans", system-ui, sans-serif';
  const lines = wrap(n.t, isFocus ? 190 : 150, font);
  const lh = isFocus ? 20 : 17;
  const w = Math.max(...lines.map(l => textW(l, font))) + (isFocus ? 32 : 24);
  const h = lines.length * lh + (isFocus ? 22 : 16);
  return { lines, w, h, lh, fs: isFocus ? 15 : 13 };
}
function edgePt(x, y, w, h, tx, ty) {
  const dx = tx - x, dy = ty - y; if (!dx && !dy) return [x, y];
  const s = Math.min(dx ? (w / 2 + 4) / Math.abs(dx) : Infinity, dy ? (h / 2 + 4) / Math.abs(dy) : Infinity);
  return [x + dx * s, y + dy * s];
}
function nodeSVG(id, x, y, b, isFocus, extra) {
  const n = S.nodes[id]; const act = actOf(S, n);
  const opacity = act === "replaced" || act === "quiet" ? 0.45 : (act === "fading" ? 0.65 : 1);
  const reading = !n.stuck || n.kept;
  let stroke = "var(--ink)", fill = "var(--panel)", sw = 1.5, dash = "", tcol = "var(--ink)", tstyle = "";
  if (reading) { stroke = "var(--reading)"; fill = n.kept ? "var(--accent-soft)" : "var(--paper)"; dash = n.kept ? "" : 'stroke-dasharray="5 4"'; tcol = "var(--reading)"; tstyle = 'font-style="italic"'; }
  if (isFocus) { stroke = reading ? "var(--reading)" : "var(--accent)"; fill = "var(--accent-soft)"; sw = 2.5; }
  let s = `<g class="node" data-id="${esc(id)}" tabindex="0" role="button" aria-label="${esc(n.t)}" transform="translate(${x},${y})" opacity="${opacity}">`;
  if (n.anchor) s += `<rect x="${-b.w / 2 - 4}" y="${-b.h / 2 - 4}" width="${b.w + 8}" height="${b.h + 8}" rx="9" fill="none" stroke="${stroke}" stroke-width="1.2"/>`;
  s += `<rect class="box" x="${-b.w / 2}" y="${-b.h / 2}" width="${b.w}" height="${b.h}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${dash}/>`;
  const top = -((b.lines.length - 1) * b.lh) / 2;
  b.lines.forEach((ln, i) => { s += `<text x="0" y="${top + i * b.lh}" dy="0.35em" text-anchor="middle" font-family="IBM Plex Sans, system-ui, sans-serif" font-size="${b.fs}" font-weight="${isFocus ? 600 : 500}" fill="${tcol}" ${tstyle} ${n.replaced ? 'text-decoration="line-through"' : ""}>${esc(ln)}</text>`; });
  if (act === "arriving") s += `<circle cx="${-b.w / 2 + 1}" cy="${-b.h / 2 + 1}" r="4.5" fill="var(--accent)" stroke="var(--panel)" stroke-width="1.5"><title>new in the latest pass</title></circle>`;
  if (n.replaced) s += `<text x="0" y="${-b.h / 2 - 8}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="1" fill="var(--warn)">REPLACED</text>`;
  else if (n.kept) s += `<text x="0" y="${-b.h / 2 - 8}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="1" fill="var(--reading)">READING YOU KEPT</text>`;
  else if (!n.stuck) s += `<text x="0" y="${-b.h / 2 - 8}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="1" fill="var(--reading)">MY READING</text>`;
  const slots = Math.min((n.slots || []).length, 5);
  for (let i = 0; i < slots; i++) { const sx = (i - (slots - 1) / 2) * 14; s += `<circle cx="${sx}" cy="${b.h / 2 + 9}" r="4" fill="var(--panel)" stroke="var(--open)" stroke-width="1.5"><title>open question</title></circle>`; }
  if (extra > 0) s += `<text x="${b.w / 2 + 6}" y="${b.h / 2 - 2}" font-family="IBM Plex Mono, monospace" font-size="11" fill="var(--muted)">+${extra}</text>`;
  return s + "</g>";
}
function renderMap() {
  if (!focus || !S.nodes[focus]) {
    $("#focuslabel").innerHTML = stream.steps.length && cursor === 0 ? "Step 0: the empty map before anything was added" : "This stream is empty";
    svg.innerHTML = `<text x="480" y="280" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="18" fill="var(--muted)">Nothing on the map yet.</text><text x="480" y="310" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="14" fill="var(--muted)">Open “Add text” and paste something to start.</text>`;
    fixVars(svg);
    $("#panel").innerHTML = `<div class="empty"><b>An empty map</b><span>Paste or drop text in Add text. Claude pulls out your ideas and links them here.</span><button class="btn primary" data-goadd="1">Add text</button></div>`;
    return;
  }
  const nb = neighbors(S, focus).slice(0, 12);
  $("#focuslabel").innerHTML = `Showing the neighborhood of <b>${esc(S.nodes[focus].t)}</b>`;
  const fb = boxFor(focus, true); const count = nb.length;
  const placed = nb.map((x, i) => {
    const ang = (-Math.PI / 2) + (i * (2 * Math.PI / Math.max(count, 1))) + (count % 2 ? 0 : Math.PI / count / 2);
    return { ...x, x: CX + RX * Math.cos(ang), y: CY + RY * Math.sin(ang), b: boxFor(x.other, false) };
  });
  let s = `<defs>
    <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/></marker>
    <marker id="arrR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--reading)"/></marker>
  </defs><g class="fade-in">`;
  const slotPad = id => (S.nodes[id].slots || []).length ? 16 : 0;
  for (const p of placed) {
    const fromFocus = p.l.a === focus;
    const [x1, y1] = fromFocus ? edgePt(CX, CY, fb.w, fb.h + slotPad(focus), p.x, p.y) : edgePt(p.x, p.y, p.b.w, p.b.h + slotPad(p.other), CX, CY);
    const [x2, y2] = fromFocus ? edgePt(p.x, p.y, p.b.w, p.b.h, CX, CY) : edgePt(CX, CY, fb.w, fb.h, p.x, p.y);
    const col = p.l.read ? "var(--reading)" : "var(--muted)";
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="1.3" ${p.l.read ? 'stroke-dasharray="5 4"' : ""} marker-end="url(#${p.l.read ? "arrR" : "arr"})"/>`;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; const lw = textW(p.l.f, '400 11px "IBM Plex Mono", monospace') + 10;
    s += `<g transform="translate(${mx},${my})"><rect x="${-lw / 2}" y="-9" width="${lw}" height="18" rx="3" fill="var(--panel)" stroke="var(--line)"/><text x="0" y="0" dy="0.35em" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="${col}">${esc(p.l.f)}</text></g>`;
  }
  for (const p of placed) { const extra = neighbors(S, p.other).filter(x => x.other !== focus).length; s += nodeSVG(p.other, p.x, p.y, p.b, false, extra); }
  s += nodeSVG(focus, CX, CY, fb, true, Math.max(0, neighbors(S, focus).length - nb.length));
  if (!count) s += `<text x="${CX}" y="${CY + fb.h / 2 + 44}" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="13" fill="var(--muted)">Not connected to anything yet. Check Loose Ends for suggested links.</text>`;
  s += "</g>";
  svg.innerHTML = s; fixVars(svg);
  renderPanel();
}
svg.addEventListener("click", e => { const g = e.target.closest("[data-id]"); if (g && g.dataset.id !== focus) setFocus(g.dataset.id); });
svg.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { const g = e.target.closest("[data-id]"); if (g) { e.preventDefault(); setFocus(g.dataset.id); } } });
function setFocus(id) { if (!S.nodes[id]) return; focus = id; renderMap(); const g = svg.querySelector(`[data-id="${CSS.escape(id)}"]`); if (g) g.focus({ preventScroll: true }); }

function renderPanel() {
  const n = S.nodes[focus]; const nb = neighbors(S, focus); const act = actOf(S, n);
  let h = `<div class="meta">`;
  if (n.kept) h += `<span class="chip kept">reading you kept</span>`;
  else if (n.stuck) h += `<span class="chip mine">${n.src === "quoted_text" ? "source text" : "your words"}</span>`;
  else h += `<span class="chip reading">my reading</span>`;
  if (n.anchor) h += `<span class="chip">anchor</span>`;
  h += `<span class="chip">${esc(n.kind)}</span>`;
  if (act === "replaced") h += `<span class="chip replaced">replaced</span>`;
  else if (act !== "anchor") h += `<span class="chip state-${act}">${esc(actLabel(act))}</span>`;
  h += `</div><h2>${esc(n.t)}</h2>`;
  if (n.stuck && !n.kept) {
    h += `<div class="sec"><h3>${n.src === "quoted_text" ? "Source text" : "Your words"}</h3><p class="words${n.src === "quoted_text" ? " quote" : ""}">${esc(n.words)}</p><div class="src">`;
    if (n.cite) h += `<span>${esc(n.cite)}</span><span>matched verbatim</span>`;
    else h += `<span>${esc(n.date || "")}</span><span>${esc(n.at || "")}</span><span>${esc(n.file || "")}</span>`;
    h += `</div>`;
    if (n.also && n.also.length) { h += `<div class="also">` + n.also.map(a => `<p>“${esc(clip(a.words, 400))}”</p><div class="src"><span>said again · ${esc(a.date)}</span><span>${esc(a.source)}</span></div>`).join("") + `</div>`; }
    h += `</div>`;
  } else {
    h += `<div class="sec"><h3>${n.kept ? "My reading, which you kept" : "My reading"}</h3><p class="reading-text${n.kept ? " kept" : ""}">${esc(n.reading)}</p>
      <p class="small" style="margin:8px 0 0">Based on: ${(n.basis || []).filter(b => S.nodes[b]).map(b => `<button class="linkbtn" data-go="${esc(b)}">${esc(S.nodes[b].t)}</button>`).join(", ") || "(the ideas it was based on are gone)"}</p>`;
    if (n.kept) h += `<p class="small" style="margin:8px 0 0">Kept on ${esc(n.keptOn || "")}. It stays in the machine's words, marked as such.</p>`;
    else h += `<div class="actions" style="margin-top:10px"><button class="btn primary" data-keep="1">Keep this reading</button><button class="btn danger" data-discard="1">Discard</button></div>`;
    h += `</div>`;
  }
  if (n.history && n.history.length) h += `<div class="sec"><h3>History</h3><ul class="hist">${n.history.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
  if (n.slots && n.slots.length) h += `<div class="sec"><h3>Open questions</h3><ul class="plain">${n.slots.map((q, i) => `<li class="slotq"><span class="dot"></span><p>${esc(q)}</p><button class="linkbtn small" data-ask="${i}">Answer this</button></li>`).join("")}</ul></div>`;
  h += `<div class="sec"><h3>Connects to</h3>`;
  h += nb.length ? `<ul class="plain">${nb.map(({ l, other }) => `<li><span class="small">${esc(l.a === focus ? l.f : "← " + l.f)}</span> <button class="linkbtn" data-go="${esc(other)}">${esc(S.nodes[other].t)}</button></li>`).join("")}</ul>` : `<p class="small" style="margin:0">Nothing yet.</p>`;
  h += `</div>`;
  if (!n.anchor) {
    const tr = traceToAnchor(S, focus);
    h += `<div class="sec"><h3>Traces back to</h3>`;
    if (tr && tr.length) h += `<div class="trace">` + tr.map(s => (s.via ? `<span class="via">${esc(s.via)} →</span>` : "") + `<span class="step${S.nodes[s.id].anchor ? " anchor" : ""}">${esc(S.nodes[s.id].t)}</span>`).join("") + `</div>`;
    else h += `<p class="small" style="margin:0">${Object.values(S.nodes).some(x => x.anchor) ? "No path to an anchor yet. That's allowed." : "No anchors in this stream. Pin one if you want everything traced back to it."}</p>`;
    h += `</div>`;
  }
  h += `<div class="actions"><button class="btn" data-draft="1">Draft from here</button>${n.stuck && !n.kept ? `<button class="btn" data-anchor="1">${n.anchor ? "Unpin anchor" : "Make this an anchor"}</button>` : ""}</div>`;
  $("#panel").innerHTML = h;
}
$("#panel").addEventListener("click", async e => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.goadd) { showView("add"); $("#entry").focus(); return; }
  if (t.dataset.go) { setFocus(t.dataset.go); return; }
  if (t.dataset.ask !== undefined) { openQuestion(S.nodes[focus].slots[+t.dataset.ask], "Open question on “" + S.nodes[focus].t + "”"); showView("add"); return; }
  if (t.dataset.draft) { openDraft(); return; }
  const id = focus;
  if (t.dataset.keep) { if (await recordAction({ type: "keep", id }, "keep")) { rebuild(); toast("Kept. It stays marked as my reading."); } }
  else if (t.dataset.discard) { const back = (S.nodes[id].basis || []).find(b => S.nodes[b]); if (await recordAction({ type: "discard", id }, "discard")) { focus = back || null; rebuild(); toast("Discarded. Your own words are untouched."); } }
  else if (t.dataset.anchor) { if (await recordAction({ type: "anchor", id }, "anchor")) rebuild(); }
});

/* search */
const q = $("#q"), sug = $("#suggest");
function matches() { const v = q.value.trim().toLowerCase(); if (!v) return []; return Object.keys(S.nodes).filter(k => S.nodes[k].t.toLowerCase().includes(v) || (S.nodes[k].words || S.nodes[k].reading || "").toLowerCase().includes(v)).slice(0, 7); }
q.addEventListener("input", () => { const m = matches(); sug.innerHTML = m.map(k => `<li><button data-go="${esc(k)}">${esc(S.nodes[k].t)}</button></li>`).join(""); sug.hidden = !m.length; });
q.addEventListener("keydown", e => { if (e.key === "Enter") { const m = matches(); if (m[0]) { setFocus(m[0]); sug.hidden = true; q.value = ""; } } if (e.key === "Escape") sug.hidden = true; });
sug.addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b) { setFocus(b.dataset.go); sug.hidden = true; q.value = ""; } });
document.addEventListener("click", e => { if (!e.target.closest(".search")) sug.hidden = true; });

/* draft */
function openDraft() {
  const n = S.nodes[focus]; const order = [focus, ...neighbors(S, focus).map(x => x.other).filter(id => !S.nodes[id].replaced)];
  let html = "", md = `# ${n.t}\n\n`;
  for (const id of order) {
    const x = S.nodes[id];
    if (x.stuck && !x.kept) { const cite = x.cite || `${x.date || ""}${x.file ? " · " + x.file : ""}`; html += `<blockquote>${esc(x.words)}<cite>${esc(cite)}</cite></blockquote>`; md += `> ${x.words}\n> (${cite})\n\n`; }
    else { const tag = x.kept ? "[my reading, which you kept]" : "[my reading]"; html += `<p><span class="mr">${tag} ${esc(x.reading)}</span></p>`; md += `*${tag} ${x.reading}*\n\n`; }
    for (const s of x.slots || []) { html += `<p class="gap">Open: ${esc(s)}</p>`; md += `**Open:** ${s}\n\n`; }
  }
  $("#drafttitle").textContent = n.t; $("#draftbody").innerHTML = html; $("#draftmd").value = md.trim();
  $("#scrim").hidden = false; $("#closedraft").focus();
}
$("#closedraft").addEventListener("click", () => { $("#scrim").hidden = true; });
$("#scrim").addEventListener("click", e => { if (e.target.id === "scrim") $("#scrim").hidden = true; });
document.addEventListener("keydown", e => { if (e.key === "Escape") $("#scrim").hidden = true; });
$("#copymd").addEventListener("click", () => {
  const ta = $("#draftmd"); const fallback = () => { ta.focus(); ta.select(); toast("Selected. Press Ctrl+C to copy."); };
  try { navigator.clipboard.writeText(ta.value).then(() => toast("Copied."), fallback); } catch (err) { fallback(); }
});

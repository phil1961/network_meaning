/* ─────────────────────────────────────────────
   File: src/client/60-map.js
   File Version: 0.3.0
   ─────────────────────────────────────────────
   The map: a neighborhood around one idea, the side panel (your words,
   history, open questions, connections, traceback), search, and Draft.
   One diagram draws every map of the world: what was said, and the maps
   of the environment, the mental state, and the assumptions. The selector
   above the diagram picks which. "What was said" shows one step out from
   the focus, as before. A world map shows two steps out within that map,
   plus the focus's own links into the other maps. */
const svg = $("#map");
const mapWord = { said: "what was said", env: "the environment", mind: "the mental state", moral: "the assumptions" };
const mapColor = { env: "var(--m-env)", mind: "var(--m-mind)", moral: "var(--m-moral)" };
/* A new item is joined to the one in focus with a word from WORLD_LINKS
   (src/shared/replay.js), the same list the method document uses. */
const joinDirs = [["out", "from the item in focus to it"], ["in", "from it to the item in focus"], ["none", "not linked yet"]];

function boxFor(id, isFocus, width) {
  const n = S.nodes[id];
  const font = (n.stuck && !n.kept ? "" : "italic ") + (isFocus ? "600 15px" : "500 13px") + ' "IBM Plex Sans", system-ui, sans-serif';
  const lines = wrap(n.t, width || (isFocus ? 190 : 150), font);
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
  if (n.supposed) { fill = "var(--paper)"; dash = 'stroke-dasharray="5 4"'; }
  if (isFocus) { stroke = reading ? "var(--reading)" : "var(--accent)"; fill = "var(--accent-soft)"; sw = 2.5; }
  let s = `<g class="node" data-id="${esc(id)}" tabindex="0" role="button" aria-label="${esc(n.t)}" transform="translate(${x},${y})" opacity="${opacity}">`;
  if (n.anchor) s += `<rect x="${-b.w / 2 - 4}" y="${-b.h / 2 - 4}" width="${b.w + 8}" height="${b.h + 8}" rx="9" fill="none" stroke="${stroke}" stroke-width="1.2"/>`;
  s += `<rect class="box" x="${-b.w / 2}" y="${-b.h / 2}" width="${b.w}" height="${b.h}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${dash}/>`;
  if (n.map) s += `<rect x="${-b.w / 2 + 2.5}" y="${-b.h / 2 + 4}" width="3.5" height="${b.h - 8}" rx="1.5" fill="${mapColor[n.map]}"><title>${esc(WORLD_MAPS[n.map])}</title></rect>`;
  const top = -((b.lines.length - 1) * b.lh) / 2;
  b.lines.forEach((ln, i) => { s += `<text x="0" y="${top + i * b.lh}" dy="0.35em" text-anchor="middle" font-family="IBM Plex Sans, system-ui, sans-serif" font-size="${b.fs}" font-weight="${isFocus ? 600 : 500}" fill="${tcol}" ${tstyle} ${n.replaced ? 'text-decoration="line-through"' : ""}>${esc(ln)}</text>`; });
  if (act === "arriving") s += `<circle cx="${-b.w / 2 + 1}" cy="${-b.h / 2 + 1}" r="4.5" fill="var(--accent)" stroke="var(--panel)" stroke-width="1.5"><title>new in the latest pass</title></circle>`;
  /* the line above the box: what kind of thing this is, and which map it is on when that is not the map in view */
  const elsewhere = mapOf(n) !== mapSel ? WORLD_MAPS[mapOf(n)].toUpperCase() : "";
  const tag = (word, col) => `<text x="0" y="${-b.h / 2 - 8}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="10" letter-spacing="1" fill="${col}">${esc([word, elsewhere].filter(Boolean).join(" · "))}</text>`;
  if (n.ruledOut) s += tag("RULED OUT", "var(--warn)");
  else if (n.replaced) s += tag("REPLACED", "var(--warn)");
  else if (n.kept) s += tag("READING YOU KEPT", "var(--reading)");
  else if (!n.stuck) s += tag("MY READING", "var(--reading)");
  else if (elsewhere) s += tag("", "var(--muted)"); /* a supposed item needs no word: its dashed outline says so */
  const slots = Math.min((n.slots || []).length, 5);
  for (let i = 0; i < slots; i++) { const sx = (i - (slots - 1) / 2) * 14; s += `<circle cx="${sx}" cy="${b.h / 2 + 9}" r="4" fill="var(--panel)" stroke="var(--open)" stroke-width="1.5"><title>open question</title></circle>`; }
  if (extra > 0) s += `<text x="${b.w / 2 + 6}" y="${b.h / 2 - 2}" font-family="IBM Plex Mono, monospace" font-size="11" fill="var(--muted)">+${extra}</text>`;
  return s + "</g>";
}

/* One step out from the focus, on an ellipse. The layout for "what was said". */
function nearLayout(f) {
  const W = 960, H = 600, cx = 480, cy = 300, RX = 320, RY = 215;
  const nb = neighbors(S, f).slice(0, 12), count = nb.length;
  const nodes = nb.map((x, i) => {
    const ang = (-Math.PI / 2) + (i * (2 * Math.PI / Math.max(count, 1))) + (count % 2 ? 0 : Math.PI / count / 2);
    return { id: x.other, x: cx + RX * Math.cos(ang), y: cy + RY * Math.sin(ang), b: boxFor(x.other, false) };
  });
  return { W, H, cx, cy, nodes, edges: nb.map(x => ({ l: x.l, label: true })), loose: [] };
}
/* Two steps out from the focus within one world map, each second-ring item
   set beside the first-ring item it hangs from. The focus's own links into
   other maps are shown in the first ring; other maps are not walked. */
function worldLayout(f, m) {
  const W = 1160, H = 720, cx = 580, cy = 360, OUT = [165, 115], FAN = 1.1;
  const kids = { [f]: [] }, depth = { [f]: 0 }, q = [f];
  while (q.length) {
    const cur = q.shift();
    if (depth[cur] >= 2 || (cur !== f && mapOf(S.nodes[cur]) !== m)) continue;
    for (const { other } of neighbors(S, cur)) {
      if (other in depth || (depth[cur] >= 1 && mapOf(S.nodes[other]) !== m)) continue;
      depth[other] = depth[cur] + 1; kids[other] = []; kids[cur].push(other); q.push(other);
    }
  }
  const weight = id => Math.max(1, kids[id].length);
  const total = kids[f].reduce((a, id) => a + weight(id), 0) || 1;
  const R1 = kids[f].length > 5 ? [330, 200] : [300, 185];
  const nodes = []; let a0 = -Math.PI / 2 - (kids[f].length ? Math.PI * weight(kids[f][0]) / total : 0);
  for (const id of kids[f]) {
    const span = 2 * Math.PI * weight(id) / total, mid = a0 + span / 2;
    const px = cx + R1[0] * Math.cos(mid), py = cy + R1[1] * Math.sin(mid);
    nodes.push({ id, x: px, y: py, b: boxFor(id, false, 130) });
    /* second ring: fanned outward from the item it hangs from */
    kids[id].forEach((k, i) => { const ang = mid + (i - (kids[id].length - 1) / 2) * FAN; nodes.push({ id: k, x: px + OUT[0] * Math.cos(ang), y: py + OUT[1] * Math.sin(ang), b: boxFor(k, false, 130) }); });
    a0 += span;
  }
  const edges = S.links.filter(l => l.a in depth && l.b in depth).map(l => ({ l, label: l.a === f || l.b === f }));
  const loose = Object.keys(S.nodes).filter(id => mapOf(S.nodes[id]) === m && !(id in depth));
  return { W, H, cx, cy, nodes, edges, loose };
}

function renderMapSel() {
  const counts = {}; for (const n of Object.values(S.nodes)) counts[mapOf(n)] = (counts[mapOf(n)] || 0) + 1;
  $("#mapsel").innerHTML = Object.entries(WORLD_MAPS).map(([k, name]) => `<button class="seg m-${k}" role="tab" type="button" data-map="${k}" aria-selected="${k === mapSel}">${esc(name)}<span class="segn">${counts[k] || 0}</span></button>`).join("");
}
function addItemForm(hasFocus) {
  const eg = { env: "e.g. The store is a ten-minute walk away.", mind: "e.g. He is thinking about something else.", moral: "e.g. You do not waste what you have." }[mapSel];
  return `<form class="inline" id="additem"><label class="small" for="itemtext">Add to ${esc(mapWord[mapSel])}</label>
    <input class="input" id="itemtext" autocomplete="off" placeholder="${esc(eg)}">
    <div class="row"><label class="radio"><input type="radio" name="itemhow" value="supposed" checked> supposed</label><label class="radio"><input type="radio" name="itemhow" value="given"> given</label></div>
    ${hasFocus ? `<div class="row"><label class="small" for="itemdir">Link</label><select id="itemdir">${joinDirs.map(([v, w]) => `<option value="${v}">${esc(w)}</option>`).join("")}</select><label class="small" for="itemlabel">saying</label><select id="itemlabel">${WORLD_LINKS.within.map(w => `<option>${esc(w)}</option>`).join("")}</select></div>` : ""}
    <div class="actions"><button class="btn primary" type="submit" ${isRewound() ? "disabled" : ""}>Add it</button></div></form>`;
}
function renderMap() {
  renderMapSel();
  const world = mapSel !== "said";
  const f = focus && S.nodes[focus] && mapOf(S.nodes[focus]) === mapSel ? focus : null;
  $("#maploose").hidden = true;
  if (!f) {
    svg.setAttribute("viewBox", "0 0 960 600");
    if (world) {
      $("#focuslabel").innerHTML = `Nothing on the map of <b>${esc(mapWord[mapSel])}</b> yet`;
      svg.innerHTML = `<text x="480" y="280" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="18" fill="var(--muted)">Nothing on this map yet.</text><text x="480" y="310" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="14" fill="var(--muted)">Add the first item in the panel, or run a script.</text>`;
      $("#panel").innerHTML = `<div class="sec"><h3>${esc(WORLD_MAPS[mapSel])}</h3><p class="small" style="margin:0">Each item is either given or supposed. A supposition stays dashed until it is confirmed or ruled out.</p></div>` + addItemForm(false);
    } else {
      $("#focuslabel").innerHTML = stream.steps.length && cursor === 0 ? "Step 0: the empty map before anything was added" : "This stream is empty";
      svg.innerHTML = `<text x="480" y="280" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="18" fill="var(--muted)">Nothing on the map yet.</text><text x="480" y="310" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="14" fill="var(--muted)">Open “Add text” and paste something to start.</text>`;
      $("#panel").innerHTML = `<div class="empty"><b>An empty map</b><span>Paste or drop text in Add text. Claude pulls out your ideas and links them here.</span><button class="btn primary" data-goadd="1">Add text</button></div>`;
    }
    fixVars(svg);
    return;
  }
  const lay = world ? worldLayout(f, mapSel) : nearLayout(f);
  svg.setAttribute("viewBox", `0 0 ${lay.W} ${lay.H}`);
  $("#focuslabel").innerHTML = world ? `The map of <b>${esc(mapWord[mapSel])}</b>, around <b>${esc(S.nodes[f].t)}</b>` : `Showing the neighborhood of <b>${esc(S.nodes[f].t)}</b>`;
  const fb = boxFor(f, true);
  const at = { [f]: { x: lay.cx, y: lay.cy, b: fb } };
  for (const p of lay.nodes) at[p.id] = p;
  let s = `<defs>
    <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--muted)"/></marker>
    <marker id="arrR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--reading)"/></marker>
  </defs><g class="fade-in">`;
  const slotPad = id => (S.nodes[id].slots || []).length ? 16 : 0;
  let labels = "";
  for (const { l, label } of lay.edges) {
    const A = at[l.a], B = at[l.b];
    const [x1, y1] = edgePt(A.x, A.y, A.b.w, A.b.h + slotPad(l.a), B.x, B.y);
    const [x2, y2] = edgePt(B.x, B.y, B.b.w, B.b.h, A.x, A.y);
    const col = l.read ? "var(--reading)" : "var(--muted)";
    const soft = l.read || S.nodes[l.a].supposed || S.nodes[l.b].supposed;
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="1.3" ${soft ? 'stroke-dasharray="5 4"' : ""} marker-end="url(#${l.read ? "arrR" : "arr"})"><title>${esc(S.nodes[l.a].t)} · ${esc(l.f)} · ${esc(S.nodes[l.b].t)}</title></line>`;
    if (!label) continue;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; const lw = textW(l.f, '400 11px "IBM Plex Mono", monospace') + 10;
    labels += `<g transform="translate(${mx},${my})"><rect x="${-lw / 2}" y="-9" width="${lw}" height="18" rx="3" fill="var(--panel)" stroke="var(--line)"/><text x="0" y="0" dy="0.35em" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="${col}">${esc(l.f)}</text></g>`;
  }
  for (const p of lay.nodes) { const extra = neighbors(S, p.id).filter(x => !(x.other in at)).length; s += nodeSVG(p.id, p.x, p.y, p.b, false, extra); }
  s += nodeSVG(f, lay.cx, lay.cy, fb, true, neighbors(S, f).filter(x => !(x.other in at)).length);
  s += labels; /* last, so a box never hides the word on a link */
  if (!lay.nodes.length) s += `<text x="${lay.cx}" y="${lay.cy + fb.h / 2 + 44}" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="13" fill="var(--muted)">${world ? "Not linked to anything yet. Add an item in the panel, or link it with a script." : "Not connected to anything yet. Check Loose Ends for suggested links."}</text>`;
  s += "</g>";
  svg.innerHTML = s; fixVars(svg);
  if (lay.loose.length) {
    $("#maploose").hidden = false;
    $("#maploose").innerHTML = `<span>On this map, not within two links of this item:</span>` + lay.loose.map(id => `<button class="linkbtn" data-go="${esc(id)}">${esc(clip(S.nodes[id].t, 48))}</button>`).join("");
  }
  renderPanel();
}
svg.addEventListener("click", e => { const g = e.target.closest("[data-id]"); if (g && g.dataset.id !== focus) setFocus(g.dataset.id); });
svg.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { const g = e.target.closest("[data-id]"); if (g) { e.preventDefault(); setFocus(g.dataset.id); } } });
function setFocus(id) { if (!S.nodes[id]) return; focus = id; mapSel = mapOf(S.nodes[id]); renderMap(); const g = svg.querySelector(`[data-id="${CSS.escape(id)}"]`); if (g) g.focus({ preventScroll: true }); }
function setMap(m) { if (!WORLD_MAPS[m]) return; mapSel = m; if (!(focus && S.nodes[focus] && mapOf(S.nodes[focus]) === m)) focus = mapMiddle(S, m) || focus; renderMap(); }
$("#mapsel").addEventListener("click", e => { const b = e.target.closest("[data-map]"); if (b) setMap(b.dataset.map); });
$("#maploose").addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b) setFocus(b.dataset.go); });

function renderPanel() {
  const n = S.nodes[focus]; const nb = neighbors(S, focus); const act = actOf(S, n);
  const how = n.ruledOut ? "ruled out" : n.supposed ? "supposed" : n.confirmedOn ? "confirmed" : "given";
  let h = `<div class="meta">`;
  if (n.map) h += `<span class="chip m-${esc(n.map)}">${esc(WORLD_MAPS[n.map])}</span><span class="chip${n.supposed ? " supposed" : n.ruledOut ? " replaced" : " mine"}">${how}</span>`;
  else if (n.kept) h += `<span class="chip kept">reading you kept</span>`;
  else if (n.stuck) h += `<span class="chip mine">${n.src === "quoted_text" ? "source text" : "your words"}</span>`;
  else h += `<span class="chip reading">my reading</span>`;
  if (n.anchor) h += `<span class="chip">anchor</span>`;
  if (!n.map) h += `<span class="chip">${esc(n.kind)}</span>`;
  if (n.map) { /* a world item says how it stands, not how lately it was spoken of */ }
  else if (act === "replaced") h += `<span class="chip replaced">replaced</span>`;
  else if (act !== "anchor") h += `<span class="chip state-${act}">${esc(actLabel(act))}</span>`;
  h += `</div><h2>${esc(n.t)}</h2>`;
  if (n.stuck && !n.kept) {
    const head = n.map ? how[0].toUpperCase() + how.slice(1) : n.src === "quoted_text" ? "Source text" : "Your words";
    h += `<div class="sec"><h3>${head}</h3><p class="words${n.src === "quoted_text" ? " quote" : ""}${n.supposed ? " supposed" : ""}">${esc(n.words)}</p><div class="src">`;
    if (n.cite) h += `<span>${esc(n.cite)}</span><span>matched verbatim</span>`;
    else h += `<span>${esc(n.date || "")}</span><span>${esc(n.at || "")}</span><span>${esc(n.file || "")}</span>`;
    h += `</div>`;
    if (n.also && n.also.length) { h += `<div class="also">` + n.also.map(a => `<p>“${esc(clip(a.words, 400))}”</p><div class="src"><span>said again · ${esc(a.date)}</span><span>${esc(a.source)}</span></div>`).join("") + `</div>`; }
    if (n.supposed && !n.ruledOut) h += `<p class="small" style="margin:8px 0 0">A supposition. It stays dashed until it is confirmed or ruled out.</p><div class="actions" style="margin-top:8px"><button class="btn primary" data-confirm="1">Confirm it</button><button class="btn danger" data-ruleout="1">Rule it out</button></div>`;
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
  h += nb.length ? `<ul class="plain">${nb.map(({ l, other }) => `<li><span class="small">${esc(l.a === focus ? l.f : "← " + l.f)}</span> <button class="linkbtn" data-go="${esc(other)}">${esc(S.nodes[other].t)}</button>${mapOf(S.nodes[other]) !== mapOf(n) ? ` <span class="small">(${esc(WORLD_MAPS[mapOf(S.nodes[other])].toLowerCase())})</span>` : ""}</li>`).join("")}</ul>` : `<p class="small" style="margin:0">Nothing yet.</p>`;
  h += `</div>`;
  if (!n.anchor && !n.map) {
    const tr = traceToAnchor(S, focus);
    h += `<div class="sec"><h3>Traces back to</h3>`;
    if (tr && tr.length) h += `<div class="trace">` + tr.map(s => (s.via ? `<span class="via">${esc(s.via)} →</span>` : "") + `<span class="step${S.nodes[s.id].anchor ? " anchor" : ""}">${esc(S.nodes[s.id].t)}</span>`).join("") + `</div>`;
    else h += `<p class="small" style="margin:0">${Object.values(S.nodes).some(x => x.anchor) ? "No path to an anchor yet. That's allowed." : "No anchors in this stream. Pin one if you want everything traced back to it."}</p>`;
    h += `</div>`;
  }
  h += `<div class="actions"><button class="btn" data-draft="1">Draft from here</button>${n.stuck && !n.kept && !n.ruledOut ? `<button class="btn" data-anchor="1">${n.anchor ? "Unpin anchor" : "Make this an anchor"}</button>` : ""}</div>`;
  if (n.map) h += addItemForm(true);
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
  else if (t.dataset.confirm) { if (await recordAction({ type: "confirm", id }, "confirm")) { rebuild(); toast("Confirmed. It is drawn solid now."); } }
  else if (t.dataset.ruleout) { if (await recordAction({ type: "ruleout", id }, "ruleout")) { focus = id; rebuild(); toast("Ruled out. It is kept, struck through."); } }
});
/* Add an item to the map in view, joined to the item in focus. Two steps: the item, then the link. */
$("#panel").addEventListener("submit", async e => {
  if (e.target.id !== "additem") return;
  e.preventDefault();
  const text = entered($("#itemtext")); if (!text) { $("#itemtext").focus(); return; }
  const supposed = (e.target.querySelector("input[name=itemhow]:checked") || {}).value !== "given";
  const dir = $("#itemdir") ? $("#itemdir").value : "none", f = $("#itemlabel") ? $("#itemlabel").value : "";
  const map = mapSel, from = focus && S.nodes[focus] && mapOf(S.nodes[focus]) === map ? focus : null, id = newId("w");
  if (!await recordAction({ type: "item", id, map, text, supposed }, "item")) return;
  if (from && dir !== "none" && f) await recordAction(dir === "out" ? { type: "link", a: from, b: id, f } : { type: "link", a: id, b: from, f }, "link");
  if (!from) focus = id;
  rebuild(); toast(`Added to ${mapWord[map]}.`);
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
    if (x.stuck && !x.kept) { const cite = x.cite || [x.map ? `${WORLD_MAPS[x.map]}, ${x.supposed ? "supposed" : "given"}` : "", x.date || "", x.file || ""].filter(Boolean).join(" · "); html += `<blockquote>${esc(x.words)}<cite>${esc(cite)}</cite></blockquote>`; md += `> ${x.words}\n> (${cite})\n\n`; }
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

/* ─────────────────────────────────────────────
   File: src/client/75-timeline.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   Being in time: the most active ideas as lanes, pass by pass. */
function renderTimeline() {
  const t = $("#timeline"); const n = S.ingests;
  const cand = Object.entries(S.nodes).filter(([, x]) => !x.replaced && !x.anchor);
  if (!n || !cand.length) { t.setAttribute("viewBox", "0 0 960 120"); t.innerHTML = `<text x="480" y="60" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="14" fill="var(--muted)">No passes yet. Add text to see ideas arrive, settle, and fade.</text>`; fixVars(t); return; }
  const lanes = cand.map(([id, x]) => ({ id, x, score: x.touches.length * 3 + degree(S, id) + (x.stuck ? 1 : 0) })).sort((a, b) => b.score - a.score).slice(0, 9)
    .sort((a, b) => Math.min(...a.x.touches) - Math.min(...b.x.touches));
  const LX = 190, RXX = 850, top = 34, lh = 52, W = 960, H = top + lanes.length * lh + 30;
  t.setAttribute("viewBox", `0 0 ${W} ${H}`);
  const xs = k => n === 1 ? (LX + RXX) / 2 : LX + (RXX - LX) * k / (n - 1);
  const val = (x, k) => { let v = 0; for (const tt of x.touches) { v += k >= tt ? Math.exp(-(k - tt) / 1.6) : Math.exp(-(tt - k) * 5); } return Math.min(1, v / 1.3); };
  let s = "";
  const every = Math.max(1, Math.ceil(n / 8));
  S.passes.forEach((p, k) => { if (k % every && k !== n - 1) return; s += `<line x1="${xs(k)}" y1="${top - 8}" x2="${xs(k)}" y2="${H - 24}" stroke="var(--line)"/><text x="${xs(k)}" y="${top - 14}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="var(--muted)"><title>${esc(p.source)}</title>${esc(p.date || "#" + (k + 1))}</text>`; });
  s += `<text x="${xs(n - 1)}" y="${H - 8}" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="11" fill="var(--accent)">this step</text>`;
  lanes.forEach((ln, i) => {
    const y0 = top + i * lh, base = y0 + lh - 10, hmax = lh - 16;
    const pts = []; const steps = n === 1 ? 1 : (n - 1) * 6;
    for (let j = 0; j <= steps; j++) { const k = n === 1 ? 0 : j / 6; pts.push([n === 1 ? LX + (RXX - LX) * j : xs(k), base - val(ln.x, k) * hmax]); }
    const line = pts.map((p, j) => (j ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
    const area = line + ` L${pts[pts.length - 1][0]},${base} L${pts[0][0]},${base} Z`;
    const act = actOf(S, ln.x); const col = act === "arriving" ? "var(--accent)" : (ln.x.stuck && !ln.x.kept ? "var(--ink)" : "var(--reading)");
    const op = act === "quiet" || act === "fading" ? 0.5 : 1; const last = pts[pts.length - 1];
    s += `<g class="lane" data-go="${esc(ln.id)}" tabindex="0" role="button" aria-label="${esc(ln.x.t)}, ${esc(actLabel(act))}. Open on the map.">
      <rect class="lanebg" x="0" y="${y0}" width="${W}" height="${lh}" fill="transparent" rx="4"/>
      <text x="8" y="${base - 12}" font-family="IBM Plex Sans, sans-serif" font-size="13" font-weight="500" fill="var(--ink)">${esc(clip(ln.x.t, 26))}</text>
      <line x1="${LX}" y1="${base}" x2="${RXX}" y2="${base}" stroke="var(--line)"/>
      <path d="${area}" fill="${col}" opacity="${0.14 * op}"/>
      <path d="${line}" fill="none" stroke="${col}" stroke-width="1.6" opacity="${op}"/>
      <circle cx="${last[0]}" cy="${last[1]}" r="3.5" fill="${col}" opacity="${op}"/>
      <text x="${RXX + 12}" y="${base - 12}" font-family="IBM Plex Mono, monospace" font-size="11" fill="var(--muted)">${esc(actLabel(act))}</text>
    </g>`;
  });
  t.innerHTML = s; fixVars(t);
}
$("#timeline").addEventListener("click", e => { const l = e.target.closest("[data-go]"); if (l) { setFocus(l.dataset.go); showView("map"); } });
$("#timeline").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { const l = e.target.closest("[data-go]"); if (l) { e.preventDefault(); setFocus(l.dataset.go); showView("map"); } } });

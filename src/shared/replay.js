/* ─────────────────────────────────────────────
   File: src/shared/replay.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   The map is a projection of the stream. State = replay(steps[0..cursor)).
   This reducer runs on the server (to give the model the current map) and
   in the browser (to draw it). It must stay pure: no DOM, no fetch, no
   imports. The client build inlines this file and strips the exports.

   Step shapes:
     { kind:"ingest", seq, at, date, source, text, model, tier, result }
     { kind:"action", seq, at, date, source, action:{type, id?, flagId?, choice?} }
   result shape (validated by normalize.js before it is ever stored):
     { add:{id:node}, touch:[{id, also, slots}], replace:[{id, by}],
       links:[{a,b,f,read}], flags:[flag], question:"" }                   */

export const LINK_LABELS = ["example of", "leads to", "refines", "explains", "extends to", "includes", "pairs with", "tension with", "replaces", "echoes", "raises", "answers", "traces to", "connects to", "my reading"];
/* Links a traceback may walk. A path through a contradiction or a
   replacement is not a derivation. */
export const DERIVATION_LABELS = LINK_LABELS.filter(l => l !== "tension with" && l !== "replaces");

export function emptyState() {
  return { nodes: {}, links: [], flags: [], outcomes: {}, ingests: 0, passes: [], question: null };
}

export function clone(o) { return JSON.parse(JSON.stringify(o)); }

export function replay(steps) {
  const st = emptyState();
  for (const step of steps) applyStep(st, step);
  return st;
}

export function applyStep(st, step) {
  if (!step) return;
  if (step.kind === "ingest") applyResult(st, step.result || {}, step);
  else if (step.kind === "action") applyAction(st, step);
}

export function applyResult(st, r, meta) {
  const idx = st.ingests++;
  st.passes.push({ date: meta.date, source: meta.source });
  for (const [id, n] of Object.entries(r.add || {})) {
    st.nodes[id] = Object.assign(clone(n), { touches: [idx], also: [], history: [...(n.history || [])], slots: [...(n.slots || [])] });
  }
  for (const t of r.touch || []) {
    const n = st.nodes[t.id];
    if (!n) continue;
    if (!n.touches.includes(idx)) n.touches.push(idx);
    if (t.also) n.also.push(t.also);
    for (const s of t.slots || []) if (!n.slots.includes(s)) n.slots.push(s);
  }
  for (const rp of r.replace || []) { const n = st.nodes[rp.id]; if (n) n.replaced = true; }
  for (const l of r.links || []) {
    if (st.nodes[l.a] && st.nodes[l.b] && !st.links.some(x => x.a === l.a && x.b === l.b)) st.links.push({ ...l });
  }
  for (const f of r.flags || []) st.flags.push({ ...f, nodes: [...(f.nodes || [])] });
  if (r.question) st.question = { text: r.question, source: meta.source };
}

export function applyAction(st, step) {
  const a = step.action || {};
  const n = a.id ? st.nodes[a.id] : null;
  if (a.type === "keep" && n) {
    /* A kept reading becomes stuck (it can no longer be rewired) but it
       stays the machine's phrasing. It is never shown as the person's words. */
    n.stuck = true; n.kept = true; n.src = "user_confirmed"; n.keptOn = step.date;
    st.links.forEach(l => {
      if (l.a === a.id || l.b === a.id) {
        const other = st.nodes[l.a === a.id ? l.b : l.a];
        if (other && other.stuck !== false) { l.read = false; if (l.f === "my reading") l.f = "leads to"; }
      }
    });
  } else if (a.type === "discard" && n) {
    delete st.nodes[a.id];
    st.links = st.links.filter(l => l.a !== a.id && l.b !== a.id);
    st.flags.forEach(f => { f.nodes = f.nodes.filter(x => x !== a.id); });
  } else if (a.type === "anchor" && n) {
    n.anchor = !n.anchor;
  } else if (a.type === "flag") {
    const f = st.flags.find(x => x.id === a.flagId);
    if (!f) return;
    let out = "Noted.";
    switch (a.choice) {
      case "accept":
        for (const id of f.nodes) {
          const m = st.nodes[id];
          if (!m) continue;
          m.history.push(`${step.date}: transcribed “${f.phrase}”, confirmed as “${f.suggestion}”. Your original words stay as written.`);
          m.slots = m.slots.filter(s => !(f.phrase && s.includes(f.phrase)));
        }
        out = `Confirmed “${f.suggestion}”. The original text stays as written, with a note.`; break;
      case "keep": out = "Kept as written."; break;
      case "link": {
        const [x, y] = f.nodes.filter(id => st.nodes[id]);
        if (x && y && !st.links.some(l => (l.a === x && l.b === y) || (l.a === y && l.b === x))) st.links.push({ a: x, b: y, f: "echoes", read: false });
        out = x && y ? "Linked on the map." : "Couldn't link: one of the ideas is gone."; break;
      }
      case "unrelated": out = "Marked not related."; break;
      case "talk": out = "Picked up as a question."; break;
      case "later": out = "Left for later."; break;
      case "both": out = "Kept both. Marked as a tension you're holding on purpose."; break;
      case "drop": out = "Dropped. It stays in the history."; break;
      default: out = "Noted.";
    }
    st.outcomes[f.id] = out;
  }
}

/* ---- queries over a state ---- */

export function degree(st, id) { return st.links.filter(l => l.a === id || l.b === id).length; }

export function neighbors(st, id) {
  return st.links.filter(l => (l.a === id || l.b === id) && st.nodes[l.a] && st.nodes[l.b]).map(l => ({ l, other: l.a === id ? l.b : l.a }));
}

export function pickFocus(st) {
  const ids = Object.keys(st.nodes).filter(id => !st.nodes[id].replaced);
  if (!ids.length) return null;
  const last = st.ingests - 1;
  const recent = ids.filter(id => st.nodes[id].touches.includes(last) && st.nodes[id].stuck);
  const pool = recent.length ? recent : ids;
  return pool.sort((a, b) => degree(st, b) - degree(st, a))[0];
}

/* Come, stay, leave. Measured in passes for now; the real app will also
   weigh calendar time, so a 14-file drop does not fade everything. */
export function actOf(st, n) {
  if (n.anchor) return "anchor";
  if (n.replaced) return "replaced";
  const last = Math.max(...n.touches);
  const age = st.ingests - 1 - last;
  if (age <= 0) return n.touches.length > 1 ? "settled" : "arriving";
  if (age <= 2) return "settled";
  if (age <= 4) return "fading";
  return "quiet";
}
export const actLabel = a => (a === "quiet" ? "gone quiet" : a);

/* Shortest derivation path from a node to any anchor. Skips replaced nodes
   and never walks a "tension with" or "replaces" link. null = the node is
   itself an anchor; [] = no path. */
export function traceToAnchor(st, start) {
  if (!st.nodes[start]) return [];
  if (st.nodes[start].anchor) return null;
  const prev = { [start]: null };
  const q = [start];
  while (q.length) {
    const cur = q.shift();
    if (cur !== start && st.nodes[cur].anchor) {
      const path = [];
      let c = cur;
      while (c !== null) { path.unshift(c); c = prev[c] ? prev[c].from : null; }
      return path.map((id, i) => ({ id, via: i ? prev[id].label : null }));
    }
    for (const { l, other } of neighbors(st, cur)) {
      if (other in prev || st.nodes[other].replaced || !DERIVATION_LABELS.includes(l.f)) continue;
      prev[other] = { from: cur, label: l.f };
      q.push(other);
    }
  }
  return [];
}

/* The listing the model sees of what is already on the map. Most recently
   touched first; capped so the prompt stays bounded. */
export function mapListing(st, cap = 160) {
  const ids = Object.keys(st.nodes).sort((a, b) => Math.max(...st.nodes[b].touches) - Math.max(...st.nodes[a].touches)).slice(0, cap);
  if (!ids.length) return "(empty: this is the first text)";
  return ids.map(id => {
    const n = st.nodes[id];
    return `${id} | ${n.stuck && !n.kept ? n.kind : "reading"}${n.anchor ? " | ANCHOR" : ""}${n.replaced ? " | replaced" : ""} | ${n.t}`;
  }).join("\n");
}

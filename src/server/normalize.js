/* ─────────────────────────────────────────────
   File: src/server/normalize.js
   File Version: 0.2.0
   ─────────────────────────────────────────────
   Turn the model's raw answer into a step result the replay reducer
   accepts. This is the brake on the flattering mirror: an idea with no
   span citation is dropped, and an idea's words are assembled verbatim
   from the spans it cites, never from anything the model wrote. The same
   rule holds for goals and moves read in the text. Pure. */

import { spanLabel } from "../shared/spans.js";
import { LINK_LABELS } from "../shared/replay.js";

export const KINDS = ["idea", "image", "question", "quote", "term", "person"];
export const FLAG_TYPES = ["garble", "unanswered", "gap", "tension", "correction", "echo"];
export const LIMITS = { ideas: 30, readings: 3, flags: 12, spansPerIdea: 12, slotsPerIdea: 2, goals: 6, movesPerGoal: 4 };

const clip = (s, n) => { s = String(s ?? "").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };

/* nodes: the existing map (state.nodes) so "match" and link targets resolve.
   goals: the existing goals (state.goals) so a move can land on one.
   Returns { result, dropped } where dropped counts uncited ideas, goals and
   moves. */
export function normalize(raw, spans, source, stepId, date, nodes = {}, goals = {}) {
  const out = { add: {}, touch: [], replace: [], links: [], flags: [], goals: [], question: "" };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { result: out, dropped: 0 };
  const keyMap = {};
  const pendingReplace = [];
  let ni = 0, ri = 0, gi = 0, dropped = 0;
  const cited = list => [...new Set((Array.isArray(list) ? list : []).map(Number).filter(x => Number.isInteger(x) && x >= 0 && x < spans.length))].sort((a, b) => a - b).slice(0, LIMITS.spansPerIdea);

  for (const it of (Array.isArray(raw.ideas) ? raw.ideas : []).slice(0, LIMITS.ideas)) {
    if (!it || typeof it !== "object") continue;
    const key = String(it.key ?? "");
    const sp = cited(it.spans);
    if (!sp.length) { dropped++; continue; }
    const words = sp.map(i => spans[i]).join(" ");
    const slots = (Array.isArray(it.slots) ? it.slots : []).map(x => clip(x, 160)).filter(Boolean).slice(0, LIMITS.slotsPerIdea);
    const match = it.match != null && nodes[String(it.match)] ? String(it.match) : null;
    if (match) { keyMap[key] = match; out.touch.push({ id: match, also: { words, date, source }, slots }); continue; }
    const id = `${stepId}-${++ni}`;
    keyMap[key] = id;
    out.add[id] = { t: clip(it.title || words, 80), kind: KINDS.includes(it.kind) ? it.kind : "idea", stuck: true, src: "user_said", words, date, at: spanLabel(sp), file: source, slots, history: [] };
    if (it.replaces != null) pendingReplace.push([id, String(it.replaces)]);
  }

  const resolve = k => { k = String(k ?? ""); return keyMap[k] || (nodes[k] ? k : null); };

  for (const r of (Array.isArray(raw.readings) ? raw.readings : []).slice(0, LIMITS.readings)) {
    if (!r || typeof r !== "object") continue;
    const basis = [...new Set((Array.isArray(r.basis) ? r.basis : []).map(resolve).filter(Boolean))];
    if (!basis.length) continue;
    const id = `${stepId}-r${++ri}`;
    keyMap[String(r.key ?? "")] = id;
    out.add[id] = { t: clip(r.title || r.text, 80), kind: "idea", stuck: false, src: "inferred", reading: clip(r.text || r.title, 400), basis, slots: [], history: [] };
  }

  for (const [id, old] of pendingReplace) {
    const o = resolve(old);
    if (!o || o === id) continue;
    const oldNode = out.add[o] || nodes[o];
    if (!oldNode) continue;
    if (out.add[o]) out.add[o].replaced = true; else out.replace.push({ id: o, by: id });
    out.add[id].history.push(`${date}: replaced “${oldNode.t}”. Both versions are kept.`);
    out.links.push({ a: id, b: o, f: "replaces", read: false });
  }

  const isReading = x => (out.add[x] && out.add[x].stuck === false) || (nodes[x] && nodes[x].stuck === false);
  const seen = new Set(out.links.map(l => l.a + ">" + l.b));
  for (const l of Array.isArray(raw.links) ? raw.links : []) {
    if (!l || typeof l !== "object") continue;
    const a = resolve(l.from), b = resolve(l.to);
    if (!a || !b || a === b) continue;
    if (seen.has(a + ">" + b) || seen.has(b + ">" + a)) continue;
    seen.add(a + ">" + b);
    let f = String(l.label || "").toLowerCase().trim();
    if (!LINK_LABELS.includes(f) || f === "my reading") f = "connects to";
    if (f === "traces to" && !((nodes[b] && nodes[b].anchor) || (nodes[a] && nodes[a].anchor))) f = "connects to";
    out.links.push({ a, b, f, read: isReading(a) || isReading(b) });
  }
  for (const [id, n] of Object.entries(out.add)) { /* every reading hangs off its basis */
    if (n.stuck === false && !out.links.some(l => l.a === id || l.b === id)) out.links.push({ a: n.basis[0], b: id, f: "my reading", read: true });
  }

  let fi = 0;
  for (const f of Array.isArray(raw.flags) ? raw.flags : []) {
    if (!f || typeof f !== "object" || !FLAG_TYPES.includes(f.type)) continue;
    if (fi >= LIMITS.flags) break;
    out.flags.push({
      id: `${stepId}-f${++fi}`, type: f.type,
      text: clip(f.text || f.question || "", 220),
      detail: clip(`${date} · ${source}${f.detail ? ". " + f.detail : ""}`, 300),
      nodes: [...new Set((Array.isArray(f.nodes) ? f.nodes : []).map(resolve).filter(Boolean))],
      phrase: f.phrase ? clip(f.phrase, 80) : "", suggestion: f.suggestion ? clip(f.suggestion, 80) : "",
      question: f.question ? clip(f.question, 300) : ""
    });
  }
  /* Goals and moves read in the text. A goal's words are its cited spans,
     verbatim. A goal that names an existing open goal contributes moves to
     it instead of starting a new one. */
  const liveGoal = k => { k = String(k ?? ""); const g = goals[k]; return g && (g.status === "open" || g.status === "proposed" || g.status === "stuck") ? k : null; };
  for (const g of (Array.isArray(raw.goals) ? raw.goals : []).slice(0, LIMITS.goals)) {
    if (!g || typeof g !== "object") continue;
    const moves = [];
    for (const m of (Array.isArray(g.moves) ? g.moves : []).slice(0, LIMITS.movesPerGoal)) {
      if (!m || typeof m !== "object") continue;
      const msp = cited(m.spans);
      if (!msp.length) { dropped++; continue; }
      moves.push({ text: msp.map(i => spans[i]).join(" "), at: spanLabel(msp) });
    }
    const existing = liveGoal(g.existing);
    if (existing) { if (moves.length) out.goals.push({ id: existing, existing: true, moves }); continue; }
    const sp = cited(g.spans);
    if (!sp.length) { dropped++; continue; }
    const words = sp.map(i => spans[i]).join(" ");
    out.goals.push({ id: `${stepId}-g${++gi}`, t: clip(g.title || words, 80), words, at: spanLabel(sp), ideaId: null, moves });
  }
  if (typeof raw.question === "string") out.question = clip(raw.question, 300);
  return { result: out, dropped };
}

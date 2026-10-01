/* ─────────────────────────────────────────────
   File: src/shared/evidence.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   Evidence (VISION.md §9, E17): what became of the machine's claims,
   counted from the steps of one stream. Every time the person keeps or
   discards a reading, confirms or refuses a goal read in their text, settles
   a loose end, or gives their word on a suggestion, that verdict is already
   a step. This file only counts them. It makes no model call, needs no
   database, and judges nobody: it counts what was proposed and what the
   person did with it.

   Pure, and given a prefix of the steps it gives the counts as they stood
   then, so the Evidence view rewinds with everything else. No imports: the
   client build inlines this file and strips the export keywords. */

export const EVIDENCE_MARKS = ["new", "knew", "wrong"];

/* steps: the stream's steps, in order. Returns the counts. */
export function evidence(steps) {
  const readings = new Map(), goals = new Map(), flags = new Map(), items = new Map(), sugs = new Map(), models = new Map();
  const out = {
    steps: 0, passes: 0, dropped: 0,
    words: { ideas: 0, again: 0, replaced: 0 },
    readings: { made: 0, kept: 0, discarded: 0, open: 0 },
    goals: { read: 0, accepted: 0, rejected: 0, open: 0, moves: 0 },
    loose: { raised: 0, settled: 0, later: 0, open: 0, byType: {}, byChoice: {} },
    suppositions: { made: 0, confirmed: 0, ruledOut: 0, open: 0, given: 0 },
    help: { analyses: 0, suggestions: 0, new: 0, knew: 0, wrong: 0, unmarked: 0 },
    byModel: []
  };
  const modelRow = name => {
    const k = String(name || "not recorded");
    if (!models.has(k)) models.set(k, { model: k, passes: 0, ideas: 0, dropped: 0, readings: 0, kept: 0, discarded: 0, goals: 0, accepted: 0, rejected: 0, suggestions: 0, new: 0, knew: 0, wrong: 0 });
    return models.get(k);
  };
  const list = x => (Array.isArray(x) ? x : []);

  for (const step of list(steps)) {
    if (!step) continue;
    out.steps++;
    if (step.kind === "ingest") {
      const r = step.result && typeof step.result === "object" ? step.result : {};
      const m = modelRow(step.model);
      out.passes++; m.passes++;
      for (const [id, n] of Object.entries(r.add && typeof r.add === "object" ? r.add : {})) {
        if (!n || typeof n !== "object") continue;
        if (n.stuck === false) { if (!readings.has(id)) readings.set(id, { model: m.model, fate: "open" }); }
        else { out.words.ideas++; m.ideas++; if (n.replaced) out.words.replaced++; }
      }
      out.words.again += list(r.touch).length;
      out.words.replaced += list(r.replace).length;
      for (const f of list(r.flags)) if (f && f.id && !flags.has(f.id)) flags.set(f.id, { type: String(f.type || "other"), choice: null, later: false });
      for (const g of list(r.goals)) {
        if (!g || !g.id) continue;
        out.goals.moves += list(g.moves).length;
        if (!g.existing && !goals.has(g.id)) goals.set(g.id, { model: m.model, fate: "open" });
      }
      const d = step.usage && Number.isInteger(step.usage.dropped) ? step.usage.dropped : 0;
      out.dropped += d; m.dropped += d;
      continue;
    }
    if (step.kind !== "action" || !step.action || typeof step.action !== "object") continue;
    const a = step.action;
    switch (a.type) {
      case "keep": { const x = readings.get(a.id); if (x && x.fate === "open") x.fate = "kept"; break; }
      case "discard": { const x = readings.get(a.id); if (x && x.fate === "open") x.fate = "discarded"; break; }
      case "acceptgoal": { const x = goals.get(a.goalId); if (x && x.fate === "open") x.fate = "accepted"; break; }
      case "rejectgoal": { const x = goals.get(a.goalId); if (x && x.fate === "open") x.fate = "rejected"; break; }
      case "flag": {
        const x = flags.get(a.flagId); if (!x) break;
        if (a.choice === "later") x.later = true; else { x.choice = String(a.choice || "ok"); x.later = false; }
        break;
      }
      case "item": {
        if (!a.id || items.has(a.id) || a.map === "said" || !a.map) break;
        items.set(a.id, { supposed: a.supposed !== false, fate: "open" });
        break;
      }
      case "confirm": { const x = items.get(a.id); if (x && x.supposed && x.fate === "open") x.fate = "confirmed"; break; }
      case "ruleout": { const x = items.get(a.id); if (x && x.fate !== "ruledOut") x.fate = "ruledOut"; break; }
      case "analysis": {
        const m = modelRow(a.model);
        out.help.analyses++;
        for (const s of list(a.suggestions)) {
          if (!s || !s.id || !String(s.text || "").trim()) continue;
          sugs.set(a.id + " " + s.id, { model: m.model, mark: null });
        }
        break;
      }
      case "verdict": {
        const x = sugs.get(a.analysisId + " " + a.suggestionId);
        if (x && EVIDENCE_MARKS.includes(a.mark)) x.mark = a.mark;
        break;
      }
      default: break;
    }
  }

  for (const x of readings.values()) {
    const m = modelRow(x.model);
    out.readings.made++; m.readings++;
    if (x.fate === "kept") { out.readings.kept++; m.kept++; } else if (x.fate === "discarded") { out.readings.discarded++; m.discarded++; } else out.readings.open++;
  }
  for (const x of goals.values()) {
    const m = modelRow(x.model);
    out.goals.read++; m.goals++;
    if (x.fate === "accepted") { out.goals.accepted++; m.accepted++; } else if (x.fate === "rejected") { out.goals.rejected++; m.rejected++; } else out.goals.open++;
  }
  for (const x of flags.values()) {
    out.loose.raised++;
    out.loose.byType[x.type] = (out.loose.byType[x.type] || 0) + 1;
    if (x.choice) { out.loose.settled++; out.loose.byChoice[x.choice] = (out.loose.byChoice[x.choice] || 0) + 1; }
    else { out.loose.open++; if (x.later) out.loose.later++; }
  }
  for (const x of items.values()) {
    if (!x.supposed) { out.suppositions.given++; continue; }
    out.suppositions.made++;
    if (x.fate === "confirmed") out.suppositions.confirmed++; else if (x.fate === "ruledOut") out.suppositions.ruledOut++; else out.suppositions.open++;
  }
  for (const x of sugs.values()) {
    const m = modelRow(x.model);
    out.help.suggestions++; m.suggestions++;
    if (x.mark) { out.help[x.mark]++; m[x.mark]++; } else out.help.unmarked++;
  }
  out.byModel = [...models.values()].filter(m => m.passes || m.readings || m.goals || m.suggestions);
  return out;
}

/* True when there is nothing yet for the Evidence view to say. */
export function evidenceEmpty(e) {
  return !e.passes && !e.readings.made && !e.goals.read && !e.loose.raised && !e.help.analyses && !e.suppositions.made && !e.suppositions.given;
}

/* ─────────────────────────────────────────────
   File: src/shared/replay.js
   File Version: 0.8.0
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
       links:[{a,b,f,read}], flags:[flag], goals:[goal], question:"" }

   The state layer (Phil, 2026-09-30): the person's standing facts, the
   goals they put forth, and the moves made toward each goal. A goal is
   reached when the state changes so that the goal is now part of it.
     st.state  {id: {text, date, from:"said"|"reached", goalId?, ended?}}
     st.goals  {id: {text, date, status, proposed, moves:[{date, text, effect}], ...}}
   status: proposed (the machine read it in the text; plastic until the
   person accepts it) | open | reached | stuck | dropped.
   Actions: state, release, goal, acceptgoal, rejectgoal, move, reach, regoal.

   Help analysis (Phil, 2026-09-30): suggestions given the state of play,
   made by the server (src/server/analyze.js) and stored as an action step
   of type "analysis". Only the latest is in view:
     st.analysis  {id, date, model, standing, suggestions:[{id, kind, text, why, about:[{on, id}]}], since, leftOut:[phrases]}
   since counts the steps applied after it, so the page can say it is stale.
   The person can give their word on each suggestion (action "verdict":
   new to me, already knew, or wrong). That marks the suggestion and changes
   nothing else; it is what src/shared/evidence.js counts.

   Arranging a diagram by hand (Phil, 2026-10-01: "I also want to drag a
   single box"). The diagram is drawn around a middle item, and a box can be
   dragged away from where the layout puts it. That is kept, per middle
   item, as a move from the layout's own place (action "place"):
     st.places  {middleId: {boxId: {dx, dy}}}
   It changes how the map is drawn and nothing about what it says.
   {type:"place", around, reset:true} puts that middle's boxes back.

   Answers for a character (Phil, 2026-10-03, the Start tab's Bobby arc):
   each answer the person gives for Bobby is a step, {type:"answer", arc,
   scene, option}, and is kept as given:
     st.answers  [{arc, scene, option, date}]
   What the answers add up to (src/shared/scenes.js) is worked out from
   them when it is wanted and is never stored. An answer is not a change
   in the state of play, so it does not make a Help analysis stale. */

export const LINK_LABELS = ["example of", "leads to", "refines", "explains", "extends to", "includes", "pairs with", "tension with", "replaces", "echoes", "raises", "answers", "traces to", "connects to", "my reading"];
/* Links a traceback may walk. A path through a contradiction or a
   replacement is not a derivation. */
export const DERIVATION_LABELS = LINK_LABELS.filter(l => l !== "tension with" && l !== "replaces");

/* The maps of one world (Phil, 2026-09-30): what was said, and a map each
   for the environment, the mental state, and the assumptions (moral
   presuppositions). An item on a world map is put forth by hand or by a
   script. It is either given or supposed; a supposition can be confirmed
   or ruled out. Items live in st.nodes beside the ideas, with n.map set
   (ideas have none), so one diagram draws them all.
   Actions: item, link, ask, confirm, ruleout. */
export const WORLD_MAPS = { said: "What was said", env: "Environment", mind: "Mental state", moral: "Assumptions" };
export const mapOf = n => (n && n.map) || "said";
export const lastTouch = n => (n.touches && n.touches.length ? Math.max(...n.touches) : -1);
/* How many items a stream's steps put on each world map. Counted from the
   item steps themselves, which is also how the server counts them for the
   stream list (src/server/streams.js), so the two agree. */
export function worldCounts(steps) {
  const c = { env: 0, mind: 0, moral: 0 };
  for (const s of steps || []) { const a = s && s.kind === "action" ? s.action : null; if (a && a.type === "item" && Object.hasOwn(c, a.map)) c[a.map]++; }
  return c;
}

/* The words for a link on the world maps: one list, used by the panel, the
   method document and the tests. "within" joins two items on one map;
   "across" joins maps. A script may still write any words; these are the
   ones the method uses. LINK_LABELS above is a different set, for the links
   the model proposes between ideas read from text. */
export const WORLD_LINKS = {
  within: ["leads to", "rests on", "serves", "allows", "presses", "sharpens", "lets it run", "lacks", "shared with", "within reach of", "by", "takes", "only if", "part of", "blocks", "where it starts"],
  across: ["read as a lack", "read as a want", "read as an ought", "gives rise to", "is who", "is trusted", "makes it worth doing", "limits how", "presses", "carried out as"]
};

/* A move the person reports says whether it brought the goal closer. A move
   the model read in the text says nothing about that: its effect is
   "unsaid", and stays so. No distance is invented. */
export const MOVE_EFFECTS = ["closer", "same", "farther"];
export const UNSAID = "unsaid";

/* Every action the reducer knows, and the test an id must pass before it is
   used as a key. The state's maps have no prototype, so even a hostile id
   such as "__proto__" could only ever be an ordinary key; ids are checked
   as well so that nothing odd is stored. The server uses actionOk() to
   refuse a bad action before it is saved. */
export const ACTION_TYPES = ["keep", "discard", "anchor", "flag", "state", "release", "goal", "acceptgoal", "rejectgoal", "move", "reach", "regoal", "item", "link", "ask", "confirm", "ruleout", "analysis", "verdict", "place", "answer"];
const ID_FIELDS = ["id", "goalId", "stateId", "flagId", "a", "b", "analysisId", "suggestionId", "around", "arc", "scene", "option"];
/* How far a box may be dragged from where the layout draws it, in the layout's units. */
export const PLACE_MAX = 2000;
/* The person's word on one Help analysis suggestion. */
export const VERDICTS = ["new", "knew", "wrong"];
export function safeId(v) { return typeof v === "string" && /^[A-Za-z0-9_.:-]{1,80}$/.test(v) && v !== "__proto__" && v !== "constructor" && v !== "prototype"; }
export function actionOk(a) {
  if (!a || typeof a !== "object" || Array.isArray(a) || !ACTION_TYPES.includes(a.type)) return false;
  return ID_FIELDS.every(k => a[k] === undefined || a[k] === null || safeId(a[k]));
}
const bare = () => Object.create(null);
export const GOAL_STATUSES = ["proposed", "open", "reached", "stuck", "dropped"];

export function emptyState() {
  return { nodes: bare(), links: [], flags: [], outcomes: bare(), ingests: 0, passes: [], question: null, state: bare(), goals: bare(), analysis: null, places: bare(), answers: [] };
}

export function clone(o) { return JSON.parse(JSON.stringify(o)); }

export function replay(steps) {
  const st = emptyState();
  for (const step of steps) applyStep(st, step);
  return st;
}

export function applyStep(st, step) {
  if (!step) return;
  /* A verdict is about the analysis itself, and moving a box is about how the diagram is drawn. Neither is a change in the state of play, so neither makes the analysis stale. */
  const aside = step.kind === "action" && step.action && (step.action.type === "verdict" || step.action.type === "place" || step.action.type === "answer");
  if (st.analysis && !aside) st.analysis.since++;
  if (step.kind === "ingest") applyResult(st, step.result || {}, step);
  else if (step.kind === "action") applyAction(st, step);
}

export function applyResult(st, r, meta) {
  const idx = st.ingests++;
  st.passes.push({ date: meta.date, source: meta.source });
  for (const [id, n] of Object.entries(r.add || {})) {
    if (!safeId(id) || !n || typeof n !== "object") continue;
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
  for (const f of r.flags || []) if (f && safeId(f.id)) st.flags.push({ ...f, nodes: [...(f.nodes || [])] });
  /* Goals the model read in the text arrive as proposals. The words are the
     person's (verbatim spans); calling them a goal is the machine's reading. */
  for (const g of r.goals || []) {
    if (!g || !safeId(g.id)) continue;
    const readMoves = (g.moves || []).map(m => ({ date: meta.date, text: m.text, at: m.at || "", effect: UNSAID, read: true }));
    if (g.existing) {
      const ex = st.goals[g.id];
      if (ex && ex.status !== "reached" && ex.status !== "dropped" && readMoves.length) { ex.moves.push(...readMoves); ex.history.push(`${meta.date}: ${readMoves.length} move${readMoves.length > 1 ? "s" : ""} read in ${meta.source}.`); }
      continue;
    }
    if (st.goals[g.id]) continue;
    st.goals[g.id] = { text: g.t, words: g.words || "", at: g.at || "", date: meta.date, source: meta.source, status: "proposed", proposed: true, ideaId: g.ideaId || null,
      moves: readMoves, history: [`${meta.date}: read as a goal in ${meta.source}.`] };
  }
  if (r.question) st.question = { text: r.question, source: meta.source };
}

function stateText(s) { return String(s ?? "").trim(); }

/* The state layer's actions. Everything is kept: a released fact keeps its
   dates, a dropped goal keeps its moves. */
function applyStateAction(st, a, step) {
  const g = a.goalId ? st.goals[a.goalId] : null;
  switch (a.type) {
    case "state": {
      if (!a.stateId || st.state[a.stateId] || !stateText(a.text)) return true;
      st.state[a.stateId] = { text: stateText(a.text), date: step.date, from: "said", goalId: null, ended: null };
      return true;
    }
    case "release": {
      const s = st.state[a.stateId]; if (s && !s.ended) { s.ended = step.date; s.endNote = stateText(a.note) || ""; }
      return true;
    }
    case "goal": {
      if (!a.goalId || st.goals[a.goalId] || !stateText(a.text)) return true;
      st.goals[a.goalId] = { text: stateText(a.text), words: "", at: "", date: step.date, source: step.source || "", status: "open", proposed: false, ideaId: a.ideaId || null, moves: [], history: [`${step.date}: put forth.`] };
      return true;
    }
    case "acceptgoal": {
      /* Confirming the goal does not turn the moves read in the text into the person's own report: they stay marked. */
      if (g && g.status === "proposed") { g.status = "open"; g.acceptedOn = step.date; g.history.push(`${step.date}: you confirmed this is a goal.`); }
      return true;
    }
    case "rejectgoal": {
      if (g && g.status === "proposed") { g.status = "dropped"; g.endedOn = step.date; g.history.push(`${step.date}: you said this is not a goal.`); }
      return true;
    }
    case "move": {
      if (!g || !stateText(a.text) || g.status === "reached" || g.status === "dropped") return true;
      g.moves.push({ date: step.date, text: stateText(a.text), effect: MOVE_EFFECTS.includes(a.effect) ? a.effect : "same", read: false });
      if (g.status === "stuck") { g.status = "open"; g.history.push(`${step.date}: moved again after being stuck.`); }
      return true;
    }
    case "reach": {
      if (!g || g.status === "reached" || g.status === "dropped") return true;
      const sid = a.stateId || "s-" + a.goalId;
      const text = stateText(a.text) || g.text;
      if (!st.state[sid]) st.state[sid] = { text, date: step.date, from: "reached", goalId: a.goalId, ended: null };
      g.status = "reached"; g.reachedOn = step.date; g.stateId = sid; g.history.push(`${step.date}: reached. “${text}” is now part of your state.`);
      return true;
    }
    case "regoal": {
      if (!g || g.status === "reached") return true;
      const to = ["stuck", "dropped", "open"].includes(a.status) ? a.status : null;
      if (!to || to === g.status) return true;
      g.status = to; if (to !== "open") g.endedOn = step.date; else g.endedOn = null;
      g.history.push(`${step.date}: ${to === "stuck" ? "the ground is stuck" : to === "dropped" ? "dropped" : "reopened"}${stateText(a.note) ? ". " + stateText(a.note) : "."}`);
      return true;
    }
    case "analysis": {
      /* The machine's suggestions. They change nothing else in the state. */
      const sug = (Array.isArray(a.suggestions) ? a.suggestions : []).filter(s => s && stateText(s.text))
        .map(s => ({ id: s.id || "", kind: s.kind || "question", text: stateText(s.text), why: stateText(s.why), about: (Array.isArray(s.about) ? s.about : []).filter(r => r && r.on && r.id).map(r => ({ on: r.on, id: r.id })) }));
      st.analysis = { id: a.id || "", date: step.date, model: a.model || "", standing: stateText(a.standing), suggestions: sug, since: 0,
        leftOut: (Array.isArray(a.leftOut) ? a.leftOut : []).map(stateText).filter(Boolean).slice(0, 5) };
      return true;
    }
    case "verdict": {
      /* The person's word on one suggestion of the analysis in view. The latest word stands. */
      const s = st.analysis && a.analysisId && st.analysis.id === a.analysisId ? st.analysis.suggestions.find(x => x.id && x.id === a.suggestionId) : null;
      if (s && VERDICTS.includes(a.mark)) { s.verdict = a.mark; s.verdictOn = step.date; }
      return true;
    }
    default: return false;
  }
}

/* The world maps' actions: put an item on a map, link two items, hang an
   open question on one, confirm a supposition, rule one out. Nothing is
   deleted: a ruled-out item stays, struck through, with its history. */
function applyWorldAction(st, a, step) {
  const n = a.id ? st.nodes[a.id] : null;
  const note = stateText(a.note) ? ". " + stateText(a.note) : ".";
  switch (a.type) {
    case "item": {
      const text = stateText(a.text);
      if (!a.id || n || !text || !Object.hasOwn(WORLD_MAPS, a.map)) return true;
      const made = { t: text.length > 80 ? text.slice(0, 79) + "…" : text, kind: a.map === "said" ? "idea" : "item", stuck: true, src: a.map === "said" ? "user_said" : "put_forth",
        words: text, date: step.date, at: "", file: "", slots: [], history: [], touches: [], also: [] };
      if (a.map !== "said") { made.map = a.map; made.supposed = a.supposed !== false; }
      st.nodes[a.id] = made;
      return true;
    }
    case "link": {
      if (!st.nodes[a.a] || !st.nodes[a.b] || a.a === a.b) return true;
      if (st.links.some(l => (l.a === a.a && l.b === a.b) || (l.a === a.b && l.b === a.a))) return true;
      st.links.push({ a: a.a, b: a.b, f: stateText(a.f).slice(0, 40) || "connects to", read: false });
      return true;
    }
    case "ask": {
      const q = stateText(a.text);
      if (n && q && !n.slots.includes(q)) n.slots.push(q);
      return true;
    }
    case "confirm": {
      if (n && n.supposed && !n.ruledOut) { n.supposed = false; n.confirmedOn = step.date; n.history.push(`${step.date}: confirmed${note}`); }
      return true;
    }
    case "ruleout": {
      if (n && n.map && !n.ruledOut) { n.ruledOut = true; n.replaced = true; n.history.push(`${step.date}: ruled out${note} It is kept, struck through.`); }
      return true;
    }
    case "answer": {
      /* An answer given for a character on the Start tab (src/shared/scenes.js): which arc, which scene, which option. Kept as given; what it adds up to is worked out from the answers, never stored. */
      if (!a.arc || !a.scene || !a.option) return true;
      st.answers.push({ arc: a.arc, scene: a.scene, option: a.option, date: step.date });
      return true;
    }
    case "place": {
      /* Where the person put a box, for the diagram drawn around one middle item. The middle itself stays in the middle. */
      if (!a.around || !st.nodes[a.around]) return true;
      if (a.reset) { delete st.places[a.around]; return true; }
      if (!n || a.id === a.around) return true;
      const far = v => Math.max(-PLACE_MAX, Math.min(PLACE_MAX, Math.round(Number(v) || 0)));
      (st.places[a.around] || (st.places[a.around] = bare()))[a.id] = { dx: far(a.dx), dy: far(a.dy) };
      return true;
    }
    default: return false;
  }
}

export function applyAction(st, step) {
  const a = step.action || {};
  if (!actionOk(a)) return; /* an unknown action, or one with an id that is not an id, does nothing */
  if (applyStateAction(st, a, step)) return;
  if (applyWorldAction(st, a, step)) return;
  const n = a.id ? st.nodes[a.id] : null;
  /* What each of these may act on is decided here, for the page, a script
     and the server alike: only the machine's reading can be kept or
     discarded, and only fixed words can be an anchor. The person's own
     words are never deleted and never relabelled. */
  const reading = n && n.stuck === false && !n.map;
  if (a.type === "keep" && reading) {
    /* A kept reading becomes stuck (it can no longer be rewired) but it
       stays the machine's phrasing. It is never shown as the person's words. */
    n.stuck = true; n.kept = true; n.src = "user_confirmed"; n.keptOn = step.date;
    st.links.forEach(l => {
      if (l.a === a.id || l.b === a.id) {
        const other = st.nodes[l.a === a.id ? l.b : l.a];
        if (other && other.stuck !== false) { l.read = false; if (l.f === "my reading") l.f = "leads to"; }
      }
    });
  } else if (a.type === "discard" && reading) {
    delete st.nodes[a.id];
    st.links = st.links.filter(l => l.a !== a.id && l.b !== a.id);
    st.flags.forEach(f => { f.nodes = f.nodes.filter(x => x !== a.id); });
  } else if (a.type === "anchor" && n && n.stuck && !n.kept && !n.ruledOut) {
    n.anchor = !n.anchor;
  } else if (a.type === "flag") {
    const f = st.flags.find(x => x.id === a.flagId);
    if (!f) return;
    /* "Later" is not an answer: the loose end stays open, marked as put off. */
    if (a.choice === "later") { f.later = step.date; return; }
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

/* The item at the middle of one map: the one with the most links inside
   that map; the earliest wins a tie. null when the map is empty. */
export function pickFocusIn(st, map) {
  const ids = Object.keys(st.nodes).filter(id => mapOf(st.nodes[id]) === map && !st.nodes[id].replaced);
  if (!ids.length) return null;
  const inside = id => st.links.filter(l => (l.a === id || l.b === id) && st.nodes[l.a] && st.nodes[l.b] && mapOf(st.nodes[l.a]) === map && mapOf(st.nodes[l.b]) === map).length;
  let best = ids[0], top = inside(best);
  for (const id of ids.slice(1)) { const k = inside(id); if (k > top) { best = id; top = k; } }
  return best;
}

/* The item to put in the middle of a map when it is opened. Normally the
   best-linked live item. A map that holds only ruled-out items still has a
   middle, so that what was ruled out is drawn struck through instead of
   the map looking empty. null only when the map has nothing at all. */
export function mapMiddle(st, map) {
  return pickFocusIn(st, map) || Object.keys(st.nodes).find(id => mapOf(st.nodes[id]) === map) || null;
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
  if (!n.touches.length) return "settled"; /* put forth by hand, not read from a pass */
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

/* ---- queries over the state layer ---- */

export function currentState(st) { return Object.entries(st.state).filter(([, s]) => !s.ended).map(([id, s]) => ({ id, ...s })); }
export function pastState(st) { return Object.entries(st.state).filter(([, s]) => s.ended).map(([id, s]) => ({ id, ...s })); }

/* Movement toward a goal, read off its moves: how many brought it closer,
   how many did nothing, how many set it back, how many were read in the
   text with no effect said, and the last move. No invented distance; only
   what the person reported. */
export function movement(g) {
  const m = { moves: g.moves.length, closer: 0, same: 0, farther: 0, unsaid: 0, last: g.moves.length ? g.moves[g.moves.length - 1] : null };
  for (const x of g.moves) m[x.effect] = (m[x.effect] || 0) + 1;
  return m;
}

/* One bounded line, for anything a person wrote that is set in a listing
   the model reads: no newlines (it cannot start a section of its own), no
   control characters, clipped. The server's screen.js has the same rule. */
export function flat(s, max = 300) {
  s = String(s ?? "").replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export const goalStatusLabel = s => ({ proposed: "read in your text", open: "open", reached: "reached", stuck: "ground is stuck", dropped: "dropped" }[s] || s);

/* The state and goals the model sees, so it can tell a new goal from one
   already put forth and notice a move toward an open goal. */
export function stateListing(st, cap = 40) {
  const now = currentState(st).slice(-cap).map(s => `state | ${s.id} | ${flat(s.text)}`);
  const goals = Object.entries(st.goals).filter(([, g]) => g.status === "open" || g.status === "proposed" || g.status === "stuck").slice(-cap)
    .map(([id, g]) => `goal | ${id} | ${g.status} | ${flat(g.text)} | ${g.moves.length} moves`);
  return now.concat(goals).join("\n") || "(no state facts or goals yet)";
}

/* The listing the model sees of what is already on the map. Most recently
   touched first; capped so the prompt stays bounded. */
export function mapListing(st, cap = 160) {
  const ids = Object.keys(st.nodes).filter(id => !st.nodes[id].map).sort((a, b) => lastTouch(st.nodes[b]) - lastTouch(st.nodes[a])).slice(0, cap);
  if (!ids.length) return "(empty: this is the first text)";
  return ids.map(id => {
    const n = st.nodes[id];
    return `${id} | ${n.stuck && !n.kept ? n.kind : "reading"}${n.anchor ? " | ANCHOR" : ""}${n.replaced ? " | replaced" : ""} | ${flat(n.t)}`;
  }).join("\n");
}

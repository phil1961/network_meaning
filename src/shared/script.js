/* ─────────────────────────────────────────────
   File: src/shared/script.js
   File Version: 0.2.0
   ─────────────────────────────────────────────
   The scripting language (Phil, 2026-09-30): "a scripting language that
   interacts with the app to make it go," run by a stepper "so we can watch
   as all the actions happens."

   A script is plain text, one action per line:
       verb [name or "a few words"] [word] : free text
   Lines starting with # are comments. Everything a script does is something
   the person could press: each line becomes an ordinary step in the stream,
   a model call, or a change of view. Nothing here touches the DOM or the
   server. parseScript() reads the text; planStep() turns one line into what
   the app should do, given the state at that moment. The client runner
   (src/client/85-script.js) carries the plan out. No imports: the client
   build inlines this file and strips the export keywords. */

export const SCRIPT_EFFECTS = ["closer", "same", "farther"];
export const SCRIPT_VIEWS = ["map", "state", "add", "loose", "timeline", "talk", "script", "said", "environment", "mental", "assumptions"];
export const SCRIPT_HOW = ["supposed", "given"];
/* The verb that puts an item on a world map, and the "show" word that opens it. */
const ITEM_MAP = { said: "said", environment: "env", mental: "mind", assumption: "moral" };
const SHOW_MAP = { said: "said", environment: "env", mental: "mind", assumptions: "moral" };
export const SCRIPT_CHOICES = ["accept", "keep", "link", "unrelated", "talk", "later", "both", "drop", "ok"];

/* What each verb takes. text: 1 required, 0 optional, absent = none.
   ref: what the line points at. word: a fixed vocabulary. */
export const SCRIPT_VERBS = {
  stream: { text: 1 }, date: { text: 1 }, note: { text: 1 },
  fact: { name: true, text: 1 }, goal: { name: true, text: 1 },
  release: { ref: "state", text: 0 },
  move: { ref: "goal", word: SCRIPT_EFFECTS, wordOptional: true, text: 1 },
  reach: { ref: "goal", text: 0 }, stuck: { ref: "goal", text: 0 }, drop: { ref: "goal", text: 0 },
  reopen: { ref: "goal" }, accept: { ref: "goal" }, reject: { ref: "goal" },
  text: { source: true, text: 1, block: true }, help: {},
  show: { word: SCRIPT_VIEWS }, focus: { ref: "idea" },
  keep: { ref: "idea" }, discard: { ref: "idea" }, anchor: { ref: "idea" },
  resolve: { ref: "flag", word: SCRIPT_CHOICES },
  rewind: { num: true }, latest: {}, branch: {},
  said: { name: true, text: 1 },
  environment: { name: true, word: SCRIPT_HOW, wordOptional: true, text: 1 },
  mental: { name: true, word: SCRIPT_HOW, wordOptional: true, text: 1 },
  assumption: { name: true, word: SCRIPT_HOW, wordOptional: true, text: 1 },
  link: { ref: "idea", ref2: "idea", text: 1 }, ask: { ref: "idea", text: 1 },
  confirm: { ref: "idea", text: 0 }, ruleout: { ref: "idea", text: 0 }
};

/* The reference shown beside the editor: [form, what it does]. */
export const SCRIPT_HELP = [
  ["# anything", "A comment. Skipped."],
  ["stream: Name", "Start a new, empty, saved stream with this name. Without it, the script runs on the stream that is open."],
  ["date: Sep 28", "Date the steps that follow. Without it, they are dated today."],
  ["fact home: Bobby is at home.", "Put a state fact forth. “home” is an optional name later lines can use."],
  ["release home: He left.", "A fact stops being true. The note after the colon is optional."],
  ["goal milk: Get milk.", "Put a goal forth, with an optional name."],
  ["move milk closer: What happened.", "Record a move toward a goal: closer, same, or farther. Closer if you leave it out."],
  ["reach milk: Bobby has milk.", "The goal is reached. The words become a fact in Now."],
  ["stuck milk: Why.   drop milk   reopen milk", "The ground is stuck, drop the goal, or take it up again."],
  ["text \"Source\": The words.", "Add text and ideaify it. Calls the model. For several lines, put \"\"\" after the colon and \"\"\" on its own line to close."],
  ["accept \"milk\"   reject \"milk\"", "Confirm, or refuse, a goal the model read in the text."],
  ["help", "Press Help analysis. Calls the model."],
  ["keep \"…\"   discard \"…\"   anchor \"…\"", "Keep or discard a reading; pin or unpin an idea as an anchor."],
  ["resolve \"…\" drop", "Settle a loose end: accept, keep, link, unrelated, talk, later, both, drop, or ok."],
  ["said need: He needs milk.", "Put something that was said on the map by hand, with an optional name. No model call."],
  ["environment store: A store is within reach.", "Put an item on the Environment map. It is supposed unless you write “given” before the colon."],
  ["mental want given: He wants milk.", "Put an item on the Mental state map."],
  ["assumption pay: You pay for what you take.", "Put an item on the Assumptions map."],
  ["link nomilk want: gives rise to", "Link two items or ideas, on one map or across maps. The words after the colon say how the first bears on the second."],
  ["ask store: Which store?", "Hang an open question on an item or idea."],
  ["confirm store: He said so.   ruleout store", "A supposition is confirmed, or ruled out. A ruled-out item is kept, struck through."],
  ["focus \"…\"   show state", "Look at an idea on the map, or switch view: map, state, add, loose, timeline, talk, script. “show environment”, “show mental”, “show assumptions” and “show said” open that map."],
  ["rewind 7   latest   branch", "View an earlier step, come back to the latest, or branch from the step in view."],
  ["note: Anything.", "Say something in the stepper. Changes nothing."],
  ["milk  or  \"a few words\"", "Point at a thing by the name a script line gave it, or by a few of its words in quotes. The words must match exactly one thing the line could act on."]
];

const NAME_RE = /^[A-Za-z][\w-]*$/;
const isQuote = c => c === '"' || c === "“" || c === "”";

/* "verb args : text" split at the first colon outside quotes. */
function splitHead(t) {
  let inQ = false;
  for (let i = 0; i < t.length; i++) {
    if (isQuote(t[i])) inQ = !inQ;
    else if (t[i] === ":" && !inQ) return { head: t.slice(0, i).trim(), text: t.slice(i + 1).trim(), colon: true };
  }
  return { head: t, text: "", colon: false, open: inQ };
}
function headTokens(head) {
  const out = []; const re = /"([^"]*)"|(\S+)/g; let m;
  const h = head.replace(/[“”]/g, '"');
  while ((m = re.exec(h))) out.push(m[1] !== undefined ? { q: true, v: m[1].trim() } : { q: false, v: m[2] });
  return out;
}

/* Text to { steps, errors }. A step is one runnable line:
   { line, raw, verb, text, name?, source?, ref?:{q, v}, word?, num? }.
   errors: [{ line, message }], in plain words. A script with errors does
   not run. */
export function parseScript(src) {
  const lines = String(src ?? "").replace(/\r\n?/g, "\n").split("\n");
  const steps = [], errors = [], named = {};
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim(), line = i + 1;
    if (!t || t.startsWith("#")) continue;
    const bad = m => { errors.push({ line, message: m }); };
    const sp = splitHead(t);
    const toks = headTokens(sp.head);
    if ((sp.head.replace(/[“”]/g, '"').match(/"/g) || []).length % 2) { bad("A quote is opened and never closed."); continue; }
    const first = toks.shift();
    const verb = first && !first.q ? first.v.toLowerCase() : "";
    const spec = Object.hasOwn(SCRIPT_VERBS, verb) ? SCRIPT_VERBS[verb] : null;
    if (!spec) { bad(`“${first ? first.v : t}” is not a word a script can use.`); continue; }
    const step = { line, raw: t, verb, text: sp.text };
    const opensBelow = spec.block && sp.colon && !sp.text && i + 1 < lines.length && lines[i + 1].trim() === '"""';
    if (opensBelow) i++;
    if (spec.block && (sp.text === '"""' || opensBelow)) {
      const body = []; let closed = false;
      while (++i < lines.length) { if (lines[i].trim() === '"""') { closed = true; break; } body.push(lines[i]); }
      if (!closed) { bad('The text opened with """ is never closed. Put """ on a line of its own.'); continue; }
      step.text = body.join("\n").trim(); step.raw = `${t} … (${body.length} line${body.length === 1 ? "" : "s"})`;
    }
    let ok = true;
    if (spec.name && toks.length && !(spec.word && !toks[0].q && spec.word.includes(toks[0].v.toLowerCase()))) {
      const n = toks.shift();
      if (n.q || !NAME_RE.test(n.v)) { bad(`A name is one plain word, like “milk”. “${n.v}” is not.`); ok = false; }
      else if (named[n.v]) { bad(`The name “${n.v}” is already used on line ${named[n.v]}.`); ok = false; }
      else { step.name = n.v; named[n.v] = line; }
    }
    if (spec.source && toks.length) step.source = toks.shift().v;
    if (spec.ref) {
      const r = toks.shift();
      if (!r || !r.v) { bad(`“${verb}” needs to say which ${REF_NOUN[spec.ref]}: a name, or a few of its words in quotes.`); ok = false; }
      else step.ref = r;
    }
    if (spec.ref2) {
      const r = toks.shift();
      if (!r || !r.v) { bad(`“${verb}” needs two things to join: each a name, or a few words in quotes.`); ok = false; }
      else step.ref2 = r;
    }
    if (spec.word) {
      const w = toks.length ? toks.shift().v.toLowerCase() : "";
      if (!w && spec.wordOptional) step.word = spec.word[0];
      else if (!spec.word.includes(w)) { bad(`“${verb}” ${w ? `doesn't know “${w}”` : "needs one more word"}. Use one of: ${spec.word.join(", ")}.`); ok = false; }
      else step.word = w;
    }
    if (spec.num) {
      const n = toks.shift();
      if (!n || !/^\d+$/.test(n.v)) { bad(`“${verb}” needs a step number, like “${verb} 7”.`); ok = false; }
      else step.num = parseInt(n.v, 10);
    }
    if (ok && toks.length) { bad(`Didn't expect “${toks[0].v}” here. To point at something by its words, put them in quotes.`); ok = false; }
    if (ok && spec.text === 1 && !step.text) { bad(`“${verb}” needs its words after a colon.`); ok = false; }
    if (ok && spec.text === undefined && sp.colon) { bad(`“${verb}” takes nothing after a colon.`); ok = false; }
    if (ok) steps.push(step);
  }
  return { steps, errors };
}

const REF_NOUN = { state: "fact", goal: "goal", idea: "idea", flag: "loose end" };
const hasOwn = (o, k) => Object.hasOwn(o || {}, k);

/* Which things a verb may act on, mirroring what the page offers. */
const REF_FITS = {
  release: s => !s.ended,
  move: g => g.status === "open" || g.status === "stuck",
  reach: g => g.status === "open" || g.status === "stuck",
  stuck: g => g.status === "open",
  drop: g => g.status === "open" || g.status === "stuck",
  reopen: g => g.status === "stuck" || g.status === "dropped",
  accept: g => g.status === "proposed", reject: g => g.status === "proposed",
  keep: n => n.stuck === false, discard: n => n.stuck === false,
  anchor: n => n.stuck && !n.kept, focus: () => true,
  confirm: n => !!n.supposed && !n.ruledOut, ruleout: n => !!n.map && !n.ruledOut,
  resolve: () => true
};

/* Find the one thing a line points at: by a name the script gave it, or by
   a few of its words. Returns { id } or { error } in plain words. */
export function findRef(st, names, on, ref, verb) {
  const noun = REF_NOUN[on];
  const pool = on === "state" ? Object.entries(st.state).map(([id, s]) => ({ id, x: s, main: s.text, all: s.text }))
    : on === "goal" ? Object.entries(st.goals).map(([id, g]) => ({ id, x: g, main: g.text, all: g.text + " " + (g.words || "") }))
    : on === "idea" ? Object.entries(st.nodes).map(([id, n]) => ({ id, x: n, main: n.t, all: n.t + " " + (n.words || n.reading || "") }))
    : st.flags.filter(f => !hasOwn(st.outcomes, f.id)).map(f => ({ id: f.id, x: f, main: f.text, all: f.text }));
  const fits = REF_FITS[verb] || (() => true);
  if (!ref.q && hasOwn(names, ref.v)) {
    const n = names[ref.v];
    if (n.on !== on) return { error: `“${ref.v}” is a ${REF_NOUN[n.on]}, and “${verb}” needs a ${noun}.` };
    const hit = pool.find(p => p.id === n.id);
    if (!hit) return { error: `The ${noun} named “${ref.v}” is not in this stream.` };
    if (!fits(hit.x)) return { error: `“${verb}” can't act on “${ref.v}” at this point${hit.x.status ? `: it is ${hit.x.status}` : hit.x.ended ? ": it already stopped being true" : hit.x.ruledOut ? ": it is ruled out" : verb === "confirm" ? ": it is not a supposition" : ""}.` };
    return { id: n.id };
  }
  const want = ref.v.toLowerCase();
  const plain = s => String(s || "").toLowerCase().replace(/[.!?]+$/, "").trim();
  const can = pool.filter(p => fits(p.x));
  const exact = can.filter(p => plain(p.main) === plain(want));
  if (exact.length === 1) return { id: exact[0].id };
  const some = can.filter(p => p.all.toLowerCase().includes(want));
  if (some.length === 1) return { id: some[0].id };
  if (!some.length) return { error: `No ${noun} that “${verb}” could act on matches “${ref.v}”.` };
  return { error: `“${ref.v}” matches ${some.length} ${noun}s. Use more of its words.` };
}

/* One parsed line to what the app should do, given the state now.
   names: { name: { on, id } } bound by earlier lines. newId(prefix) makes
   an id for a new fact or goal. Returns one of:
     { do:"action", action, at:{on, id, also?}, bind? }   an ordinary action step
     { do:"ingest", text, source }  { do:"analyze" }   model calls
     { do:"stream", name }  { do:"date", date }  { do:"note", text }
     { do:"show", view, map? }  { do:"focus", id }  { do:"rewind", to }  { do:"latest" }  { do:"branch" }
     { error }   the line can't run against this state. */
export function planStep(s, st, names, newId) {
  const spec = SCRIPT_VERBS[s.verb];
  let id = null;
  if (spec && spec.ref) { const r = findRef(st, names, spec.ref, s.ref, s.verb); if (r.error) return r; id = r.id; }
  const act = (action, on, bind) => ({ do: "action", action, at: { on, id: on === "state" ? action.stateId : on === "goal" ? action.goalId : id }, bind: bind || null });
  switch (s.verb) {
    case "stream": return { do: "stream", name: s.text.slice(0, 200) };
    case "date": return { do: "date", date: s.text.slice(0, 40) };
    case "note": return { do: "note", text: s.text };
    case "fact": { const nid = newId("s"); return act({ type: "state", stateId: nid, text: s.text }, "state", s.name ? { name: s.name, on: "state", id: nid } : null); }
    case "goal": { const nid = newId("g"); return act({ type: "goal", goalId: nid, text: s.text }, "goal", s.name ? { name: s.name, on: "goal", id: nid } : null); }
    case "release": return act({ type: "release", stateId: id, note: s.text }, "state");
    case "move": return act({ type: "move", goalId: id, text: s.text, effect: s.word }, "goal");
    case "reach": return act({ type: "reach", goalId: id, stateId: newId("s"), text: s.text }, "goal");
    case "stuck": return act({ type: "regoal", goalId: id, status: "stuck", note: s.text }, "goal");
    case "drop": return act({ type: "regoal", goalId: id, status: "dropped", note: s.text }, "goal");
    case "reopen": return act({ type: "regoal", goalId: id, status: "open" }, "goal");
    case "accept": return act({ type: "acceptgoal", goalId: id }, "goal");
    case "reject": return act({ type: "rejectgoal", goalId: id }, "goal");
    case "text": return { do: "ingest", text: s.text, source: (s.source || "Script").slice(0, 200) };
    case "help": return { do: "analyze" };
    case "show": return hasOwn(SHOW_MAP, s.word) ? { do: "show", view: "map", map: SHOW_MAP[s.word] } : { do: "show", view: s.word };
    case "said": case "environment": case "mental": case "assumption": {
      const nid = newId("w"), map = ITEM_MAP[s.verb];
      const action = map === "said" ? { type: "item", id: nid, map, text: s.text } : { type: "item", id: nid, map, text: s.text, supposed: s.word !== "given" };
      return { do: "action", action, at: { on: "idea", id: nid }, bind: s.name ? { name: s.name, on: "idea", id: nid } : null };
    }
    case "link": {
      const r2 = findRef(st, names, "idea", s.ref2, s.verb); if (r2.error) return r2;
      if (r2.id === id) return { error: "“link” needs two different things." };
      return { do: "action", action: { type: "link", a: id, b: r2.id, f: s.text.slice(0, 40) }, at: { on: "idea", id, also: r2.id }, bind: null };
    }
    case "ask": return act({ type: "ask", id, text: s.text }, "idea");
    case "confirm": case "ruleout": return act({ type: s.verb, id, note: s.text }, "idea");
    case "focus": return { do: "focus", id };
    case "keep": case "discard": case "anchor": return act({ type: s.verb, id }, "idea");
    case "resolve": return act({ type: "flag", flagId: id, choice: s.word }, "flag");
    case "rewind": return { do: "rewind", to: s.num };
    case "latest": return { do: "latest" };
    case "branch": return { do: "branch" };
    default: return { error: `“${s.verb}” is not a word a script can use.` };
  }
}

/* Run a script's action lines with no page and no server: each plan
   becomes a step, and the next line sees the replayed state. Lines that
   only change the view are skipped; a line that can't run stops it. Used
   for the built-in world sample and by the tests. replayFn is replay(). */
export function scriptToSteps(text, replayFn) {
  const p = parseScript(text); const steps = [], names = {}; let date = "", n = 0, error = p.errors[0] || null;
  for (const s of error ? [] : p.steps) {
    const plan = planStep(s, replayFn(steps), names, pre => pre + (++n));
    if (plan.error) { error = { line: s.line, message: plan.error }; break; }
    if (plan.do === "date") date = plan.date;
    if (plan.do !== "action") continue;
    steps.push({ kind: "action", seq: steps.length, at: null, date, source: "script", action: plan.action });
    if (plan.bind) names[plan.bind.name] = { on: plan.bind.on, id: plan.bind.id };
  }
  return { steps, names, error };
}

/* Built-in scripts. The first calls no model: every line is an action. */
export const SCRIPT_EXAMPLES = {
  hand: { name: "Bobby and the milk, by hand (no model calls)", text: `# Bobby and the milk, by hand.
# Every line is an action you could press yourself. No model calls.
stream: Bobby, scripted
date: Sep 28
fact home: Bobby is at home.
fact nomilk: There is no milk in the house.
fact: The car makes a grinding noise when it starts.
goal car: Fix the car.
date: Sep 29
move car same: Called the mechanic. The first opening is next month.
stuck car: Nothing moves until next month.
date: Sep 30
goal milk: Get milk.
release home: He left for the store.
move milk closer: Bobby is at the store. They have milk.
move milk same: The line is long. Bobby is still at the store.
date: Oct 1
reach milk: Bobby has milk.
release nomilk: He brought some home.
fact: Bobby is home again.
note: Now look back at the goal before it was reached.
rewind 10
latest
` },
  model: { name: "Bobby and the milk, read by the model (3 model calls)", text: `# Bobby and the milk, read from the story.
# "text" and "help" call the model, so these lines take a few seconds each.
stream: Bobby, read from the story
fact home: Bobby is at home.
fact nomilk: There is no milk in the house.
text "Bobby, the story": Bobby went to the store to get milk.
accept "milk"
release home: He left for the store.
move "milk" closer: Bobby is at the store. They have milk.
help
reach "milk": Bobby has milk.
release nomilk: He brought some home.
help
` },
  world: { name: "Bobby's world, assembled (no model calls)", text: `# Bobby's world, assembled the way an investigator would.
# What is given is kept apart from what is supposed, and each supposition
# carries the question that would check it. All of it is made up, for review.
stream: Bobby's world
date: Sep 30

# 1. What was said. This is all the evidence there is.
said need: He needs milk.
said act: Bobby went to the store to get milk.
link need act: where it starts
ask act: You said “get” once and “buy” once. Which is it?

# 2. His environment: the situation, from near to far.
environment home: Bobby sets out from home.
environment nomilk: There is no milk in the house.
link home nomilk: lacks
environment others: Someone else lives there and uses milk.
link home others: shared with
environment store: A store that sells milk is within reach.
link home store: within reach of
environment way: He has a way to get there and back.
link home way: by
link way store: leads to
environment money: He has the money to pay for it.
link store money: takes
environment open: The store is open at this hour.
link store open: only if
link need nomilk: read as a lack
ask home: Where did he set out from?
ask nomilk: Is the milk gone, or only low?
ask others: Who is at home?
ask store: Which store? How far?
ask way: How did he get there? Does he have a car?

# 3. His mental state: what he wants, what he takes for granted, what he means to do.
mental intent: He means to go to the store and come back with milk.
mental want: He wants there to be milk at home.
link want intent: leads to
mental forwhom: He has someone in mind who is waiting for it.
link forwhom want: sharpens
mental trusts: He takes it for granted that the store will have milk.
link trusts intent: allows
mental cando: He takes it for granted that he can get there and back.
link cando intent: allows
mental calm: Nothing about the errand alarms him.
link calm intent: lets it run
mental now: He feels it should be done now, not later.
link now intent: presses
link need want: read as a want
link intent act: carried out as
link nomilk want: gives rise to
link others forwhom: is who
link store trusts: is trusted
link way cando: is trusted
ask intent: Did he say why he went, or is that the teller's reading?
ask trusts: What happens in him if the shelf is empty?
ask calm: What would have made him hesitate?
ask now: Was there any hurry?

# 4. His assumptions: what he takes to be right, found by asking "why does that matter?"
assumption provide: Those at home should not go without.
assumption care: You look after the people near you.
link provide care: rests on
assumption able: The one who can go, goes.
link able provide: serves
assumption word: If you said you would get it, you get it.
link word provide: serves
assumption pay: You pay for what you take from a store.
link pay care: rests on
link need provide: read as an ought
link provide intent: makes it worth doing
link pay intent: limits how
link able now: presses
ask word: Did anyone ask him to go?
ask care: What is this care grounded in, for Bobby?
ask pay: He went to “get” milk. Does he mean to buy it?

show said
note: Four maps of one world. Pick a map above the diagram, select any item, and add to it.
` }
};

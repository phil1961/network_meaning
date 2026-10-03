/* ─────────────────────────────────────────────
   File: src/client/92-start.js
   File Version: 0.2.0
   ─────────────────────────────────────────────
   Start: the inviting tab (Phil, 2026-10-02: "Create a new top level tab
   that is our inviting UI"). A person picks one small good, does it, and
   feels a small gap close; then is offered one a little bigger, if they
   want it. Each crossing lays a plank on a bridge drawn above the choices,
   and five planks is a bridge crossed.

   The gaps and the sizing of the next one are in src/shared/gaps.js. This
   module only draws and listens. It makes no step in any stream and calls
   no server: the walk lives in this page and is gone when the page closes.
   Nothing here is a count shown to the person, a mark, or a streak. Every
   button is a right answer.

   A way in from where the person stands (Phil, 2026-10-03: "Make the state
   taxonomy a way in from the Start tab: Yes"): a few words of their own are
   placed against the twenty-five states of src/shared/states.js, or the
   states are chosen from a list, and the state chosen picks the first three
   small goods. The words are read and let go.

   What is on screen at any moment is one of:
     offer     three gaps to choose from
     where     a few words of the person's own, or a list to choose from
     families  the five families of states
     states    the states a person's words point at, or one family's
     ask       for someone else, or for you?
     doing   one gap chosen, away being done; how did it go?
     across  the bridge is built
     rest    the person said that is enough for now */
let walk = newWalk();
let startAt = { phase: "offer", gaps: offer(walk), lead: "Pick whichever you like. There's no wrong one.", said: "", doing: null, back: null };
let startFresh = false;   /* true for the one drawing after a plank is laid, so only the new plank moves */
let startMeX = 78;        /* where the person stood in the last drawing, in the drawing's units */
const forWhom = { out: "for someone else", in: "for you" };

/* The bridge: two banks, the planks laid so far, the ones still to lay drawn faint, and the person. */
function bridgeSVG() {
  const n = walk.planks, across = n >= BRIDGE, x0 = 112, span = 416 / BRIDGE, w = span - 7;
  const at = across ? 566 : n ? x0 + (n - 0.5) * span : 78;
  let s = `<path class="br-bank" d="M0,150 L0,84 Q58,72 112,86 L112,150 Z"/><path class="br-bank" d="M640,150 L640,84 Q582,72 528,86 L528,150 Z"/>`;
  s += `<path class="br-rail${across ? " built" : ""}" d="M112,54 Q320,82 528,54"/><path class="br-post" d="M112,88 L112,52 M528,88 L528,52"/>`;
  for (let i = 0; i < BRIDGE; i++) s += `<rect class="${i < n ? "br-plank" + (startFresh && i === n - 1 ? " fresh" : "") : "br-slot"}" x="${(x0 + i * span + 3.5).toFixed(1)}" y="86" width="${w.toFixed(1)}" height="12" rx="3"/>`;
  /* the person walks from where they stood to the new plank; only on the drawing that follows a crossing */
  const walked = startFresh && startMeX !== at;
  s += `<circle class="br-me${walked ? " moved" : ""}" r="9" cy="${n && !across ? 77 : 68}" style="--from:${startMeX.toFixed(1)}px;transform:translateX(${at.toFixed(1)}px)"/>`;
  startMeX = at;
  s += `<text class="br-word" x="56" y="126" text-anchor="middle">where you are</text><text class="br-word" x="584" y="126" text-anchor="middle">further on</text>`;
  const say = across ? "A bridge, built all the way across. You are on the far side." : n ? `A bridge part built: ${n === 1 ? "one plank is" : n + " planks are"} laid, and you are standing on the newest.` : "Two banks and the outline of a bridge between them. Nothing is laid yet.";
  return `<svg class="bridge" id="bridge" viewBox="0 40 640 110" role="img" aria-label="${esc(say)}">${s}</svg>`;
}
function choiceHTML(g, mixed) { return `<button class="choice" type="button" data-gap="${esc(g.id)}">${mixed ? `<span class="for">${forWhom[g.to]}</span>` : ""}${esc(g.act)}</button>`; }
function trailHTML(open) {
  const t = trail(walk); if (!t.did.length && !t.later.length) return "";
  const list = gs => `<ul>${gs.map(g => `<li>${esc(g.act)}</li>`).join("")}</ul>`;
  const began = walk.state ? `<p class="small">Where you began: ${esc(stateById(walk.state).name.toLowerCase())}.</p>` : "";
  return `<details class="start-trail" id="starttrail"${open ? " open" : ""}><summary>What you've crossed</summary>${began}${t.did.length ? list(t.did) : `<p class="small">Nothing yet.</p>`}${t.later.length ? `<h4>Kept for later</h4>${list(t.later)}` : ""}<p class="small">This is yours. It lives on this page only: it is not saved, it is not sent anywhere, and it is gone when you close the page.</p></details>`;
}
function renderStart() {
  const a = startAt, enough = `<button class="linkbtn" type="button" data-go="rest">That's enough for now</button>`;
  let h = "";
  if (a.phase === "offer") {
    const mixed = new Set(a.gaps.map(g => g.to)).size > 1;
    h = `<p class="start-ask">${esc(a.lead)}</p><div class="choices">${a.gaps.map(g => choiceHTML(g, mixed)).join("")}</div>`;
    h += `<p class="start-foot">${!walk.state && !walk.log.length ? `<button class="linkbtn" type="button" data-go="where">Or start from where you are</button>` : ""}${walk.to ? `<button class="linkbtn" type="button" data-to="${walk.to === "out" ? "in" : "out"}">${walk.to === "out" ? "Something for me instead" : "Something for someone else instead"}</button>` : ""}${walk.log.length ? enough : ""}</p>`;
  } else if (a.phase === "where") {
    /* a way in from where the person stands: a few words of their own, placed against the states, or the states chosen from a list */
    h = `<p class="start-ask">Say where you are, in a few words of your own. They are read on this page and let go: nothing is saved or sent anywhere.</p>
      <textarea class="where" id="wheretext" rows="3" aria-label="Where you are, in your own words" placeholder="e.g. I don't know which way to go."></textarea>
      <div class="choices two"><button class="choice primary" type="button" data-go="place">Find where I am</button><button class="choice" type="button" data-go="browse">Choose from a list instead</button></div>
      <p class="start-foot"><button class="linkbtn" type="button" data-go="back">Back to the three</button></p>`;
  } else if (a.phase === "families") {
    h = `<p class="start-ask">${esc(a.lead)}</p><div class="choices">${FAMILIES.map(f => `<button class="choice" type="button" data-family="${f.id}"><span class="for">${esc(f.says)}</span>${esc(f.name)}</button>`).join("")}</div><p class="start-foot"><button class="linkbtn" type="button" data-go="back">Back to the three</button></p>`;
  } else if (a.phase === "states") {
    const fam = s => familyById(s.family).name;
    h = `<p class="start-ask">${esc(a.lead)}</p><div class="choices">${a.states.map(s => `<button class="choice" type="button" data-state="${s.id}"><span class="for">${esc(fam(s))}</span>${esc(s.name)}</button>`).join("")}<button class="choice" type="button" data-go="browse">None of these</button></div><p class="start-foot"><button class="linkbtn" type="button" data-go="back">Back to the three</button></p>`;
  } else if (a.phase === "ask") {
    h = `<p class="start-ask">The next one can be for someone else, or for you. Which would you like?</p><div class="choices two"><button class="choice" type="button" data-to="out">For someone else</button><button class="choice" type="button" data-to="in">For me</button></div><p class="start-foot">${enough}</p>`;
  } else if (a.phase === "doing") {
    h = `<p class="start-ask">Take your time. This page will wait.</p><p class="start-act">${esc(a.doing.act)}</p><div class="choices"><button class="choice primary" type="button" data-outcome="did">I did it</button><button class="choice" type="button" data-outcome="later">Not just now. Keep it for later</button><button class="choice" type="button" data-outcome="smaller">Something smaller</button></div>`;
  } else if (a.phase === "across") {
    h = `<p class="start-act">You're across.</p><p class="start-ask">Five small goods, one plank each. You built this, and you walked it.</p><div class="choices two"><button class="choice primary" type="button" data-go="again">Build another bridge</button><button class="choice" type="button" data-go="map">See how this app maps a person's world</button></div>`;
  } else {
    h = `<div class="choices two"><button class="choice primary" type="button" data-go="on">Carry on</button><button class="choice" type="button" data-go="map">See how this app maps a person's world</button></div>`;
  }
  $("#startbridge").innerHTML = bridgeSVG();
  $("#startsaid").textContent = a.said; $("#startsaid").hidden = !a.said;
  $("#startbody").innerHTML = h + trailHTML(a.phase === "across" || a.phase === "rest");
  startFresh = false;
}
/* A gap crossed: lay the plank, say what just happened, and size the next offer. */
function crossGap(g) {
  const r = settle(walk, g.id, "did"); startFresh = r.plank;
  if (r.across) startAt = { phase: "across", said: g.done };
  else if (!walk.to) startAt = { phase: "ask", said: g.done };
  else startAt = { phase: "offer", gaps: offer(walk), lead: g.reach < REACH.max ? "Here's one a little bigger, if you'd like it." : "Here's another, about the same size.", said: g.done };
}
$("#view-start").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || !b.closest("#startbody")) return;
  const a = startAt;
  if (b.dataset.gap) {
    const g = gapById(b.dataset.gap); if (!g) return;
    if (crossedByChoosing(g)) crossGap(g); else startAt = { phase: "doing", doing: g, said: "" };
  } else if (b.dataset.to) {
    const first = !walk.to; walk.to = b.dataset.to;
    startAt = { phase: "offer", gaps: offer(walk), lead: (walk.to === "out" ? "For someone else, then." : "For you, then.") + (first ? " These are a little bigger. Pick one." : " Pick one."), said: first ? a.said : "" };
  } else if (b.dataset.outcome === "did") crossGap(a.doing);
  else if (b.dataset.outcome === "later" || b.dataset.outcome === "smaller") {
    const later = b.dataset.outcome === "later"; settle(walk, a.doing.id, b.dataset.outcome);
    startAt = { phase: "offer", gaps: offer(walk), lead: later ? "Here are some others, about the same size." : "Here are some smaller ones.", said: later ? "Then it waits for you. Picking it was a step of its own, and it stays yours." : "Good. The right size of step is the one you can take today." };
  } else if (b.dataset.go === "where") startAt = { phase: "where", said: "", back: a };
  else if (b.dataset.go === "place") {
    /* the person's words are read here and let go: they are not kept in the walk, the page or anywhere else */
    const found = placeWords(entered($("#wheretext")));
    startAt = found.length ? { phase: "states", states: found, lead: "From your words, it could be one of these. Pick the nearest, or none of them.", said: "", back: a.back }
      : { phase: "families", lead: "Pick the nearest of these five.", said: "I couldn't place that from the words alone, and I won't guess. These are five families of where a person can stand.", back: a.back };
  } else if (b.dataset.go === "browse") startAt = { phase: "families", lead: "These are five families of where a person can stand. Pick the nearest.", said: "", back: a.back };
  else if (b.dataset.family) startAt = { phase: "states", states: statesIn(b.dataset.family), lead: `${familyById(b.dataset.family).name}. Pick the one nearest to where you are.`, said: "", back: a.back };
  else if (b.dataset.state) {
    const st = stateById(b.dataset.state); if (!st) return;
    walk.state = st.id; walk.to = st.to;
    startAt = { phase: "offer", gaps: offerThese(walk, st.leads), lead: "Here are three small things that fit where you are. Pick whichever you like.", said: st.door };
  } else if (b.dataset.go === "back") startAt = a.back || startAt;
  else if (b.dataset.go === "rest") startAt = { phase: "rest", said: "That's a good place to stop. What you built stays here until you close this page.", back: a };
  else if (b.dataset.go === "on") startAt = a.back || startAt;
  else if (b.dataset.go === "again") { newBridge(walk); startAt = { phase: "offer", gaps: offer(walk), lead: "A new bridge. Pick whichever you like.", said: "" }; }
  else if (b.dataset.go === "map") { showView("map"); return; }
  else return;
  renderStart();
  /* the keyboard goes where the eye goes: to the words box when there is one, else to the first thing that can be pressed next */
  const next = $("#wheretext") || $("#startbody .choice"); if (next) next.focus({ preventScroll: true });
});
renderStart();

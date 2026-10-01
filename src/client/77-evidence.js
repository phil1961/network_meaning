/* ─────────────────────────────────────────────
   File: src/client/77-evidence.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   The Evidence view (VISION.md §9, E17): what became of the machine's
   claims in this stream, counted from its steps up to the one in view. The
   counting is src/shared/evidence.js (inlined above); this module only
   draws it. It rewinds with the stream, calls nothing, and judges nobody. */
const evChoice = { accept: "suggestion used", keep: "kept as written", link: "linked", unrelated: "not related", talk: "picked up as a question", both: "both held", drop: "dropped", ok: "noted" };
const evMark = { new: "new to me", knew: "already knew", wrong: "wrong" };

function evTable(title, note, rows) {
  return `<div class="card ev"><h3>${esc(title)}</h3>${note ? `<p class="small" style="margin:0">${esc(note)}</p>` : ""}
    <table class="evt"><tbody>${rows.filter(Boolean).map(r => `<tr${r[2] ? ` class="${r[2]}"` : ""}><th scope="row">${esc(r[0])}</th><td>${esc(String(r[1]))}</td></tr>`).join("")}</tbody></table></div>`;
}
/* "3 of 5": how many of the claims that were decided went one way. */
function evOf(n, total) { return total ? `${n} of ${total}` : "0"; }

function renderEvidence() {
  const el = $("#evidencebody"); if (!el) return;
  const E = evidence(stream.steps.slice(0, cursor));
  $("#evidencewhen").textContent = isRewound() ? `As it stood at step ${cursor} of ${stream.steps.length}.` : `Counted from all ${stream.steps.length} step${stream.steps.length === 1 ? "" : "s"}.`;
  if (evidenceEmpty(E)) { el.innerHTML = `<p class="empty">Nothing to count yet. Evidence appears once the AI has read some text or made suggestions, or once suppositions have been put forth.</p>`; return; }
  const L = E.loose, types = Object.entries(L.byType).map(([k, v]) => `${v} ${leName[k] ? leName[k].toLowerCase() : k}`).join(", ");
  const choices = Object.entries(L.byChoice).map(([k, v]) => `${v} ${evChoice[k] || k}`).join(", ");
  let h = "";
  if (E.passes) h += evTable("From your text", "What the AI was given and what it put on the map in your own words.", [
    ["Passes of text read", E.passes],
    ["Ideas in your words", E.words.ideas],
    ["Ideas you said again", E.words.again],
    ["Ideas you replaced with a later version", E.words.replaced],
    ["Items the AI proposed that pointed at nothing in your text, and were dropped", E.dropped, E.dropped ? "warn" : ""]
  ]);
  if (E.readings.made) h += evTable("The AI's readings", "Interpretations the AI added. You keep one or discard it.", [
    ["Readings made", E.readings.made],
    ["You kept", evOf(E.readings.kept, E.readings.made), "good"],
    ["You discarded", evOf(E.readings.discarded, E.readings.made), E.readings.discarded ? "warn" : ""],
    ["Not decided yet", E.readings.open]
  ]);
  if (E.goals.read || E.goals.moves) h += evTable("Goals the AI read in your text", "A goal read in text is only a proposal until you say so.", [
    ["Goals read", E.goals.read],
    ["You confirmed", evOf(E.goals.accepted, E.goals.read), "good"],
    ["You said not a goal", evOf(E.goals.rejected, E.goals.read), E.goals.rejected ? "warn" : ""],
    ["Not decided yet", E.goals.open],
    ["Moves read in text", E.goals.moves]
  ]);
  if (L.raised) h += evTable("Loose ends", "Things the AI noticed and left for you to decide.", [
    ["Raised", L.raised + (types ? ` (${types})` : "")],
    ["Settled", L.settled + (choices ? ` (${choices})` : "")],
    ["Still open", L.open + (L.later ? ` (${L.later} put off)` : "")]
  ]);
  if (E.help.analyses) h += evTable("Help analysis", "Your word on each suggestion: new to me, already knew, or wrong.", [
    ["Times pressed", E.help.analyses],
    ["Suggestions made", E.help.suggestions],
    ["New to me", evOf(E.help.new, E.help.suggestions), "good"],
    ["Already knew", evOf(E.help.knew, E.help.suggestions)],
    ["Wrong", evOf(E.help.wrong, E.help.suggestions), E.help.wrong ? "warn" : ""],
    ["Not marked yet", E.help.unmarked]
  ]);
  if (E.suppositions.made || E.suppositions.given) h += evTable("Suppositions on the world maps", "These were put forth by you or by a script, not by the AI. They are counted the same way.", [
    ["Put forth as given", E.suppositions.given],
    ["Put forth as supposed", E.suppositions.made],
    ["Confirmed", evOf(E.suppositions.confirmed, E.suppositions.made), "good"],
    ["Ruled out", evOf(E.suppositions.ruledOut, E.suppositions.made), E.suppositions.ruledOut ? "warn" : ""],
    ["Still supposed", E.suppositions.open]
  ]);
  if (E.byModel.length) h += `<div class="card ev wide"><h3>By model</h3><p class="small" style="margin:0">The same counts, split by which model made the claim. This is what a change of Depth, or of a prompt, should be judged by.</p>
    <div class="evscroll"><table class="evt cols"><thead><tr><th scope="col">Model</th><th scope="col">Passes</th><th scope="col">Ideas</th><th scope="col">Dropped</th><th scope="col">Readings kept</th><th scope="col">Readings discarded</th><th scope="col">Goals confirmed</th><th scope="col">Goals refused</th><th scope="col">Suggestions: new, knew, wrong</th></tr></thead><tbody>${E.byModel.map(m =>
      `<tr><th scope="row">${esc(m.model)}</th><td>${m.passes}</td><td>${m.ideas}</td><td>${m.dropped}</td><td>${evOf(m.kept, m.readings)}</td><td>${evOf(m.discarded, m.readings)}</td><td>${evOf(m.accepted, m.goals)}</td><td>${evOf(m.rejected, m.goals)}</td><td>${m.suggestions ? `${m.new}, ${m.knew}, ${m.wrong} of ${m.suggestions}` : "0"}</td></tr>`).join("")}</tbody></table></div></div>`;
  el.innerHTML = h;
}

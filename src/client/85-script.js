/* ─────────────────────────────────────────────
   File: src/client/85-script.js
   File Version: 0.4.0
   ─────────────────────────────────────────────
   The Script view and the stepper. The language itself is in
   src/shared/script.js (inlined above): parseScript() reads the text and
   planStep() says what one line should do. This module carries each plan
   out through the same functions the buttons call, one line at a time, and
   shows the view where it happened. The stepper is a dock under the page
   that stays in view on every tab while a script is open. */
let srun = null; /* { steps, i, names, date, busy, playing, msg, error, marks:[] } while a script is open */
const viewWord = { map: "the map", state: "State", add: "Add text", loose: "Loose Ends", timeline: "the timeline", talk: "Talk", script: "Script" };

function scriptCheck() {
  const p = parseScript($("#scripttext").value);
  const st = $("#scriptstatus"), el = $("#scripterrors");
  const calls = p.steps.filter(s => s.verb === "text" || s.verb === "help").length;
  if (p.errors.length) { st.textContent = `${p.errors.length} line${p.errors.length === 1 ? "" : "s"} can't be read. Nothing runs until they are fixed.`; st.classList.add("bad"); }
  else { st.textContent = p.steps.length ? `${p.steps.length} line${p.steps.length === 1 ? "" : "s"} to run` + (calls ? `, ${calls} of them call${calls === 1 ? "s" : ""} the model.` : ". No model calls.") : "Nothing to run yet."; st.classList.remove("bad"); }
  el.hidden = !p.errors.length;
  el.innerHTML = p.errors.map(e => `<li><span class="n">line ${e.line}</span>${esc(e.message)}</li>`).join("");
  $("#scriptopen").disabled = !!p.errors.length || !p.steps.length;
  return p;
}
function scriptOpen() {
  const p = scriptCheck();
  if (p.errors.length || !p.steps.length) return;
  srun = { steps: p.steps, i: 0, names: {}, date: null, busy: false, playing: false, msg: "Press Step to run the first line, or Play to run them all.", error: "", marks: [] };
  lsSet("nm.script", $("#scripttext").value);
  renderDock();
}
function renderDock() {
  $("#dock").hidden = !srun;
  if (!srun) return;
  const n = srun.steps.length, done = srun.i >= n;
  $("#dockpos").textContent = done ? `Done · ${n} of ${n} run` : `${srun.i} of ${n} run · next is line ${srun.steps[srun.i].line}`;
  $("#docklines").innerHTML = srun.steps.map((s, k) => {
    const cls = k < srun.i ? "done" : k === srun.i ? (srun.error ? "cur err" : "cur") : "";
    return `<li class="${cls}"><span class="mk">${k < srun.i ? "✓" : k === srun.i ? (srun.error ? "!" : srun.busy ? "…" : "▶") : ""}</span><span class="n">${s.line}</span><code>${esc(s.raw)}</code></li>`;
  }).join("");
  const cur = $("#docklines li.cur") || $("#docklines li:last-child");
  if (cur) { const ol = $("#docklines"); ol.scrollTop = Math.max(0, cur.offsetTop - ol.clientHeight / 2 + cur.offsetHeight / 2); }
  const m = $("#dockmsg"); m.textContent = srun.error || srun.msg || ""; m.classList.toggle("bad", !!srun.error);
  $("#dockstep").disabled = srun.busy || srun.playing || done;
  $("#dockplay").disabled = done || (srun.busy && !srun.playing);
  $("#dockplay").textContent = srun.playing ? "Pause" : "Play";
  for (const id of ["#dockrestart", "#dockedit", "#dockclose"]) $(id).disabled = srun.busy;
}

/* Show where a step landed: the right view, the thing itself, a brief mark. */
function srShow(at, type) {
  if (!at) return;
  if (at.on === "idea") {
    showView("map");
    if (!S.nodes[at.id]) return;
    /* While a map is being assembled, keep its middle where it is: a new
       item or link shows up around it instead of taking the middle. */
    const here = focus && S.nodes[focus] && mapOf(S.nodes[focus]) === mapSel;
    const onMap = id => S.nodes[id] && mapOf(S.nodes[id]) === mapSel;
    if ((type === "item" || type === "link") && here && (onMap(at.id) || onMap(at.also))) renderMap(); else setFocus(at.id);
    for (const id of [at.id, at.also]) {
      if (!id) continue;
      const g = svg.querySelector(`[data-id="${CSS.escape(id)}"]`) || $("#maploose").querySelector(`[data-go="${CSS.escape(id)}"]`);
      if (g) g.classList.add("flash");
    }
    return;
  }
  if (at.on === "flag") { showView("loose"); return; }
  showView("state");
  const el = document.querySelector(`[data-${at.on === "state" ? "state" : "goal"}="${CSS.escape(at.id)}"]`);
  if (!el) return;
  reveal(el); el.classList.add("flash");
}

/* Carry out one line. Returns what to say in the stepper; throws a plain
   sentence when the line can't run. */
async function srExec(s) {
  const plan = planStep(s, S, srun.names, newId);
  if (plan.error) throw plan.error;
  const needUser = () => { if (!me && !visiting) { showLogin(); throw "Sign in first, then press Step again."; } };
  const needRegistered = what => { if (isGuest()) { needUserInfo(what); throw "This line uses the AI, which is for registered users. A guest can run every other line."; } };
  switch (plan.do) {
    case "note": return plan.text;
    case "date": srun.date = plan.date; return `Steps from here are dated ${plan.date}.`;
    case "show": showView(plan.view); if (plan.map) { setMap(plan.map); return `Showing the map of ${mapWord[plan.map]}.`; } return `Showing ${viewWord[plan.view] || plan.view}.`;
    case "focus": showView("map"); setFocus(plan.id); return `On the map: “${S.nodes[plan.id].t}”.`;
    case "rewind": {
      if (plan.to > stream.steps.length) throw `This stream has only ${stream.steps.length} step${stream.steps.length === 1 ? "" : "s"}.`;
      cursor = plan.to; rebuild();
      return `Viewing step ${plan.to} of ${stream.steps.length}. Later steps are kept.`;
    }
    case "latest": cursor = stream.steps.length; rebuild(); return "Back to the latest step.";
    case "branch": {
      needUser();
      if (!await branchHere()) throw "Couldn't branch.";
      return `Branched. Now in “${stream.name}”.`;
    }
    case "stream": {
      needUser();
      if (!await newEmpty(plan.name)) throw "Couldn't start the stream.";
      srun.names = {}; showView("state");
      return `Started the stream “${plan.name}”.`;
    }
    case "action": {
      needUser();
      if (isRewound()) throw "The stream is showing an earlier step. Put a “latest” line before this one.";
      if (["keep", "discard", "anchor"].includes(plan.action.type)) { showView("map"); setFocus(plan.at.id); }
      const back = plan.action.type === "discard" ? (S.nodes[plan.action.id].basis || []).find(b => S.nodes[b]) : null;
      if (!await recordAction(plan.action, "script", srun.date)) throw "Couldn't write to the stream.";
      if (plan.action.type === "discard") focus = back || null;
      const made = stream.steps[stream.steps.length - 1];
      rebuild();
      await saveChain; /* each line is saved before the next one runs */
      if (saveProblem) throw saveProblem;
      if (plan.bind) srun.names[plan.bind.name] = { on: plan.bind.on, id: plan.bind.id };
      srShow(plan.action.type === "discard" ? null : plan.at, plan.action.type);
      return stepLabel(made) + (plan.action.type === "flag" && S.outcomes[plan.action.flagId] ? ". " + S.outcomes[plan.action.flagId] : "");
    }
    case "ingest": {
      needUser(); needRegistered("A “text” line");
      if (busy) throw "The app is busy with another pass.";
      if (!await ensureWritable(true)) throw isRewound() ? "The stream is showing an earlier step. Put a “latest” line before this one." : "Couldn't write to the stream.";
      showView("add"); busy = true; renderAdd();
      try { await saveChain; await ingestOne(plan.text, plan.source, $("#tier").value, srun.date); setStatus("Done. The map is updated."); }
      catch (e) { const m = e && e.message ? e.message : "Something went wrong on the way."; setStatus(m, true); throw m; }
      finally { busy = false; ctl = null; renderAdd(); }
      const L = lastSummary;
      showView(L.goals || L.moves ? "state" : "map");
      return `Added from ${L.source}: ${L.ideas} idea${L.ideas === 1 ? "" : "s"}, ${L.readings} reading${L.readings === 1 ? "" : "s"}, ${L.goals} goal${L.goals === 1 ? "" : "s"} to confirm, ${L.moves} move${L.moves === 1 ? "" : "s"}, ${L.flags} loose end${L.flags === 1 ? "" : "s"}.`;
    }
    case "analyze": {
      needUser(); needRegistered("A “help” line");
      if (isRewound()) throw "The stream is showing an earlier step. Put a “latest” line before this one.";
      showView("state"); $("#helpcard").scrollIntoView({ block: "start" });
      const before = stream.steps.length;
      await runHelp(srun.date);
      if (helpProblem) throw helpProblem;
      if (stream.steps.length === before) throw "Help analysis did not run.";
      const k = S.analysis ? S.analysis.suggestions.length : 0;
      return `Help analysis: ${k} suggestion${k === 1 ? "" : "s"}.` + (k ? ` First: ${S.analysis.suggestions[0].text}` : "");
    }
    default: throw "That line can't be run.";
  }
}

async function srStep() {
  const r = srun;
  if (!r || r.busy || r.i >= r.steps.length) return false;
  r.busy = true; r.error = ""; renderDock();
  let ok = true;
  try { r.msg = await srExec(r.steps[r.i]); r.i++; }
  catch (e) { ok = false; r.playing = false; r.error = `Line ${r.steps[r.i].line}: ` + (typeof e === "string" ? e : e && e.message ? e.message : "Something went wrong."); }
  r.busy = false;
  if (r.i >= r.steps.length) r.playing = false;
  if (srun === r) renderDock();
  return ok;
}
async function srPlay() {
  const r = srun;
  if (!r || r.playing) return;
  r.playing = true; renderDock();
  while (srun === r && r.playing && r.i < r.steps.length) {
    if (!await srStep()) break;
    if (r.playing && r.i < r.steps.length) await new Promise(res => setTimeout(res, +$("#dockpace").value || 1300));
  }
  r.playing = false; if (srun === r) renderDock();
}

$("#dockstep").addEventListener("click", srStep);
$("#dockplay").addEventListener("click", () => { if (!srun) return; if (srun.playing) { srun.playing = false; renderDock(); } else srPlay(); });
$("#dockrestart").addEventListener("click", () => { if (!srun || srun.busy) return; srun.playing = false; scriptOpen(); });
$("#dockedit").addEventListener("click", () => { if (srun) srun.playing = false; renderDock(); showView("script"); $("#scripttext").focus(); });
$("#dockclose").addEventListener("click", () => { if (srun && srun.busy) return; srun = null; renderDock(); });
$("#scriptopen").addEventListener("click", scriptOpen);
$("#scripttext").addEventListener("input", () => { scriptCheck(); lsSet("nm.script", $("#scripttext").value); });
$("#scriptsel").addEventListener("change", e => { const x = SCRIPT_EXAMPLES[e.target.value]; if (x) { $("#scripttext").value = x.text; lsSet("nm.script", x.text); scriptCheck(); } e.target.value = ""; });

/* first paint: the examples, the reference, and the last script worked on */
$("#scriptsel").innerHTML = `<option value="">Choose a built-in script…</option>` + Object.entries(SCRIPT_EXAMPLES).map(([k, x]) => `<option value="${esc(k)}">${esc(x.name)}</option>`).join("");
$("#scripthelp").innerHTML = SCRIPT_HELP.map(([form, what]) => `<dt><code>${esc(form)}</code></dt><dd>${esc(what)}</dd>`).join("");
$("#scripttext").value = lsGet("nm.script") || SCRIPT_EXAMPLES.hand.text;
scriptCheck();

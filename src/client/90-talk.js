/* ─────────────────────────────────────────────
   File: src/client/90-talk.js
   File Version: 0.2.0
   ─────────────────────────────────────────────
   Talk: a simulated voice session. Real capture with confidence scores
   is a later milestone; this shows the shape of it. The session is made
   up (Darlene, talking about Thursday): nobody's real words are in the
   page that every visitor receives. */
const sampleQ = "You said you just assumed your mother would want to go. Then she told you she doesn't. What did she say when you asked her why?";
const script = "So I took Thursday morning off to drive Mom to the eye doctor. I just assumed she'd want to go. … Then she tells me she doesn't want to go at all. … I called the @@GARBLE to see if we could move it, and they said Thursday is the only opening this month. And my brother still hasn't called me back.".split(" ");
const stepsData = [
  ["Transcribed", "1:12 of audio, word by word, with confidence scores"],
  ["Cut into spans", "6 numbered pieces. Everything else points back to these."],
  ["Proposed ideas and links", "Each one cites its spans, or it's thrown out"],
  ["Matched against your map", "2 already there (strengthened), 2 new"],
  ["Flagged a garble", "“off the mall adjust”, sent to Loose Ends, not auto-fixed"],
  ["Scored surprise", "Highest: “I just assumed she'd want to go” against “she doesn't want to go”"],
  ["Chose one question", "From the strongest tension, in your own words"],
  ["Saved the pass as a step", "So the stream can be rewound or branched later"]
];
function renderSteps(on) { $("#steps").innerHTML = stepsData.map((s, i) => `<li class="${i < on ? "on" : ""}"><span class="n">${String(i + 1).padStart(2, "0")}</span><span><b>${esc(s[0])}</b><span class="d">${esc(s[1])}</span></span></li>`).join(""); }
let recTimer = null, recIdx = 0, clockT = 0, clockTimer = null, talkState = "idle";
function wordHTML(w) { return w === "@@GARBLE" ? `<span class="garble" title="Low confidence. ophthalmologist?">off the mall adjust</span>` : esc(w); }
function startRec() {
  talkState = "rec"; recIdx = 0; clockT = 0; $("#transcript").innerHTML = ""; renderSteps(0); $("#qcard").hidden = true;
  const mic = $("#mic"); mic.classList.add("rec"); mic.setAttribute("aria-label", "Stop talking"); $("#miclabel").textContent = "Listening… tap to stop";
  clockTimer = setInterval(() => { clockT++; $("#clock").textContent = Math.floor(clockT / 60) + ":" + String(clockT % 60).padStart(2, "0"); }, 1000);
  if (reduceMotion) { recIdx = 0; stopRec(); return; }
  recTimer = setInterval(() => { if (recIdx >= script.length) { stopRec(); return; } const tr = $("#transcript"); tr.insertAdjacentHTML("beforeend", (recIdx ? " " : "") + wordHTML(script[recIdx])); tr.scrollTop = tr.scrollHeight; recIdx++; }, 90);
}
function stopRec() {
  clearInterval(recTimer); clearInterval(clockTimer);
  if (recIdx < script.length) { $("#transcript").insertAdjacentHTML("beforeend", script.slice(recIdx).map((w, i) => (recIdx + i ? " " : "") + wordHTML(w)).join("")); recIdx = script.length; }
  $("#clock").textContent = "1:12";
  const mic = $("#mic"); mic.classList.remove("rec"); mic.setAttribute("aria-label", "Start talking"); $("#miclabel").textContent = "Thinking…";
  talkState = "proc"; let i = 0;
  const tick = () => { i++; renderSteps(i); if (i < stepsData.length) setTimeout(tick, reduceMotion ? 0 : 380); else { talkState = "done"; $("#miclabel").textContent = "Tap to talk again"; $("#qfrom").textContent = "One question"; $("#qtext").textContent = sampleQ; $("#qcard").hidden = false; } };
  setTimeout(tick, reduceMotion ? 0 : 300);
}
$("#mic").addEventListener("click", () => { if (talkState === "rec") stopRec(); else if (talkState !== "proc") startRec(); });
$("#qanswer").addEventListener("click", () => { openQuestion(sampleQ, "From the voice sample"); $("#qcard").hidden = true; showView("add"); });
$("#qlater").addEventListener("click", () => { $("#qcard").hidden = true; toast("In the full app, this goes to Loose Ends."); });

/* ─────────────────────────────────────────────
   File: src/client/90-talk.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   Talk: a simulated voice session. Real capture with confidence scores
   is a later milestone; this shows the shape of it. */
const sampleQ = "You said faith becomes “part of the furniture” once it's habitual. Then you said Peter sank when he started thinking. Is thinking what breaks the furniture, or is it something else?";
const script = "And we trust the car will start. After a while, you stop thinking of it as a fantasy future. It becomes part of the furniture. … And Peter took a couple steps, and then began to think about the situation, and then fell into the water. … I reach for @@GARBLE because he seemed to have the most coherent speaking for a consciousness that is separate from us, but yet somehow our consciousness is a member of.".split(" ");
const stepsData = [
  ["Transcribed", "1:52 of audio, word by word, with confidence scores"],
  ["Cut into spans", "9 numbered pieces. Everything else points back to these."],
  ["Proposed ideas and links", "Each one cites its spans, or it's thrown out"],
  ["Matched against your map", "3 already there (strengthened), 1 new"],
  ["Flagged a garble", "“Verbenade Capsaro”, sent to Loose Ends, not auto-fixed"],
  ["Scored surprise", "Highest: “furniture” pulls against “Peter began to think”"],
  ["Chose one question", "From the strongest tension, in your own words"],
  ["Saved the pass as a step", "So the stream can be rewound or branched later"]
];
function renderSteps(on) { $("#steps").innerHTML = stepsData.map((s, i) => `<li class="${i < on ? "on" : ""}"><span class="n">${String(i + 1).padStart(2, "0")}</span><span><b>${esc(s[0])}</b><span class="d">${esc(s[1])}</span></span></li>`).join(""); }
let recTimer = null, recIdx = 0, clockT = 0, clockTimer = null, talkState = "idle";
function wordHTML(w) { return w === "@@GARBLE" ? `<span class="garble" title="Low confidence. Bernardo Kastrup?">Verbenade Capsaro</span>` : esc(w); }
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
  $("#clock").textContent = "1:52";
  const mic = $("#mic"); mic.classList.remove("rec"); mic.setAttribute("aria-label", "Start talking"); $("#miclabel").textContent = "Thinking…";
  talkState = "proc"; let i = 0;
  const tick = () => { i++; renderSteps(i); if (i < stepsData.length) setTimeout(tick, reduceMotion ? 0 : 380); else { talkState = "done"; $("#miclabel").textContent = "Tap to talk again"; $("#qfrom").textContent = "One question"; $("#qtext").textContent = sampleQ; $("#qcard").hidden = false; } };
  setTimeout(tick, reduceMotion ? 0 : 300);
}
$("#mic").addEventListener("click", () => { if (talkState === "rec") stopRec(); else if (talkState !== "proc") startRec(); });
$("#qanswer").addEventListener("click", () => { openQuestion(sampleQ, "From the voice sample"); $("#qcard").hidden = true; showView("add"); });
$("#qlater").addEventListener("click", () => { $("#qcard").hidden = true; toast("In the full app, this goes to Loose Ends."); });

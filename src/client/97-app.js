/* ─────────────────────────────────────────────
   File: src/client/97-app.js
   File Version: 0.2.0
   ─────────────────────────────────────────────
   Views, sign-in, and boot. Last module: everything above is defined. */
function renderAll() { renderStreamBar(); renderMap(); renderStateView(); renderLE(); renderTimeline(); renderAdd(); }
function showView(v) {
  document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-selected", String(t.dataset.view === v)));
  document.querySelectorAll(".view").forEach(s => { s.hidden = s.id !== "view-" + v; });
  if (v === "timeline") renderTimeline();
  if (v === "add") renderAdd();
  if (v === "state") renderStateView();
  try { history.replaceState(null, "", "#" + v); } catch (e) { /* file:// */ }
}
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => showView(t.dataset.view)));

/* sign-in */
function showLogin() { me = null; $("#loginscrim").hidden = false; renderWho(); renderSave(); setTimeout(() => $("#password").focus(), 0); }
function hideLogin() { $("#loginscrim").hidden = true; }
function renderWho() {
  $("#who").innerHTML = me ? `<span>${esc(me.email)}</span><button class="linkbtn" id="signout">Sign out</button>` : "";
}
$("#loginform").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = $("#loginbtn"); btn.disabled = true; $("#loginstatus").textContent = "";
  try {
    me = await api.login($("#password").value);
    $("#password").value = ""; hideLogin(); renderWho();
    await afterSignIn();
  } catch (err) { $("#loginstatus").textContent = err && err.message ? err.message : "Couldn't sign in."; }
  btn.disabled = false;
});
$("#who").addEventListener("click", async e => {
  if (e.target.id !== "signout") return;
  try { await api.logout(); } catch (err) { /* cookie is gone either way */ }
  savedStreams = []; openSample(); showLogin();
});
async function afterSignIn() {
  await refreshList();
  const last = lsGet("nm.lastStream");
  if (last && SAMPLES[last] && last !== stream.builtin) openSample(last);
  else if (last && !SAMPLES[last] && savedStreams.some(s => s.id === last)) await openSaved(last);
  else rebuild();
}

/* boot */
$("#buildpill").textContent = "v" + BUILD.version;
renderSteps(0);
{ const last = lsGet("nm.lastStream"); if (last && SAMPLES[last] && last !== "sample") openSample(last); else rebuild(); }
const h0 = (location.hash || "").slice(1); if (["map", "state", "add", "loose", "timeline", "talk"].includes(h0)) showView(h0);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => renderMap());
(async () => {
  try { me = await api.me(); renderWho(); await afterSignIn(); }
  catch (e) { if (e.code !== "signed_out") toast(e.message || "Couldn't reach the server."); }
})();

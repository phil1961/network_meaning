/* ─────────────────────────────────────────────
   File: src/client/97-app.js
   File Version: 0.7.1
   ─────────────────────────────────────────────
   Views, sign-in, sign-up and looking around as a guest, changing your own
   password, and boot. Last module: everything above is defined. */
function renderAll() { renderStreamBar(); renderMap(); renderStateView(); renderLE(); renderTimeline(); renderEvidence(); renderAdd(); }
function showView(v) {
  if (v === "admin" && !(me && me.admin)) v = "map";
  document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-selected", String(t.dataset.view === v)));
  document.querySelectorAll(".view").forEach(s => { s.hidden = s.id !== "view-" + v; });
  if (v === "map") fitMap();
  if (v === "timeline") renderTimeline();
  if (v === "evidence") renderEvidence();
  if (v === "add") renderAdd();
  if (v === "state") renderStateView();
  if (v === "admin") loadPeople();
  try { history.replaceState(null, "", "#" + v); } catch (e) { /* file:// */ }
}
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => showView(t.dataset.view)));

/* sign-in and sign-up share one card. signingUp says which it is showing. */
let signingUp = false;
function renderLogin() {
  const canSignUp = signupHow !== "closed";
  if (!canSignUp) signingUp = false;
  $("#loginlead").textContent = signingUp ? "Create an account with your email. You get an area of your own for your streams." : "This is the inside of someone's head. Sign in to open it.";
  $("#loginbtn").textContent = signingUp ? "Create my account" : "Sign in";
  $("#loginswap").hidden = !canSignUp;
  $("#loginswap").textContent = signingUp ? "I already have an account" : "Create an account";
  $("#invitewrap").hidden = !(signingUp && signupHow === "code");
  $("#email").required = signingUp;
  $("#password").autocomplete = signingUp ? "new-password" : "current-password";
  $("#password").placeholder = signingUp ? "8 or more characters" : "";
}
function showLogin(up) { me = null; if (up !== undefined) signingUp = !!up; $("#loginscrim").hidden = false; renderLogin(); renderWho(); renderSave(); setTimeout(() => ($("#email").value ? $("#password") : $("#email")).focus(), 0); }
function hideLogin() { $("#loginscrim").hidden = true; }
function renderWho() {
  $("#who").innerHTML = me ? `<span>${esc(me.email)}${me.level === "guest" ? " · guest, nothing is saved" : ""}</span><button class="linkbtn" id="changepw">Change password</button><button class="linkbtn" id="signout">Sign out</button>`
    : visiting ? `<span>Guest · nothing is saved</span><button class="linkbtn" id="signin">Sign in or create an account</button>` : "";
  $("#tab-admin").hidden = !(me && me.admin);
  if (!(me && me.admin) && !$("#view-admin").hidden) showView("map");
}
/* Look around with no account. Everything that needs no AI works, in this tab only. */
$("#loginguest").addEventListener("click", () => { visiting = true; hideLogin(); renderWho(); renderAll(); toast("You're looking around as a guest. Nothing you do is saved."); });

/* The AI is for registered users (Phil, 2026-09-30). A guest who presses an
   AI button gets this box instead of a call. */
function needUserInfo(what) {
  const account = !!me; /* signed in at the guest level, as against no account at all */
  $("#infotitle").textContent = "For registered users";
  $("#infotext").textContent = `${what} uses the AI, and the AI is for registered users. As a guest you can do everything else here, and nothing you do is saved. ` + (account ? "You are signed in as a guest: an admin has to make you a user." : signupHow === "closed" ? "To become a registered user, ask an admin to add you." : "To use it, become a registered user: create an account.");
  $("#infogo").hidden = account || signupHow === "closed";
  $("#infoscrim").hidden = false; $("#infoclose").focus();
}
$("#infoclose").addEventListener("click", () => { $("#infoscrim").hidden = true; });
$("#infoscrim").addEventListener("click", e => { if (e.target.id === "infoscrim") $("#infoscrim").hidden = true; });
$("#infogo").addEventListener("click", () => { $("#infoscrim").hidden = true; showLogin(true); });

$("#loginswap").addEventListener("click", () => { signingUp = !signingUp; $("#loginstatus").textContent = ""; renderLogin(); $("#email").focus(); });
$("#loginform").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = $("#loginbtn"); btn.disabled = true; $("#loginstatus").textContent = "";
  try {
    me = signingUp ? await api.signup($("#email").value, $("#password").value, $("#invite").value) : await api.login($("#email").value, $("#password").value);
    const fresh = signingUp;
    $("#password").value = ""; $("#invite").value = ""; signingUp = false; visiting = false; hideLogin(); renderWho();
    await afterSignIn();
    if (fresh) toast("Your account is ready. The samples are yours to try; acting on one starts your own copy.");
  } catch (err) { $("#loginstatus").textContent = err && err.message ? err.message : signingUp ? "Couldn't create the account." : "Couldn't sign in."; }
  btn.disabled = false;
});
/* Change your own password (Phil, 2026-09-30). You give the current one and the new one twice. */
function showPassword() {
  if (!me) return;
  for (const id of ["#pwcurrent", "#pwnew", "#pwagain"]) $(id).value = "";
  $("#pwstatus").textContent = ""; $("#pwstatus").classList.remove("bad");
  $("#pwlead").textContent = `For ${me.email}. Signing in on your other devices stays as it is until they sign out.`;
  $("#pwscrim").hidden = false; setTimeout(() => $("#pwcurrent").focus(), 0);
}
$("#pwclose").addEventListener("click", () => { $("#pwscrim").hidden = true; });
$("#pwscrim").addEventListener("click", e => { if (e.target.id === "pwscrim") $("#pwscrim").hidden = true; });
$("#pwform").addEventListener("submit", async e => {
  e.preventDefault();
  const st = $("#pwstatus"), say = (msg, bad) => { st.textContent = msg; st.classList.toggle("bad", !!bad); };
  if ($("#pwnew").value !== $("#pwagain").value) { say("The two new passwords are not the same.", true); $("#pwagain").focus(); return; }
  const btn = $("#pwsave"); btn.disabled = true; say("");
  try { await api.changePassword($("#pwcurrent").value, $("#pwnew").value); $("#pwscrim").hidden = true; toast("Your password is changed."); }
  catch (err) { if (err.code === "signed_out") $("#pwscrim").hidden = true; else say(err.message || "Couldn't change the password.", true); }
  btn.disabled = false;
});

$("#who").addEventListener("click", async e => {
  if (e.target.id === "signin") { showLogin(false); return; }
  if (e.target.id === "changepw") { showPassword(); return; }
  if (e.target.id !== "signout") return;
  try { await api.logout(); } catch (err) { /* cookie is gone either way */ }
  savedStreams = []; people = []; visiting = false; saveQueue = []; saveProblem = null; delete SAMPLES.sample; openSample(); showLogin(false);
});
async function afterSignIn() {
  /* the owner's own sample comes from the server, for the owner alone */
  delete SAMPLES.sample;
  try { for (const x of await api.samples()) SAMPLES[x.key] = { name: x.name, steps: x.steps }; } catch (e) { /* the samples everyone has are enough */ }
  if (stream.builtin && !SAMPLES[stream.builtin]) openSample();
  await refreshList();
  /* someone who was working as a guest and is now a user keeps that work: it is stored from here on */
  if (stream.local && !isGuest() && stream.steps.length) {
    try { const s = await api.createStream({ name: stream.name, steps: stream.steps.map(snapshotStep) }); await refreshList(); await openSaved(s.id); toast("The stream you made as a guest is saved now."); return; }
    catch (e) { if (e.code !== "signed_out") toast("Couldn't save the stream you made as a guest."); }
  }
  const last = lsGet("nm.lastStream");
  if (last && SAMPLES[last] && last !== stream.builtin) openSample(last);
  else if (last && !SAMPLES[last] && savedStreams.some(s => s.id === last)) await openSaved(last);
  else if (!stream.builtin && !(stream.local && isGuest()) && !savedStreams.some(s => s.id === stream.id)) openSample(); /* the stream on screen belongs to whoever was signed in before */
  else rebuild();
  if (me && me.admin && !$("#view-admin").hidden) loadPeople();
}

/* boot */
$("#buildpill").textContent = "v" + BUILD.version;
renderSteps(0);
{ const last = lsGet("nm.lastStream"); if (last && SAMPLES[last] && last !== DEFAULT_SAMPLE) openSample(last); else rebuild(); }
const h0 = (location.hash || "").slice(1); if (["map", "state", "add", "loose", "timeline", "evidence", "talk", "script", "help"].includes(h0)) showView(h0);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => renderMap());
(async () => {
  try { signupHow = (await api.auth()).signup; } catch (e) { /* the card just offers sign-in */ }
  renderLogin();
  try { me = await api.me(); renderWho(); await afterSignIn(); if (h0 === "admin") showView("admin"); }
  catch (e) { if (e.code !== "signed_out") toast(e.message || "Couldn't reach the server."); }
})();

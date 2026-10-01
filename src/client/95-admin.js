/* ─────────────────────────────────────────────
   File: src/client/95-admin.js
   File Version: 0.2.1
   ─────────────────────────────────────────────
   The Admin tab: the admin panel (Phil, 2026-09-30). Who has an account, how they
   came by it, and what an admin can do: add someone, set their level
   (guest, user, admin), give them a new password, disable or enable them. Nothing here deletes a person or their
   streams. The server refuses all of it to anyone who is not an admin. */
let people = [], signupHow = "open", pwFor = null; /* pwFor: the id whose "new password" box is open */
const signupWord = { open: "Signing up is open: anyone who can reach this page can create an account.", code: "Signing up asks for the invite code set as SIGNUP_CODE in .env.", closed: "Signing up is closed (SIGNUP=closed in .env). Only people you add here can sign in." };

function renderAdmin() {
  $("#signupnote").textContent = signupWord[signupHow] || "";
  $("#userlist").innerHTML = people.length ? people.map(u => {
    const you = me && u.id === me.id;
    const chips = (u.owner ? `<span class="chip mine">owner</span>` : "") + `<span class="chip${u.level === "admin" ? " mine" : u.level === "guest" ? " supposed" : ""}">${esc(u.level)}</span>` + (u.disabled ? `<span class="chip replaced">disabled</span>` : "") + (you ? `<span class="chip">you</span>` : "");
    const how = u.owner ? "the owner, signs in with the server's password" : u.addedBy ? `added by ${esc(u.addedBy)}` : "signed up";
    let acts = "";
    if (!u.owner && !you) {
      acts = pwFor === u.id
        ? `<form class="inline" data-pw="${u.id}"><label class="small" for="pw-${u.id}">A new password for ${esc(u.email)}</label><div class="row"><input class="input grow" id="pw-${u.id}" type="text" autocomplete="off" placeholder="8 or more characters"><button class="btn primary" type="submit">Set it</button><button class="btn" type="button" data-pwcancel="1">Cancel</button></div></form>`
        : `<div class="actions"><label class="small" for="lv-${u.id}">Level</label><select id="lv-${u.id}" data-level="${u.id}">${["guest", "user", "admin"].map(l => `<option value="${l}"${l === u.level ? " selected" : ""}>${l[0].toUpperCase() + l.slice(1)}</option>`).join("")}</select><button class="btn" data-pwopen="${u.id}">Set a new password</button><button class="btn${u.disabled ? "" : " danger"}" data-disable="${u.id}" data-to="${u.disabled ? "0" : "1"}">${u.disabled ? "Enable" : "Disable"}</button></div>`;
    }
    return `<li class="le${u.disabled ? " done" : ""}" data-user="${u.id}"><div class="type">${chips}</div>
      <div class="body"><p class="text">${esc(u.email)}</p><p class="detail">${how} · since ${esc(stamp(u.createdAt))} · ${u.streams} stream${u.streams === 1 ? "" : "s"} · ${u.callsToday} model call${u.callsToday === 1 ? "" : "s"} in the last day</p>${acts}</div></li>`;
  }).join("") : `<li class="empty">Nobody yet.</li>`;
}
async function loadPeople() {
  if (!me || !me.admin) return;
  try { people = await api.users(); } catch (e) { if (e.code !== "signed_out") $("#adminstatus").textContent = e.message || "Couldn't load the list."; }
  renderAdmin();
}
function adminSay(msg, bad) { const s = $("#adminstatus"); s.textContent = msg || ""; s.classList.toggle("bad", !!bad); }

$("#adduser").addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("#newemail").value.trim(), password = $("#newpassword").value;
  try {
    const u = await api.addUser(email, password, $("#newlevel").value);
    $("#newemail").value = ""; $("#newpassword").value = ""; $("#newlevel").value = "user";
    adminSay(`Added ${u.email} as ${u.level === "admin" ? "an admin" : "a " + u.level}. Give them the password yourself; the app doesn't send mail.`);
    await loadPeople();
  } catch (err) { if (err.code !== "signed_out") adminSay(err.message || "Couldn't add them.", true); }
});
$("#userlist").addEventListener("click", async e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.pwopen) { pwFor = +b.dataset.pwopen; renderAdmin(); $(`#pw-${pwFor}`)?.focus(); return; }
  if (b.dataset.pwcancel) { pwFor = null; renderAdmin(); return; }
  if (b.dataset.disable) {
    const off = b.dataset.to === "1", u = people.find(x => x.id === +b.dataset.disable);
    try { await api.changeUser(+b.dataset.disable, { disabled: off }); adminSay(off ? `${u.email} can no longer sign in. Their streams are kept.` : `${u.email} can sign in again.`); await loadPeople(); }
    catch (err) { if (err.code !== "signed_out") adminSay(err.message || "Couldn't change that.", true); }
  }
});
const levelWord = { guest: "a guest: nothing they do is stored, and they cannot use the AI", user: "a user: what they do is stored", admin: "an admin: a user who can also add people and share streams" };
$("#userlist").addEventListener("change", async e => {
  const sel = e.target.closest("select[data-level]"); if (!sel) return;
  const u = people.find(x => x.id === +sel.dataset.level);
  try { await api.changeUser(u.id, { level: sel.value }); adminSay(`${u.email} is now ${levelWord[sel.value]}.`); }
  catch (err) { if (err.code !== "signed_out") adminSay(err.message || "Couldn't change the level.", true); }
  await loadPeople();
});
$("#userlist").addEventListener("submit", async e => {
  const f = e.target.closest("form[data-pw]"); if (!f) return;
  e.preventDefault();
  const id = +f.dataset.pw, u = people.find(x => x.id === id);
  try { await api.changeUser(id, { password: f.querySelector("input").value }); pwFor = null; adminSay(`New password set for ${u.email}. Give it to them yourself.`); await loadPeople(); }
  catch (err) { if (err.code !== "signed_out") adminSay(err.message || "Couldn't set the password.", true); }
});

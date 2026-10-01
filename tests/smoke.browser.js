#!/usr/bin/env node
/* ─────────────────────────────────────────────
   File: tests/smoke.browser.js
   File Version: 0.10.0
   ─────────────────────────────────────────────
   Boots the server (no database needed) and drives the built page in a
   real headless browser over the DevTools protocol, no npm packages.
   Same approach as the Markdown Editor's smoke check.

     node tests/smoke.browser.js [--headed] [--browser <exe>]

   Exit 0 = passed or skipped (no browser), 1 = a check failed, 2 = could
   not run. Not part of `node --test`; run it for any claim about layout
   or interaction. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const HEADED = args.includes("--headed");
const EXE = [opt("--browser"), process.env.NM_BROWSER,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(p => p && fs.existsSync(p));
if (!fs.existsSync(path.join(here, "..", "public", "index.html"))) { console.error("smoke: public/index.html is missing. Run: node build.js"); process.exit(2); }
if (!EXE) { console.log("smoke: skipped, no Brave, Chrome or Edge found. Pass --browser <exe> or set NM_BROWSER."); process.exit(0); }

process.env.SESSION_SECRET = "smoke-secret-smoke-secret";
process.env.APP_PASSWORD = "smoke";
delete process.env.DATABASE_URL;
const { handle } = await import("../server.js");
const server = http.createServer(handle);
await new Promise(r => server.listen(0, "127.0.0.1", r));
const URL_ = `http://127.0.0.1:${server.address().port}/`;

let pass = 0, fail = 0;
const ok = (c, label, detail) => { if (c) { pass++; console.log("  PASS  " + label); } else { fail++; console.log("  FAIL  " + label + (detail ? "\n          " + String(detail).slice(0, 500) : "")); } };
const pause = ms => new Promise(r => setTimeout(r, ms));

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "nm-smoke-"));
const proc = spawn(EXE, ["--remote-debugging-port=0", "--user-data-dir=" + profile, "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-sync", "--window-size=1400,900", ...(HEADED ? [] : ["--headless=new", "--disable-gpu"]), "about:blank"], { stdio: ["ignore", "ignore", "pipe"] });
let ws = null;
try {
  const wsUrl = await new Promise((res, rej) => {
    let buf = ""; const t = setTimeout(() => rej(new Error("no DevTools port within 20s")), 20000);
    proc.stderr.on("data", d => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); res(m[1]); } });
    proc.on("exit", c => { clearTimeout(t); rej(new Error("browser exited " + c)); });
  });
  ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("could not connect to DevTools")); });
  let seq = 0; const waiting = new Map(), listeners = [];
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id !== undefined && waiting.has(m.id)) { const w = waiting.get(m.id); waiting.delete(m.id); m.error ? w.rej(new Error(m.error.message)) : w.res(m.result); } else if (m.method) listeners.forEach(fn => fn(m)); };
  const send = (method, params, sessionId) => new Promise((res, rej) => { const id = ++seq; waiting.set(id, { res, rej }); ws.send(JSON.stringify(Object.assign({ id, method, params: params || {} }, sessionId ? { sessionId } : {}))); });
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId: S } = await send("Target.attachToTarget", { targetId, flatten: true });
  const errors = [];
  listeners.push(m => { if (m.sessionId !== S) return; if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map(x => x.value ?? x.description).join(" ")); });
  for (const d of ["Page.enable", "Runtime.enable"]) await send(d, {}, S);
  const js = async expr => { const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }, S); if (r.exceptionDetails) throw new Error("page: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result.value; };
  const click = async sel => { const box = await js(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; el.scrollIntoView({block:'center'}); const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2); return { x: r.left + r.width/2, y: r.top + r.height/2, reachable: r.width > 0 && el.contains(hit) }; })()`); if (!box || !box.reachable) throw new Error(sel + " is missing or covered"); for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: box.x, y: box.y, button: "left", clickCount: 1 }, S); await pause(80); };

  await send("Page.navigate", { url: URL_ }, S);
  await pause(1200);

  ok(errors.length === 0, "page loads with no script errors", errors.join(" | "));
  ok(await js("getComputedStyle(document.getElementById('loginscrim')).display !== 'none' && getComputedStyle(document.getElementById('scrim')).display === 'none'"), "sign-in card is visible and the draft modal is not");
  ok(await js("document.querySelectorAll('#map .node').length") === 5, "the page opens on Bobby's world: what was said, and one reading of the need on each other map");
  ok(await js("document.querySelector('#panel h2')?.textContent") === "He needs milk.", "side panel shows the item in the middle");
  ok(await js("document.querySelector('#panel .words')?.textContent.includes('needs milk')"), "the words are quoted in the panel");
  ok(await js("document.getElementById('scrubout').textContent.startsWith('63 of 63')"), "stream bar reports 63 of 63 steps");
  ok(await js("!document.documentElement.innerHTML.includes('Faith is furnished by memory') && ![...document.querySelectorAll('#streamsel option')].some(o => o.textContent.includes('archived'))"), "the owner's own sample is not in the page that everyone gets");

  /* wrong password stays on the card; the app underneath still renders */
  await js("document.getElementById('password').value = 'wrong'");
  await click("#loginbtn");
  await pause(900);
  ok(await js("document.getElementById('loginstatus').textContent.includes('password')"), "wrong password is reported on the card");
  ok(await js("document.getElementById('loginscrim').hidden === false"), "card stays up after a wrong password");

  /* signed-out browsing: hide the card and drive the Darlene sample */
  await js("document.getElementById('loginscrim').hidden = true");
  await js("document.getElementById('streamsel').value = 'darlene'; document.getElementById('streamsel').dispatchEvent(new Event('change'))");
  await pause(200);
  await click("#tab-loose");
  ok(await js("document.getElementById('view-loose').hidden === false && document.querySelectorAll('#lelist .le').length === 1"), "Loose Ends lists the one open question");
  await click("#tab-timeline");
  ok(await js("document.querySelectorAll('#timeline .lane').length") === 2, "timeline draws a lane for the sentence and one for the reading");
  await click("#tab-map");
  await js("document.getElementById('scrub').value = 2; document.getElementById('scrub').dispatchEvent(new Event('input'))");
  await pause(200);
  ok(await js("document.getElementById('rewound').hidden === false"), "rewinding shows the branch bar");
  ok(await js("document.getElementById('lecount').hidden === true || document.getElementById('lecount').textContent === '0'"), "loose ends are empty at step 2");
  await js("document.getElementById('scrub').value = 0; document.getElementById('scrub').dispatchEvent(new Event('input'))");
  await pause(200);
  ok(await js("document.getElementById('focuslabel').textContent.startsWith('Step 0')"), "step 0 is the empty map");
  await click("#tolatest");
  ok(await js("document.getElementById('rewound').hidden === true"), "back to latest hides the branch bar");
  await js("document.getElementById('q').value = 'counts on'; document.getElementById('q').dispatchEvent(new Event('input'))");
  ok(await js("document.querySelectorAll('#suggest button').length") === 1, "search finds the reading");
  await click("#suggest button");
  ok(await js("document.querySelector('#panel h2')?.textContent") === "She is the one the family counts on", "search opens it, marked as the machine's reading");
  ok(await js("!!document.querySelector('#panel [data-keep]') && !!document.querySelector('#panel [data-discard]')"), "a reading can be kept or discarded");
  await click("[data-draft]");
  ok(await js("document.getElementById('scrim').hidden === false && document.querySelectorAll('#draftbody blockquote').length") >= 1, "draft quotes the words verbatim");
  ok(await js("document.getElementById('draftmd').value.includes('> Darlene took Thursday morning off to drive her mother to the eye doctor.') && document.getElementById('draftmd').value.includes('[my reading]')"), "draft markdown keeps the words and marks the reading");
  await click("#closedraft");
  await click("#tab-talk");
  await click("#mic");
  await pause(400);
  ok(await js("document.getElementById('transcript').textContent.includes('drive Mom to the eye doctor') && document.querySelector('#transcript .garble')?.textContent === 'off the mall adjust'"), "talk demo plays a made-up session, with one mis-heard word marked");
  ok(await js("!document.documentElement.innerHTML.includes('Verbenade') && !document.documentElement.innerHTML.includes('Phil talking')"), "and none of the owner's own words are in it");
  ok(await js("getComputedStyle(document.querySelector('header')).backgroundColor !== getComputedStyle(document.body).backgroundColor && getComputedStyle(document.body).backgroundColor !== 'rgb(237, 240, 242)'"), "the app has its colours: a matte background and a header band of its own");

  /* the state layer, on the Darlene sample */
  await js("document.getElementById('streamsel').value = 'darlene'; document.getElementById('streamsel').dispatchEvent(new Event('change'))");
  await pause(200);
  ok(await js("document.getElementById('scrubout').textContent.startsWith('54 of 54')"), "the Darlene sample has 54 steps");
  await click("#tab-state");
  ok(await js("[...document.querySelectorAll('#factlist .fact .ftext')].map(e => e.textContent).join('|')") === "Mom no longer drives.|Mom saw the eye doctor.|Mom needs new glasses.", "Now holds the standing fact, the reached goal, and the latest fact");
  ok(await js("document.querySelectorAll('#pastlist .fact').length") === 2, "two facts have moved to the past");
  ok(await js("document.querySelectorAll('#goallist .goal').length") === 2, "two goals are shown");
  ok(await js("document.querySelector('#goallist .goal.st-reached h3')?.textContent") === "Get Mom to the eye doctor", "the appointment goal is reached");
  ok(await js("document.querySelectorAll('#goallist .goal.st-reached .moves li').length") === 4, "it shows four moves");
  ok(await js("document.querySelector('#goallist .goal.st-reached .track .small').textContent.includes('2 closer') && document.querySelector('#goallist .goal.st-reached .track .small').textContent.includes('1 farther') && document.querySelector('#goallist .goal.st-reached .track .small').textContent.includes('1 read in your text')"), "two closer, one farther, and the move read in the text counted as neither");
  ok(await js("document.querySelector('#goallist .goal.st-reached .moves li.read .mtext').textContent.includes('(read in your text)')"), "a move read in the text stays marked after the goal was confirmed");
  ok(await js("document.querySelector('#goallist .goal.st-reached .reachednote')?.textContent.includes('Mom saw the eye doctor.')"), "the reached goal points at the state fact it became");
  ok(await js("document.querySelector('#goallist .goal.st-stuck h3')?.textContent") === "Get my brother to share the driving.", "the other goal is stuck");
  ok(await js("document.getElementById('goalcount').textContent") === "1", "the State tab counts one live goal");
  await js("document.getElementById('scrub').value = 7; document.getElementById('scrub').dispatchEvent(new Event('input'))");
  await pause(200);
  ok(await js("document.querySelector('#goallist .goal.st-proposed h3')?.textContent") === "Get Mom to the eye doctor", "at step 7 the goal is only a reading from the text");
  ok(await js("!!document.querySelector('#goallist [data-act=\"acceptgoal\"]')"), "and it asks to be confirmed");
  ok(await js("[...document.querySelectorAll('#factlist .fact .ftext')].map(e => e.textContent).join('|')") === "Mom's eye appointment is Thursday at 10.|Darlene works Thursday mornings.|Mom no longer drives.", "at step 7 Now shows the three original facts");
  ok(await js("document.getElementById('facttext').disabled === true"), "forms are disabled while rewound");
  ok(await js("document.getElementById('helpbtn').disabled === true"), "the Help analysis button is disabled while rewound");
  await click("#tolatest");
  ok(await js("document.getElementById('helpbtn').disabled === false && document.querySelectorAll('#helpbody .help').length === 3 && document.querySelectorAll('#helpbody .verdict [data-mark]').length === 9 && document.querySelectorAll('#helpbody .btn.mini.on').length === 0"), "at latest the sample's made-up analysis shows three suggestions, each asking for your word, none given yet");
  await click("#helpbtn");
  ok(await js("document.getElementById('loginscrim').hidden === false"), "signed out, Help analysis asks you to sign in");
  await js("document.getElementById('loginscrim').hidden = true");

  /* Evidence: what became of the machine's claims, counted from the steps, and it rewinds */
  const evRow = label => js(`(() => { const th = [...document.querySelectorAll('#evidencebody .evt th')].find(x => x.textContent === ${JSON.stringify(label)}); return th ? th.nextElementSibling.textContent : null; })()`);
  await click("#tab-evidence");
  ok(await js("document.getElementById('view-evidence').hidden === false && document.getElementById('evidencewhen').textContent") === "Counted from all 54 steps.", "the Evidence tab opens and says what it counted");
  ok((await evRow("Readings made")) === "1" && (await evRow("You confirmed")) === "1 of 1" && (await evRow("Still open")) === "1" && (await evRow("Moves read in text")) === "1", "it counts the one reading, the one goal read and confirmed, and the open loose end");
  ok((await evRow("Put forth as supposed")) === "14" && (await evRow("Confirmed")) === "1 of 14" && (await evRow("Ruled out")) === "1 of 14" && (await evRow("Still supposed")) === "12", "and the suppositions: one confirmed, one ruled out, twelve still supposed");
  ok((await evRow("Suggestions made")) === "3" && (await evRow("Not marked yet")) === "3", "and three suggestions with no word given yet");
  ok(await js("[...document.querySelectorAll('#evidencebody .evt.cols tbody th')].map(t => t.textContent).join('|')") === "not recorded|made up for the sample", "split by the model that made each claim");
  await js("document.getElementById('scrub').value = 8; document.getElementById('scrub').dispatchEvent(new Event('input'))");
  await pause(200);
  ok(await js("document.getElementById('evidencewhen').textContent") === "As it stood at step 8 of 54." && (await evRow("You confirmed")) === "1 of 1" && (await evRow("Suggestions made")) === null, "rewound, Evidence shows the counts as they stood then");
  await click("#tolatest");
  await click("#tab-map");
  ok(await js("document.querySelector('#panel h2')?.textContent") === "Darlene took Thursday morning off to drive her mother", "the Darlene map focuses the sentence");
  ok(await js("document.getElementById('lecount').textContent") === "1", "one loose end: did Mom get to the appointment?");

  /* the Darlene sample has items on all three world maps, a confirmed one and a ruled-out one */
  await click("#mapsel [data-map='mind']");
  ok(await js("document.querySelector('#panel h2')?.textContent") === "She means to get Mom there on time.", "her mental state opens around what she means to do");
  ok(await js("!!document.querySelector('#map .node[data-id=\"m-assume\"] text[text-decoration]') && document.querySelector('#map .node[data-id=\"m-assume\"]').textContent.includes('RULED OUT')"), "the supposition the world answered is drawn struck through, not removed");
  await js("document.querySelector('#map .node[data-id=\"m-assume\"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))");
  ok(await js("document.querySelector('#panel .hist')?.textContent.includes('ruled out. Mom said she doesn')"), "its history says what ruled it out");
  await click("#mapsel [data-map='env']");
  await js("document.querySelector('#map .node[data-id=\"e-job\"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))");
  ok(await js("[...document.querySelectorAll('#panel .meta .chip')].map(c => c.textContent).join(',')") === "Environment,confirmed", "a confirmed item says so");
  await click("#mapsel [data-map='said']");

  /* the Stream menu says what each stream holds before it is chosen */
  ok(await js("[...document.querySelectorAll('#streamsel option')].map(o => o.textContent).join(' || ')") === "Sample: Darlene and the appointment · 54 steps · Environment 5, Mental state 5, Assumptions 4 || Sample: Bobby's world · 63 steps · Environment 7, Mental state 7, Assumptions 5", "the Stream menu counts each stream's steps and its Environment, Mental state and Assumptions items");

  /* the four maps of one world, on the Bobby's world sample */
  await js("document.getElementById('streamsel').value = 'world'; document.getElementById('streamsel').dispatchEvent(new Event('change'))");
  await pause(200);
  ok(await js("[...document.querySelectorAll('#mapsel .seg')].map(b => b.textContent).join('|')") === "What was said2|Environment7|Mental state7|Assumptions5", "the map selector offers four maps and counts their items");
  ok(await js("document.querySelector('#mapsel [aria-selected=\"true\"]')?.dataset.map === 'said' && document.querySelector('#panel h2')?.textContent") === "He needs milk.", "the world opens on what was said, around “He needs milk.”");
  ok(await js("document.querySelectorAll('#map .node').length") === 5, "what was said shows the need, the act, and one reading of the need on each other map");
  await click("#mapsel [data-map='env']");
  ok(await js("document.querySelector('#panel h2')?.textContent") === "Bobby sets out from home.", "Environment opens around its middle item");
  ok(await js("document.querySelectorAll('#map .node').length") === 7, "the whole environment map is drawn, two links out");

  /* size, move and center: how the diagram is looked at. None of it makes a step. */
  const vb = () => js("document.getElementById('map').getAttribute('viewBox')");
  ok((await vb()) === "0 0 1160 720" && await js("document.getElementById('mapsize').textContent === '100%' && document.getElementById('mapcenter').disabled === true"), "the diagram opens at full size with the middle item in the middle");
  await click("#maplarger");
  ok((await vb()) === "116 72 928 576" && (await js("document.getElementById('mapsize').textContent")) === "125%", "+ makes the diagram larger, about its middle");
  await click("#mapctl [data-move='left']");
  ok((await vb()) === "255.2 72 928 576" && await js("document.getElementById('mapcenter').disabled === false"), "the left arrow moves the diagram left");
  await click("#mapctl [data-move='down']");
  ok((await vb()) === "255.2 -14.4 928 576", "the down arrow moves it down");
  await click("#mapcenter");
  ok((await vb()) === "116 72 928 576" && await js("document.getElementById('mapcenter').disabled === true"), "Center puts the middle item back in the middle and keeps the size");
  const mapBox = await js("(() => { const m = document.getElementById('map'); m.scrollIntoView({ block: 'center' }); const r = m.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width }; })()");
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: mapBox.x + 30, y: mapBox.y + 30 }, S);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: mapBox.x + 30, y: mapBox.y + 30, button: "left", clickCount: 1 }, S);
  for (const dx of [20, 60, 100]) await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: mapBox.x + 30 + dx, y: mapBox.y + 30, button: "left", buttons: 1 }, S);
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: mapBox.x + 130, y: mapBox.y + 30, button: "left", clickCount: 1 }, S);
  await pause(120);
  const dragged = (await vb()).split(" ").map(Number);
  ok(Math.abs(dragged[0] - (116 - 100 / mapBox.w * 928)) < 0.5 && dragged[1] === 72 && (await js("document.querySelector('#panel h2')?.textContent")) === "Bobby sets out from home.", "dragging with the mouse moves the diagram with the pointer and selects nothing", dragged.join(" "));
  await js("document.getElementById('map').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))");
  ok(Math.abs((await vb()).split(" ").map(Number)[1] - 158.4) < 0.01, "an arrow key moves it too, once the keyboard is in the diagram");
  await js("document.querySelector('#map .node[data-id=\"w6\"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))");
  ok((await vb()) === "116 72 928 576" && (await js("document.querySelector('#panel h2')?.textContent")) === "A store that sells milk is within reach.", "when another item becomes the middle, the move is forgotten and the size is kept");
  ok(await js("localStorage.getItem('nm.mapsize')") === "1.25", "the size chosen is remembered in this browser");
  await click("#mapsmaller");
  await click("#mapsmaller");
  ok((await vb()) === "-145 -90 1450 900" && (await js("document.getElementById('mapsize').textContent")) === "80%", "− makes the diagram smaller than the frame");
  await js("document.getElementById('map').dispatchEvent(new KeyboardEvent('keydown', { key: '0', bubbles: true }))");
  ok((await vb()) === "0 0 1160 720" && await js("document.getElementById('mapsize').textContent === '100%' && document.getElementById('scrubout').textContent.startsWith('63 of 63')"), "0 puts everything back, and none of it made a step");
  await js("document.querySelector('#map .node[data-id=\"w3\"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))");
  ok(await js("document.querySelector('#panel .chip.supposed')?.textContent === 'supposed' && !!document.querySelector('#panel [data-confirm]') && !!document.querySelector('#panel [data-ruleout]')"), "a supposed item says so and can be confirmed or ruled out");
  ok(await js("document.getElementById('itemtext').placeholder.startsWith('e.g. ') && !!document.getElementById('itemdir') && [...document.getElementById('itemlabel').options].some(o => o.textContent === 'rests on')"), "the panel offers to add to the map, joined to the item in focus");
  await js("document.querySelector('#map .node[data-id=\"w6\"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))");
  ok(await js("document.querySelector('#panel h2')?.textContent") === "A store that sells milk is within reach.", "selecting an item makes it the middle");
  await js("[...document.querySelectorAll('#panel [data-go]')].find(b => b.textContent.startsWith('He takes it for granted that the store')).click()");
  ok(await js("document.querySelector('#mapsel [aria-selected=\"true\"]')?.dataset.map") === "mind", "following a link into another map switches the map in view");
  await click("#mapsel [data-map='mind']");
  await js("document.querySelector('#mapsel [data-map=\"moral\"]').click()");
  ok(await js("document.querySelector('#panel h2')?.textContent") === "Those at home should not go without.", "Assumptions opens around its middle item");
  await click("#tab-timeline");
  ok(await js("document.getElementById('timeline').textContent.includes('No passes yet')"), "items put forth by hand have no lanes on the timeline");

  /* a blank box with a suggestion takes the suggestion (signed out, it stops at the sign-in) */
  await click("#tab-state");
  await click("#goalform button[type=submit]");
  await pause(600);
  ok(await js("document.getElementById('loginscrim').hidden === false"), "pressing Put it forth on an empty box tries the suggestion instead of doing nothing");
  await js("document.getElementById('loginscrim').hidden = true");

  /* the Script view and the stepper, on lines that need no server */
  await js("document.getElementById('streamsel').value = 'darlene'; document.getElementById('streamsel').dispatchEvent(new Event('change'))");
  await pause(200);
  await click("#tab-script");
  ok(await js("document.getElementById('scripttext').value.startsWith('# Bobby and the milk, by hand.') && document.getElementById('scriptstatus').textContent.includes('No model calls')"), "the Script view opens on the built-in script and counts its lines");
  ok(await js("document.querySelectorAll('#scripthelp dt').length") >= 15, "the words a script can use are listed");
  const setScript = async t => js(`(() => { const ta = document.getElementById('scripttext'); ta.value = ${JSON.stringify(t)}; ta.dispatchEvent(new Event('input')); })()`);
  await setScript("dance: all night\nfact");
  ok(await js("document.querySelectorAll('#scripterrors li').length === 2 && document.getElementById('scriptopen').disabled && document.getElementById('scripterrors').textContent.includes('line 1')"), "a script that can't be read lists its lines and can't be opened");
  await setScript("# on the Darlene sample\nnote: Watch the appointment goal.\nshow state\nrewind 7\nlatest\nfocus \"took Thursday morning off\"\nmove \"eggs\": none\nfact: Needs a sign-in.");
  await click("#scriptopen");
  ok(await js("document.getElementById('dock').hidden === false && document.getElementById('dockpos').textContent") === "0 of 7 run · next is line 2", "opening a script shows the stepper before its first line");
  await click("#tab-map");
  ok(await js("document.getElementById('dock').hidden === false"), "the stepper stays in view on another tab");
  await click("#dockstep");
  ok(await js("document.getElementById('dockmsg').textContent") === "Watch the appointment goal.", "Step runs a note and says it");
  await click("#dockstep");
  ok(await js("document.getElementById('view-state').hidden === false"), "Step runs show: the State view opens");
  await click("#dockstep");
  ok(await js("document.getElementById('rewound').hidden === false && !!document.querySelector('#goallist .goal.st-proposed')"), "Step runs rewind 7: the goal is back to a reading");
  await click("#dockstep");
  ok(await js("document.getElementById('rewound').hidden === true"), "Step runs latest");
  await click("#dockstep");
  ok(await js("document.getElementById('view-map').hidden === false && document.querySelector('#panel h2')?.textContent") === "Darlene took Thursday morning off to drive her mother", "Step runs focus: the idea opens on the map");
  ok(await js("document.querySelectorAll('#docklines li.done').length === 5 && document.getElementById('dockpos').textContent") === "5 of 7 run · next is line 7", "five lines are ticked off");
  await click("#dockstep");
  ok(await js("document.getElementById('dockmsg').classList.contains('bad') && document.getElementById('dockmsg').textContent.startsWith('Line 7: No goal') && document.getElementById('dockpos').textContent") === "5 of 7 run · next is line 7", "a line that can't run stops the stepper there and says why");
  await setScript("note: one\nnote: two\nfact: Needs a sign-in.");
  await js("document.getElementById('dockpace').value = '350'");
  await click("#dockrestart");
  await click("#dockplay");
  await pause(1500);
  ok(await js("document.getElementById('dockmsg').textContent.includes('Sign in first') && document.getElementById('loginscrim').hidden === false && document.querySelectorAll('#docklines li.done').length") === 2, "Play runs line after line and stops at the first line that needs a sign-in");
  await js("document.getElementById('loginscrim').hidden = true");
  await click("#dockclose");
  ok(await js("document.getElementById('dock').hidden === true"), "Close puts the stepper away");

  /* the sign-in card offers an account or a look around; a guest gets everything but the AI, and nothing is saved */
  const waitFor = async (expr, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await js(expr)) return true; await pause(250); } return false; };
  await js("document.getElementById('loginscrim').hidden = false");
  ok(await js("!!document.getElementById('email') && document.getElementById('loginswap').hidden === false && document.getElementById('tab-admin').hidden === true"), "the card asks for an email, offers to create an account, and the Admin tab is hidden");
  await click("#loginswap");
  ok(await js("document.getElementById('loginbtn').textContent === 'Create my account' && document.getElementById('email').required === true"), "Create an account turns the card into a sign-up");
  await click("#loginswap");
  await click("#loginguest");
  ok(await js("document.getElementById('loginscrim').hidden === true && document.getElementById('who').textContent.includes('Guest')"), "Look around as a guest puts the card away and says nothing is saved");
  await click("#tab-state");
  await click("#goalform button[type=submit]");
  ok(await waitFor("[...document.querySelectorAll('#goallist .goal.st-open h3')].some(h => h.textContent === 'Get Mom to the eye doctor.')", 3000), "a guest puts a goal forth, and the empty box took its suggestion");
  ok(await js("document.getElementById('savestate').textContent === 'Guest · not saved' && document.getElementById('streamsel').value === 'local' && document.getElementById('streamsel').selectedOptions[0].textContent.endsWith('not saved')"), "the guest's stream is in this tab only and says it is not saved");
  /* a guest gives their word on a suggestion: it is a step in their own copy, and Evidence counts it */
  await click("#helpbody [data-sug='h-darlene-3'] [data-mark='new']");
  ok(await waitFor("document.querySelector(\"#helpbody [data-sug='h-darlene-3'] .btn.mini.on\")?.dataset.mark === 'new'", 3000), "a guest marks a suggestion new to me, and the button shows it");
  await click("#helpbody [data-sug='h-darlene-1'] [data-mark='knew']");
  await click("#helpbody [data-sug='h-darlene-3'] [data-mark='wrong']");
  ok(await waitFor("document.querySelector(\"#helpbody [data-sug='h-darlene-3'] .btn.mini.on\")?.dataset.mark === 'wrong' && document.querySelectorAll('#helpbody .btn.mini.on').length === 2", 3000), "the latest word on a suggestion stands");
  ok(await js("document.getElementById('helpbody').textContent.includes('1 step since this was made')"), "a word on a suggestion does not make the analysis stale: only the goal put forth counts as a step since");
  await click("#tab-evidence");
  ok((await evRow("Already knew")) === "1 of 3" && (await evRow("Wrong")) === "1 of 3" && (await evRow("New to me")) === "0 of 3" && (await evRow("Not marked yet")) === "1", "Evidence counts the guest's words on the suggestions");
  await click("#tab-state");
  await click("#helpbtn");
  ok(await js("document.getElementById('infoscrim').hidden === false && document.getElementById('infotext').textContent.includes('registered users') && document.getElementById('infogo').hidden === false"), "Help analysis tells a guest it is for registered users and offers an account");
  await click("#infoclose");
  await click("#tab-add");
  await js("document.getElementById('entry').value = 'Bobby went to the store to get milk.'");
  await click("#addactions [data-run]");
  ok(await js("document.getElementById('infoscrim').hidden === false && document.getElementById('infotext').textContent.startsWith('Ideaify uses the AI')"), "Ideaify tells a guest the same");
  await click("#infogo");
  ok(await js("document.getElementById('infoscrim').hidden === true && document.getElementById('loginscrim').hidden === false && document.getElementById('loginbtn').textContent === 'Create my account'"), "its button opens the card ready to create an account");
  await click("#loginguest");
  /* a guest runs the whole by-hand script in the stepper, with no server at all */
  await click("#tab-script");
  await js("(() => { const s = document.getElementById('scriptsel'); s.value = 'hand'; s.dispatchEvent(new Event('change')); })()");
  await click("#scriptopen");
  await js("document.getElementById('dockpace').value = '350'");
  await click("#dockplay");
  ok(await waitFor("document.getElementById('dockpos').textContent.startsWith('Done')", 30000), "a guest can Play the by-hand script to the end", await js("document.getElementById('dockpos').textContent + ' | ' + document.getElementById('dockmsg').textContent"));
  await click("#tab-state");
  ok(await js("[...document.querySelectorAll('#factlist .fact .ftext')].map(e => e.textContent).join('|')") === "The car makes a grinding noise when it starts.|Bobby has milk.|Bobby is home again.", "and ends where the Bobby sample ends");
  ok(await js("document.getElementById('streamsel').selectedOptions[0].textContent") === "Bobby, scripted · 13 steps · no world maps · not saved", "in a stream of 13 steps that is not saved");
  await click("#dockclose");
  /* lines that check: a script is also a test. A check that does not hold is marked and counted, and the run goes on. */
  await click("#tab-script");
  await setScript("expect goal \"Get milk\" reached\nexpect goal \"Fix the car\" open\nexpect fact \"Bobby has milk\"\nshow evidence");
  ok(await js("document.getElementById('scriptstatus').textContent") === "4 lines to run. No model calls. 3 checks.", "the Script view counts the checks in a script");
  await click("#scriptopen");
  await click("#dockplay");
  ok(await waitFor("document.getElementById('dockpos').textContent.startsWith('Done')", 15000), "a script of checks plays to the end though one check does not hold");
  ok(await js("document.getElementById('dockpos').textContent") === "Done · 4 of 4 run · 2 of 3 checks held", "the stepper counts how many checks held");
  ok(await js("document.querySelectorAll('#docklines li.missed').length === 1 && document.querySelector('#docklines li.missed code').textContent.includes('Fix the car')"), "and marks the one that did not");
  ok(await js("document.getElementById('view-evidence').hidden === false && document.getElementById('evidencebody').textContent.includes('Nothing to count yet') && document.getElementById('streamsel').selectedOptions[0].textContent.includes('13 steps')"), "show evidence opens the Evidence view; a stream made by hand has no machine claims to count, and the checks added no step");
  await click("#dockclose");

  /* Help is in the page for everyone, built from HELP.md */
  await click("#tab-help");
  ok(await js("document.getElementById('view-help').hidden === false && [...document.querySelectorAll('#helpdoc h3')].map(h => h.textContent).join('|')") === "What this is|Getting in|Streams|The Map: four maps of one world|State: where things stand|Add text|Loose Ends, Timeline and Evidence|Script and the stepper|The AI|What is saved, and who can see it|For admins: the Admin tab|Where this is going", "the Help tab shows HELP.md, section by section, ending on where this is going");
  ok(await js("document.querySelectorAll('#helpdoc blockquote').length === 4 && document.getElementById('helpdoc').textContent.includes('coordinate their actions') && !document.getElementById('helpdoc').textContent.includes('**')"), "its last section carries the vision in Phil's words");
  ok(errors.length === 0, "no script errors during the walkthrough", errors.join(" | "));
} catch (e) {
  fail++; console.log("  FAIL  " + (e && e.message ? e.message : e));
} finally {
  try { if (ws) ws.close(); } catch { /* closing */ }
  try { proc.kill(); } catch { /* gone */ }
  await new Promise(r => server.close(r));
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* browser may still hold it */ }
}
console.log(`smoke: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

#!/usr/bin/env node
/* ─────────────────────────────────────────────
   File: tests/smoke.browser.js
   File Version: 0.1.0
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
  ok(await js("document.querySelectorAll('#map .node').length") === 7, "sample map draws the focus and its 6 neighbors");
  ok(await js("document.querySelector('#panel h2')?.textContent") === "Faith is furnished by memory", "side panel shows the focus idea");
  ok(await js("document.querySelector('#panel .words')?.textContent.includes('favorite toy')"), "your words are quoted in the panel");
  ok(await js("document.querySelector('#panel .trace .step.anchor')?.textContent") === "Faith, hope, charity", "traceback reaches the anchor");
  ok(await js("document.getElementById('lecount').textContent") === "9", "loose ends count is 9 in the sample");
  ok(await js("document.getElementById('scrubout').textContent.startsWith('6 of 6')"), "stream bar reports 6 of 6 steps");

  /* wrong password stays on the card; the app underneath still renders */
  await js("document.getElementById('password').value = 'wrong'");
  await click("#loginbtn");
  await pause(900);
  ok(await js("document.getElementById('loginstatus').textContent.includes('password')"), "wrong password is reported on the card");
  ok(await js("document.getElementById('loginscrim').hidden === false"), "card stays up after a wrong password");

  /* signed-out browsing: hide the card and drive the sample */
  await js("document.getElementById('loginscrim').hidden = true");
  await click("#tab-loose");
  ok(await js("document.getElementById('view-loose').hidden === false && document.querySelectorAll('#lelist .le').length === 9"), "Loose Ends lists 9 items");
  await click("#tab-timeline");
  ok(await js("document.querySelectorAll('#timeline .lane').length") === 9, "timeline draws 9 lanes");
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
  await js("document.getElementById('q').value = 'robber'; document.getElementById('q').dispatchEvent(new Event('input'))");
  ok(await js("document.querySelectorAll('#suggest button').length") === 1, "search finds the bank robber");
  await click("#suggest button");
  ok(await js("document.querySelector('#panel h2')?.textContent") === "The bank robber silences the alarm too", "search opens the idea");
  await click("[data-draft]");
  ok(await js("document.getElementById('scrim').hidden === false && document.querySelectorAll('#draftbody blockquote').length") >= 2, "draft quotes the words verbatim");
  ok(await js("document.getElementById('draftmd').value.includes('> Robbing the bank')"), "draft markdown starts from the words");
  await click("#closedraft");
  await click("#tab-talk");
  await click("#mic");
  await pause(400);
  ok(await js("document.getElementById('transcript').textContent.includes('car will start')"), "talk demo plays the sample transcript");
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

/* ─────────────────────────────────────────────
   File: src/client/10-util.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   Small helpers with no app state. */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clip = (s, n) => { s = String(s ?? "").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
const reduceMotion = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
let toastTimer;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2800); }
const measureCtx = document.createElement("canvas").getContext("2d");
function textW(s, font) { measureCtx.font = font; return measureCtx.measureText(s).width; }
function wrap(text, max, font) {
  const words = String(text).split(/\s+/); const lines = []; let cur = "";
  for (const w of words) { const test = cur ? cur + " " + w : w; if (textW(test, font) > max && cur) { lines.push(cur); cur = w; } else cur = test; }
  if (cur) lines.push(cur); return lines.slice(0, 4);
}
/* SVG presentation attributes don't resolve var(); move them to inline style. */
function fixVars(root) {
  root.querySelectorAll('[fill*="var("],[stroke*="var("]').forEach(el => {
    for (const a of ["fill", "stroke"]) { const v = el.getAttribute(a); if (v && v.includes("var(")) { el.style.setProperty(a, v); el.removeAttribute(a); } }
  });
}
function today() { return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function stamp(iso) { try { return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; } }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private window */ } }

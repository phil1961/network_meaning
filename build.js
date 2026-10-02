#!/usr/bin/env node
/* ─────────────────────────────────────────────
   File: build.js
   File Version: 0.3.0
   ─────────────────────────────────────────────
   Assembles public/index.html from src/client and src/shared. The same
   idea as the Markdown Editor's build: straight concatenation in filename
   order, three substitutions into the page shell (the style, the script,
   and HELP.md turned into the Help tab), no dependencies.

     node build.js            write public/index.html
     node build.js --check    build in memory and fail if it differs

   Shared modules (src/shared/*.js) are ESM for the server. For the page,
   their top-level `export ` keywords are stripped and any import lines
   dropped, so they become plain declarations ahead of the client modules.
   The numeric prefixes on client modules ARE the dependency order. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CLIENT = path.join(ROOT, "src", "client");
const SHARED = path.join(ROOT, "src", "shared");
const TARGET = path.join(ROOT, "public", "index.html");
const CHECK = process.argv.includes("--check");

function fail(msg) { console.error("build: " + msg); process.exit(2); }
const mark = label => "/* ==== " + label + " ==== */";

function stripEsm(text, name) {
  if (/^\s*import\s/m.test(text)) fail(name + " has an import; shared modules must be self-contained");
  return text.replace(/^export\s+(?=(?:async\s+)?function|const|let|class)/gm, "").replace(/^export\s*\{[^}]*\};?\s*$/gm, "");
}
function modules() {
  const shared = fs.readdirSync(SHARED).filter(f => f.endsWith(".js")).sort().map(f => ({ name: "shared/" + f, text: stripEsm(fs.readFileSync(path.join(SHARED, f), "utf8"), f) }));
  const client = fs.readdirSync(CLIENT).filter(f => f.endsWith(".js")).sort().map(f => ({ name: "client/" + f, text: fs.readFileSync(path.join(CLIENT, f), "utf8") }));
  return shared.concat(client);
}
/* HELP.md to HTML for the Help tab, so the repo's help and the app's help
   are one file. A small subset on purpose: # headings, paragraphs, - and
   1. lists (with wrapped lines), > quotes, ``` fences, | tables | with a
   header row, **bold**, *italic*, `code`. Anything else in HELP.md shows
   as plain text. */
function mdToHtml(md) {
  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = s => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\*([^*]+)\*/g, "<i>$1</i>");
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const isRow = l => /^\|.*\|\s*$/.test(l);
  const out = []; let para = [], list = null, quote = [], i = 0;
  const flush = () => {
    if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; }
    if (list) { out.push(`<${list.tag}>${list.items.map(x => `<li>${inline(x)}</li>`).join("")}</${list.tag}>`); list = null; }
    if (quote.length) { out.push(`<blockquote>${inline(quote.join(" "))}</blockquote>`); quote = []; }
  };
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("```")) { flush(); const code = []; while (++i < lines.length && !lines[i].startsWith("```")) code.push(lines[i]); out.push(`<pre>${esc(code.join("\n"))}</pre>`); continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(l);
    if (h) { flush(); out.push(`<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>`); continue; }
    if (!l.trim()) { flush(); continue; }
    if (isRow(l)) {
      /* a table: the first row is the header, the |---| row under it is dropped, a cell cannot hold a | */
      flush();
      const rows = []; for (; i < lines.length && isRow(lines[i]); i++) rows.push(lines[i].trim().slice(1, -1).split("|").map(c => c.trim()));
      i--;
      const [head, ...body] = rows.filter(r => !r.every(c => /^:?-+:?$/.test(c)));
      const row = (cells, tag) => `<tr>${cells.map(c => `<${tag}>${inline(c)}</${tag}>`).join("")}</tr>`;
      out.push(`<div class="tablewrap"><table><thead>${row(head, "th")}</thead><tbody>${body.map(r => row(r, "td")).join("")}</tbody></table></div>`);
      continue;
    }
    const item =/^(?:-|(\d+)\.)\s+(.*)$/.exec(l);
    if (item) { if (para.length || quote.length) flush(); const tag = item[1] ? "ol" : "ul"; if (!list || list.tag !== tag) { flush(); list = { tag, items: [] }; } list.items.push(item[2]); continue; }
    if (l.startsWith(">")) { if (para.length || list) flush(); quote.push(l.replace(/^>\s?/, "")); continue; }
    if (list && /^\s+\S/.test(l)) { list.items[list.items.length - 1] += " " + l.trim(); continue; }
    if (list || quote.length) flush();
    para.push(l.trim());
  }
  flush();
  return out.join("\n");
}

function assemble() {
  const page = fs.readFileSync(path.join(CLIENT, "page.html"), "utf8");
  const helpFile = path.join(ROOT, "HELP.md");
  if (!fs.existsSync(helpFile)) fail("HELP.md is missing; the Help tab is built from it");
  const help = mdToHtml(fs.readFileSync(helpFile, "utf8"));
  if (help.includes("@@")) fail("HELP.md contains @@, which the build uses for its own markers");
  const css = fs.readFileSync(path.join(CLIENT, "style.css"), "utf8");
  const mods = modules();
  for (const m of ["@@STYLE@@", "@@SCRIPT@@", "@@HELP@@"]) if (page.indexOf(m) < 0) fail("src/client/page.html has no " + m + " marker");
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const bm = /version:\s*"([^"]+)"/.exec(fs.readFileSync(path.join(CLIENT, "00-build.js"), "utf8"));
  if (!bm || bm[1] !== pkg.version) fail(`BUILD.version in src/client/00-build.js (${bm && bm[1]}) must match package.json (${pkg.version})`);
  const js = '(function(){\n"use strict";\n' + mods.map(m => mark("module " + m.name) + "\n" + m.text).join("\n") + "\n" + mark("end script") + "\n})();";
  if (js.includes("</script")) fail("a module contains the text </script, which would end the page's script tag");
  const style = mark("begin style.css") + "\n" + css + "\n" + mark("end style.css");
  const out = page.replace("@@STYLE@@", () => style).replace("@@HELP@@", () => help).replace("@@SCRIPT@@", () => js);
  const leftover = out.replace(/@@GARBLE/g, "").indexOf("@@");
  if (leftover >= 0) fail("an unsubstituted @@MARKER@@ survived into the output");
  return { text: out, mods };
}

const { text, mods } = assemble();
if (CHECK) {
  if (!fs.existsSync(TARGET)) fail("nothing to check against: public/index.html is missing. Run node build.js");
  if (fs.readFileSync(TARGET, "utf8") !== text) { console.error("build --check: public/index.html does NOT match src/. Run: node build.js"); process.exit(1); }
  console.log(`build --check: public/index.html matches src/ (${mods.length} modules, ${text.length} bytes)`);
  process.exit(0);
}
fs.mkdirSync(path.dirname(TARGET), { recursive: true });
const before = fs.existsSync(TARGET) ? fs.readFileSync(TARGET, "utf8") : null;
fs.writeFileSync(TARGET, text);
console.log(`build: wrote public/index.html: ${mods.length} modules, ${text.length} bytes` + (before === null ? " (new)" : before === text ? " (unchanged)" : " (CHANGED)"));
mods.forEach(m => console.log("  " + m.name.padEnd(24) + m.text.split("\n").length + " lines"));

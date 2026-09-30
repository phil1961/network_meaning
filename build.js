#!/usr/bin/env node
/* ─────────────────────────────────────────────
   File: build.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   Assembles public/index.html from src/client and src/shared. The same
   idea as the Markdown Editor's build: straight concatenation in filename
   order, two substitutions into the page shell, no dependencies.

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
function assemble() {
  const page = fs.readFileSync(path.join(CLIENT, "page.html"), "utf8");
  const css = fs.readFileSync(path.join(CLIENT, "style.css"), "utf8");
  const mods = modules();
  for (const m of ["@@STYLE@@", "@@SCRIPT@@"]) if (page.indexOf(m) < 0) fail("src/client/page.html has no " + m + " marker");
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const bm = /version:\s*"([^"]+)"/.exec(fs.readFileSync(path.join(CLIENT, "00-build.js"), "utf8"));
  if (!bm || bm[1] !== pkg.version) fail(`BUILD.version in src/client/00-build.js (${bm && bm[1]}) must match package.json (${pkg.version})`);
  const js = '(function(){\n"use strict";\n' + mods.map(m => mark("module " + m.name) + "\n" + m.text).join("\n") + "\n" + mark("end script") + "\n})();";
  if (js.includes("</script")) fail("a module contains the text </script, which would end the page's script tag");
  const style = mark("begin style.css") + "\n" + css + "\n" + mark("end style.css");
  const out = page.replace("@@STYLE@@", () => style).replace("@@SCRIPT@@", () => js);
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

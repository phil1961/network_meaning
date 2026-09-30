/* ─────────────────────────────────────────────
   File: src/shared/spans.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   Cutting text into spans, the atoms of stuckness. Every idea must cite
   spans, and its words are assembled verbatim from them. Shared by the
   server (ideaify) and the client build (pass counts). No imports: the
   client build inlines this file and strips the export keywords. */

export const MAX_CHUNK = 60000;

/* Sentence-ish units, paragraph by paragraph. Short fragments fold into the
   next span so a lone "Yeah." never becomes an idea of its own. */
export function splitSpans(text) {
  const out = [];
  const paras = String(text ?? "").replace(/\r\n?/g, "\n").split(/\n+/).map(p => p.trim()).filter(Boolean);
  for (const p of paras) {
    const parts = p.match(/[^.!?…]+(?:[.!?…]+["”’)\]]*|$)/g) || [p];
    let carry = "";
    for (let i = 0; i < parts.length; i++) {
      const s = (carry + " " + parts[i]).replace(/\s+/g, " ").trim();
      if (s.length < 25 && i < parts.length - 1) { carry = s; continue; }
      carry = "";
      if (s) out.push(s);
    }
  }
  return out;
}

/* Long text runs as several passes. Split on blank lines, never mid-word
   unless a single paragraph is itself over the limit. */
export function chunkText(text, max = MAX_CHUNK) {
  text = String(text ?? "");
  if (text.length <= max) return [text];
  const paras = text.split(/\n\s*\n/);
  const chunks = [];
  let cur = "";
  for (const p of paras) {
    if ((cur + "\n\n" + p).length > max && cur) { chunks.push(cur); cur = p; }
    else cur = cur ? cur + "\n\n" + p : p;
    while (cur.length > max) { chunks.push(cur.slice(0, max)); cur = cur.slice(max); }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

/* "¶ 3, 7–9": which spans an idea came from, one-based for people. */
export function spanLabel(sp) {
  if (!sp.length) return "";
  const runs = [];
  let a = sp[0], b = sp[0];
  for (const x of sp.slice(1)) {
    if (x === b + 1) b = x;
    else { runs.push(a === b ? `${a + 1}` : `${a + 1}–${b + 1}`); a = b = x; }
  }
  runs.push(a === b ? `${a + 1}` : `${a + 1}–${b + 1}`);
  return "¶ " + runs.join(", ");
}

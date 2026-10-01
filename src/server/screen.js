/* ─────────────────────────────────────────────
   File: src/server/screen.js
   File Version: 0.2.0
   ─────────────────────────────────────────────
   The check before every call out to the AI (Phil, 2026-09-30): "whatever
   the user provides in that context call has to be sanity checked for
   malicious, or stupid inputs." Everything a person supplied that is about
   to go into a prompt passes through here first: the text they pasted, the
   label they gave it, and the facts, goals, moves and map items already in
   the stream. Pure, no network, no model. Two kinds of refusal:

     junk       it is not text a person wrote: empty, far too long, binary,
                one thing repeated, a blob with no words in it.
     aimed      it reads as an instruction aimed at the AI rather than
                something to be read ("ignore your previous instructions").

   A pattern check cannot catch every attack, and is not the only defence.
   The prompts tell the model the text is material to read, never orders;
   the answer is held to a JSON schema; and normalize.js builds every idea's
   words from the person's own spans. This file is the first gate, not the
   last. An admin's text skips the "aimed" check (it is their key, and their
   own chat transcripts quote such phrases); the junk checks apply to all.

   What is ALREADY in the stream is handled differently from what is being
   sent now. It is not refused, because that would lock the stream for good
   over one phrase. Lines that read as orders are left out of what the model
   is shown (scrubContext), and the person is told which. */

export const SCREEN_LIMITS = { textMax: 60000, wordMax: 400, runMax: 200, lineMax: 300, contextMax: 120000, actionMax: 20000 };

/* One line, bounded: for anything a person wrote that is set inside a
   prompt beside other things. No newlines, so it cannot start a section of
   its own; no control characters; clipped. */
export function oneLine(s, max = SCREEN_LIMITS.lineMax) {
  s = String(s ?? "").replace(/[\p{Cc}\p{Zl}\p{Zp}]+/gu, " ").replace(/\s+/g, " ").trim();
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

const no = (code, message) => ({ ok: false, code, message });

/* Is this text a person wrote? Returns { ok:true } or { ok:false, code, message }. */
export function screenJunk(text) {
  const t = String(text ?? "");
  if (!t.trim()) return no("empty_input", "There's nothing there to read.");
  if (t.length > SCREEN_LIMITS.textMax) return no("too_long", `That is ${t.length.toLocaleString("en-US")} characters, and one pass takes at most ${SCREEN_LIMITS.textMax.toLocaleString("en-US")}. Send it in smaller pieces.`);
  const control = (t.match(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f�]/g) || []).length;
  if (control > 2 && control / t.length > 0.005) return no("not_text", "That doesn't look like text. It may be a file that isn't plain text.");
  const dense = t.replace(/\s+/g, "");
  const letters = (dense.match(/\p{L}/gu) || []).length;
  if (letters < 2) return no("no_words", "There are no words in that.");
  if (dense.length >= 40 && letters / dense.length < 0.4) return no("no_words", "That is mostly symbols or numbers, not words. The AI was not called.");
  const long = t.split(/\s+/).find(w => w.length > SCREEN_LIMITS.wordMax);
  if (long) return no("blob", "That has a run of several hundred characters with no spaces, which reads as data, not as something said. The AI was not called.");
  if (new RegExp(`(.)\\1{${SCREEN_LIMITS.runMax},}`, "s").test(t)) return no("repetitive", "That is one character repeated a great many times. The AI was not called.");
  const words = t.toLowerCase().match(/\p{L}[\p{L}'’-]*/gu) || [];
  if (words.length >= 200 && new Set(words).size / words.length < 0.05) return no("repetitive", "That is the same few words over and over. The AI was not called.");
  return { ok: true };
}

/* Phrases that give orders to an AI instead of saying something. Kept
   narrow on purpose: talking ABOUT instructions or prompts is fine; these
   are the imperative forms. Each is [pattern, what it is]. */
const AIMED = [
  [/\b(?:ignore|disregard|forget|override|bypass)\b[^.\n]{0,40}\b(?:previous|prior|above|earlier|preceding|system|your)\b[^.\n]{0,25}\b(?:instructions?|prompts?|directives?|guidelines)\b/i, "an order to set aside the AI's instructions"],
  [/\b(?:ignore|disregard)\s+(?:all|everything)\s+(?:of\s+)?(?:the\s+)?(?:above|before|prior)\b/i, "an order to set aside what came before"],
  [/\b(?:reveal|show|print|repeat|output|leak|tell me)\b[^.\n]{0,40}\b(?:system prompt|hidden prompt|your (?:instructions|prompt|rules)|api[ _-]?key)\b/i, "a request for the AI's own instructions or keys"],
  [/\byou are now\b[^.\n]{0,40}\b(?:dan|unrestricted|jailbroken|uncensored|free of|no longer bound)\b/i, "an attempt to give the AI a different role"],
  [/\b(?:enter|enable|activate|switch to)\b[^.\n]{0,20}\b(?:developer|dan|jailbreak|god|unrestricted)\s+mode\b/i, "an attempt to switch the AI into another mode"],
  [/\b(?:new|updated|real|actual)\s+(?:system\s+)?instructions?\s*:/i, "something posing as new instructions"],
  [/<\/?\s*(?:system|instructions?)\s*>|\[\/?INST\]|<\|im_(?:start|end)\|>|<\|(?:system|assistant|user)\|>/i, "markup that poses as the AI's own channel"],
  [/\b(?:do not|don't|stop)\s+follow(?:ing)?\b[^.\n]{0,20}\b(?:the|your)\s+(?:rules|instructions)\b/i, "an order not to follow the rules"]
];

/* The first phrase aimed at the AI, or null. Returns { phrase, what }. */
export function findAimed(text) {
  const t = String(text ?? "");
  for (const [re, what] of AIMED) {
    const m = re.exec(t);
    if (m) return { phrase: oneLine(m[0], 90), what };
  }
  return null;
}

/* What is already in a stream and about to be shown to the model, with any
   line that reads as an order to an AI left out. The person wrote those
   lines as facts, goals or items; they stay in the stream untouched. They
   are only withheld from the model, so one phrase cannot lock the AI out of
   a stream for good. Returns { text, left: [phrases] }. An admin's stream
   is shown as it is. */
export const LEFT_OUT = "(one line is left out here: it read as an order to an AI, not as something said)";
export function scrubContext(text, trusted = false) {
  if (trusted) return { text: String(text ?? ""), left: [] };
  const left = [];
  const out = String(text ?? "").split("\n").map(line => { const hit = findAimed(line); if (!hit) return line; left.push(hit.phrase); return LEFT_OUT; }).join("\n");
  return { text: out, left };
}

/* The whole check for one call. text: what the person is sending now, if
   anything. label: the short label they gave it. context: what is already
   in their stream and is about to be shown to the model. trusted: an admin.
   Returns { ok:true } or { ok:false, code, message }. */
export function screenCall({ text = null, label = "", context = "", trusted = false }) {
  if (text !== null) { const j = screenJunk(text); if (!j.ok) return j; }
  if (String(context).length > SCREEN_LIMITS.contextMax) return no("too_long", "This stream has grown too large to show the AI in one call.");
  if (trusted) return { ok: true };
  const here = text !== null ? findAimed(text) || findAimed(label) : null;
  if (here) return no("aimed_at_ai", `Part of that reads as ${here.what}, not as something to be read: “${here.phrase}”. Take that part out and try again. The AI was not called.`);
  return { ok: true }; /* what is already in the stream is not refused: see scrubContext */
}

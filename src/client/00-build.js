/* ─────────────────────────────────────────────
   File: src/client/00-build.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   Version and the "what changed" list, in the person's words. The app
   version also lives in package.json; build.js checks they agree. */
const BUILD = {
  version: "0.1.0",
  corrections: [
    ["The prototype lived inside a claude.ai artifact and could only save to that page's private store",
     "It is now its own app: a Node server with a Postgres stream store, signed in with a password. Text is ideaified on the server, where the prompt and the key live."],
    ["Keeping a reading turned the machine's sentence into \"your words\"",
     "A kept reading stays marked as the machine's phrasing. It becomes fixed, but it is never quoted as yours."],
    ["A traceback could run through a contradiction",
     "The path back to an anchor now only follows links that derive one idea from another."],
    ["The sample's tension flag quoted a summary as if it were your words",
     "It now says which side is a quote and which is a summary."]
  ]
};

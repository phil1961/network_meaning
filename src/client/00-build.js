/* ─────────────────────────────────────────────
   File: src/client/00-build.js
   File Version: 0.8.0
   ─────────────────────────────────────────────
   Version and the "what changed" list, in the person's words. The app
   version also lives in package.json; build.js checks they agree. */
const BUILD = {
  version: "0.8.0",
  corrections: [
    ["A change that failed to save could quietly go missing, and the warning cleared itself",
     "A failed save now stays on screen and nothing new is taken until it is saved; it is tried again in order when you act or click the note. A change the server refuses is undone, so the page and the server always show the same stream."],
    ["Stop left the AI call running, and its result was stored anyway",
     "Stop now stops the call on the server too. Nothing is added."],
    ["A move the AI read in your text was counted as bringing the goal closer",
     "A move read in the text carries no effect. It is shown as read in your text, and stays marked that way after you confirm the goal."],
    ["One phrase in a fact or goal could lock the AI out of a stream for good",
     "A line already in a stream that reads as an order to an AI is left out of what the AI is shown, and you are told which. Nothing is removed from the stream."],
    ["The sample Bobby and the milk repeated Bobby's world",
     "It is now Darlene and the appointment: a different person and goal, with items on her Environment, Mental state and Assumptions maps, one confirmed and one ruled out."],
    ["Smaller things",
     "“Later” on a loose end leaves it open. A map whose items were all ruled out still draws them. A paste that fails partway no longer says Done. The panel offers the same link words the method uses. Only actions the app knows are stored."],
    ["There was nothing to read about how the app works or where it is going",
     "A Help tab, open to everyone including guests. It covers getting in, streams, the four maps, State, text, scripts, the AI and what is saved, and ends with where this is going. It is built from HELP.md in the repo, so the two never differ."],
    ["There was one person, and one password",
     "Anyone can create an account with their email, and an admin can add people on the Admin tab. Three levels: what a user does is stored in an area of their own; a guest can look around and try things but nothing is stored and the AI buttons explain that they are for registered users; an admin can also add people and share a stream with everyone. Everyone has the built-in samples."],
    ["Whatever was pasted went to the AI as it was",
     "Before every call to the AI, what you are sending and what is already in the stream is checked: text that isn't really text, or that reads as orders aimed at the AI, is refused with the reason, and the AI is not called."],
    ["The Stream menu said nothing about what a stream holds",
     "Each line in the Stream menu now says how many steps the stream has and how many items are on its Environment, Mental state and Assumptions maps, so you can see before you choose."],
    ["There was one map, of what was said, and nothing on it could be added to by hand",
     "Four maps of one world: what was said, the environment, the mental state, and the assumptions. Pick one above the diagram. Each item is given or supposed; a supposition is drawn dashed until you confirm it or rule it out. Select any item and add to it. The sample Bobby's world is made up, for review."],
    ["A suggestion in an empty box was only a hint",
     "Where a box shows a suggestion such as “e.g. Get milk.”, pressing the button with the box empty uses the suggestion as the entry."],
    ["The only way to make the app go was to press each button yourself",
     "A Script view and a stepper. Write the actions one per line in plain words, then Step or Play and watch each one happen in the view where it lands. Everything a script does is an ordinary step in the stream."],
    ["Nothing told you what to look at next",
     "A Help analysis button in the State view. Press it and it reads the state of play (Now, your goals and moves, loose ends, the map) and makes a few suggestions. Each one points at what it rests on, is marked as the machine's reading, and changes nothing until you act."],
    ["The map had no place for where you stand or what you are moving toward",
     "A State view: facts that are true for you now, goals put forth, every move toward a goal, and the moment a reached goal becomes part of your state. Goals stated in your text are read out for you to confirm. The Darlene sample walks through it."],
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

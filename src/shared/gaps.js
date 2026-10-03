/* ─────────────────────────────────────────────
   File: src/shared/gaps.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   The Start tab's small goods, and the sizing of the next one (Phil,
   2026-10-02: "Create a new top level tab that is our inviting UI"). The
   brief is the Drive document "Instructions for Terminal Claude — First
   Crack at the Inviting UI"; the thinking behind it is "The Gap, the Bridge,
   and the Joy of Crossing".

   A gap is one small good a person can do: for someone else ("out") or for
   themselves ("in"). Each has a reach, 1 to 5: how far it asks the person
   to stretch. Reach 1 is a thought, done in the reading of it. Reach 5 is a
   real act that takes some nerve. A walk is one person's sitting: which
   gaps were offered, which were chosen, how each came out, and the reach
   the next offer is sized to.

   The reach is read from what the person does, never asked for, and it is
   calibration, not judgment: it sizes the next step and nothing else. It is
   never shown. No outcome is a failure. "did" lays a plank and reaches one
   further; "later" keeps the gap for the person and offers others the same
   size; "smaller" offers smaller ones. The words of every gap are Claude's.

   Pure: no DOM, no fetch, no imports. The client build inlines this file
   and strips the exports. Nothing here is stored or sent anywhere. */

export const REACH = { min: 1, max: 5 };
/* How many planks make a bridge: one crossing each. */
export const BRIDGE = 5;
export const OUTCOMES = ["did", "later", "smaller"];

/* id | reach | to | act: the words on the button | done: what is said once it is crossed.
   Three of each kind at each reach, so an offer of three is always possible. */
export const GAPS = [
  { id: "o1a", reach: 1, to: "out", act: "Think of someone you're glad to know.", done: "For a moment they were in your thoughts, kindly. Everything done for another person starts there." },
  { id: "o1b", reach: 1, to: "out", act: "Think of someone who could use a kind word.", done: "You noticed them. Most kindness never gets past that step, and you just took it." },
  { id: "o1c", reach: 1, to: "out", act: "Picture someone who was good to you once.", done: "You remembered it. What they did is still doing its work." },
  { id: "i1a", reach: 1, to: "in", act: "Notice one thing near you that you like.", done: "You went looking for something good and found it. That took a second, and it was yours." },
  { id: "i1b", reach: 1, to: "in", act: "Remember one thing that went right lately.", done: "There it is. It happened, and now you have it twice." },
  { id: "i1c", reach: 1, to: "in", act: "Let your shoulders drop.", done: "A little weight came off, and you were the one who put it down." },

  { id: "o2a", reach: 2, to: "out", act: "Think of one thing you'd thank someone for, and say it out loud to the room.", done: "You said it. The words exist now, and saying them to the person is a shorter step than it was." },
  { id: "o2b", reach: 2, to: "out", act: "Work out one small thing that would make someone's day easier.", done: "Now you know what it is. Half of helping is knowing what would help." },
  { id: "o2c", reach: 2, to: "out", act: "Find a photo or a message from someone you care about, and look at it properly.", done: "You gave them a minute of your whole attention. That is rarer than it sounds." },
  { id: "i2a", reach: 2, to: "in", act: "Drink a glass of water, slowly.", done: "You looked after yourself, on purpose, in the middle of a day. That counts." },
  { id: "i2b", reach: 2, to: "in", act: "Name one thing you did lately that was harder than it looked.", done: "You saw it for what it was. Nobody else could have told you that." },
  { id: "i2c", reach: 2, to: "in", act: "Say out loud one small thing you've been putting off. Only say it.", done: "It has a name now, and things with names are easier to walk up to." },

  { id: "o3a", reach: 3, to: "out", act: "Send someone one line: “Thought of you today.”", done: "It's on its way. Somewhere a person is about to find out they were thought of." },
  { id: "o3b", reach: 3, to: "out", act: "Do one small thing for someone before they ask.", done: "They didn't have to ask. That is a gift of its own, on top of the thing you did." },
  { id: "o3c", reach: 3, to: "out", act: "Tell someone thank you, and say what for.", done: "You told them what it was for, so they know you really saw it." },
  { id: "i3a", reach: 3, to: "in", act: "Spend two minutes on the thing you've been putting off. Only two.", done: "Two minutes in, it's a thing you've started. That is a different thing from the one you were avoiding." },
  { id: "i3b", reach: 3, to: "in", act: "Step outside, or to a window, and stay there for one minute.", done: "You gave yourself a minute that wasn't for anything. It was still worth having." },
  { id: "i3c", reach: 3, to: "in", act: "Tell yourself one true, kind thing, the way you'd say it to a friend.", done: "You spoke to yourself the way you'd speak to someone you like. It was true when you said it." },

  { id: "o4a", reach: 4, to: "out", act: "Tell someone one particular thing they did that mattered to you.", done: "They know now. People rarely find out which of the things they did landed, and you told them." },
  { id: "o4b", reach: 4, to: "out", act: "Ask someone how they are, and wait for the real answer.", done: "You waited, and they got to say it. Being asked properly is something people remember." },
  { id: "o4c", reach: 4, to: "out", act: "Offer someone a hand with one particular thing: “Can I take that for you?”", done: "You offered something particular, so they could say yes. That is what makes an offer real." },
  { id: "i4a", reach: 4, to: "in", act: "Ask someone for one small thing you need.", done: "You asked. That is hard, and it lets someone else do a small good too." },
  { id: "i4b", reach: 4, to: "in", act: "Say no to one thing you don't have room for.", done: "You kept some room for yourself. The yeses you give now will be worth more." },
  { id: "i4c", reach: 4, to: "in", act: "Name one small fear out loud, to yourself. Only name it.", done: "You said it and nothing fell down. It is the same size it was, and you are a little bigger beside it." },

  { id: "o5a", reach: 5, to: "out", act: "Get back in touch with someone you've drifted from. One line is enough.", done: "The line is open again. Whatever comes back, you were the one who reached." },
  { id: "o5b", reach: 5, to: "out", act: "Put right one small thing you left undone for someone.", done: "It's done, and it's off both your minds. That is two people lighter." },
  { id: "o5c", reach: 5, to: "out", act: "Say sorry for one small thing, with no explaining.", done: "You said it plainly and left it there. That takes more than it looks like." },
  { id: "i5a", reach: 5, to: "in", act: "Take the first real step on the thing you've been putting off.", done: "It's begun. Starting was the hard part, and it's behind you." },
  { id: "i5b", reach: 5, to: "in", act: "Tell one person about something that's been weighing on you.", done: "You're not carrying it alone now. You let someone in, and that was the brave part." },
  { id: "i5c", reach: 5, to: "in", act: "Do one small thing you've been a little afraid to do.", done: "You did it with the fear still there. That is courage, at a size that fits." }
];

/* The first offer is the same for everyone: one for someone else, two for
   yourself, each a thought. Nobody can get it wrong. */
export const FIRST_OFFER = ["o1a", "i1a", "i1b"];

export function gapById(id) { return GAPS.find(g => g.id === id) || null; }
/* A gap of reach 1 is crossed in the choosing of it. Anything bigger is
   done away from the page, and the person says how it went. */
export function crossedByChoosing(g) { return !!g && g.reach <= REACH.min; }

export function newWalk() {
  return { reach: REACH.min, to: null, planks: 0, bridges: 0, offered: [], log: [] };
}

/* The three gaps to offer now: at the walk's reach, toward `to` ("out",
   "in", or null for either). Ones not yet shown come first, then ones shown
   and not chosen, then the other direction, and last of all ones already
   done, since a good thing can be done twice. Always three, never one twice. */
export function offer(walk, to = walk.to) {
  if (!walk.log.length && !walk.offered.length) return noteOffer(walk, FIRST_OFFER.map(gapById));
  const settled = new Set(walk.log.filter(x => x.outcome !== "smaller").map(x => x.id));
  const shown = new Set(walk.offered.flat());
  const at = GAPS.filter(g => g.reach === walk.reach);
  const rank = g => (settled.has(g.id) ? 4 : 0) + (to && g.to !== to ? 2 : 0) + (shown.has(g.id) ? 1 : 0);
  return noteOffer(walk, at.map((g, i) => ({ g, i })).sort((a, b) => rank(a.g) - rank(b.g) || a.i - b.i).slice(0, 3).map(x => x.g));
}
function noteOffer(walk, gaps) { walk.offered.push(gaps.map(g => g.id)); return gaps; }

/* How one chosen gap came out. Returns { plank, across }: whether a plank
   was laid, and whether that plank finished the bridge. */
export function settle(walk, id, outcome) {
  const g = gapById(id);
  if (!g || !OUTCOMES.includes(outcome)) return { plank: false, across: false };
  walk.log.push({ id, outcome, reach: g.reach, to: g.to });
  if (outcome === "smaller") { walk.reach = Math.max(REACH.min, g.reach - 1); return { plank: false, across: false }; }
  if (outcome === "later") { walk.reach = g.reach; return { plank: false, across: false }; }
  walk.planks++;
  walk.reach = Math.min(REACH.max, g.reach + 1);
  const across = walk.planks >= BRIDGE;
  return { plank: true, across };
}

/* Start another bridge. The reach stays where the person showed it to be. */
export function newBridge(walk) { walk.planks = 0; walk.bridges++; return walk; }

/* What the person has done and what they kept for later, for showing back
   to them. It is theirs: a list of their own acts, never a count or a mark. */
export function trail(walk) {
  const did = walk.log.filter(x => x.outcome === "did").map(x => gapById(x.id));
  const didIds = new Set(did.map(g => g.id));
  const later = [...new Set(walk.log.filter(x => x.outcome === "later" && !didIds.has(x.id)).map(x => x.id))].map(gapById);
  return { did, later };
}

/* ─────────────────────────────────────────────
   File: src/shared/states.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   The state taxonomy: where a person may stand when they come to a
   question of meaning, and a way of placing a few words of theirs against
   it (Phil, 2026-10-03: "Make the state taxonomy a way in from the Start
   tab: Yes"). The twenty-five states and five families are the Drive
   document "Meaning Guide — State Taxonomy", whose cue is the helps index
   in the front of a Gideon Bible: "The states that follow are not
   diagnoses. They are doorways." The placing is the keyword layer of
   "Meaning Guide — Classification Step", which chose embeddings first with
   a keyword layer "as a fast, transparent fallback". The keyword layer is
   what this app has: it runs in the page, for a guest too, with no model
   and nothing sent anywhere. It misses paraphrase and metaphor, as that
   document says ("I feel like a ship with no harbour" matches nothing), and
   when it finds nothing it says so and lets the person choose.

   Each state names the gaps (src/shared/gaps.js) that make a fitting first
   offer, so a state is a way in to the Start tab's small goods. The names
   and families are the document's; the doorway lines, the trigger words
   and the choice of gaps are Claude's.

   Pure: no DOM, no fetch, no imports. The client build inlines this file. */

export const FAMILIES = [
  { id: "existential", name: "The big questions", says: "mortality, purpose, scale, suffering, change" },
  { id: "directional", name: "Path and choice", says: "lost, deciding, starting over, a calling, stuck" },
  { id: "relational", name: "The self among others", says: "loneliness, trust, love, forgiveness, grief" },
  { id: "inner", name: "The self with itself", says: "guilt, pride, anger, fear, contentment, honesty" },
  { id: "transcendent", name: "Reaching beyond the self", says: "awe, gratitude, something larger, doubt and faith" }
];

/* id | family | name: the document's words | door: how the page meets a person standing there |
   words: what in a few lines of theirs points here (a phrase with a space counts double) |
   to: the kind of small good that fits first | leads: the first three gaps to offer, all of reach 1 */
export const STATES = [
  { id: "mortality", family: "existential", name: "Facing mortality", door: "You are looking at the end of a life, your own or one near you. That is the largest thing there is to look at, and you are looking.",
    words: ["dying", "death", "mortal", "mortality", "going to die", "when I die", "afraid of dying", "terminal", "my own death", "end of my life", "running out of time", "growing old", "getting older", "how long I have", "hospice"], to: "in", leads: ["i1c", "i1b", "o1c"] },
  { id: "purpose", family: "existential", name: "Questioning whether life has purpose", door: "You are asking what it is all for. People who never ask that are not better off than you; they have only not got to it yet.",
    words: ["purpose", "pointless", "what's the point", "whats the point", "point of it all", "meaningless", "no meaning", "why bother", "why am I here", "what is it for", "what it's all for", "nothing matters", "hollow", "empty inside"], to: "in", leads: ["i1b", "o1a", "i1a"] },
  { id: "scale", family: "existential", name: "Feeling insignificant against the scale of things", door: "Against the size of things, one person feels like nothing. And yet the size of things is exactly what one person can notice.",
    words: ["insignificant", "don't matter", "doesn't matter what I do", "speck", "so small", "nobody would notice", "one of billions", "the universe", "unimportant", "invisible", "no one would miss", "drop in the ocean"], to: "out", leads: ["o1b", "o1a", "i1a"] },
  { id: "suffering", family: "existential", name: "Wrestling with suffering that seems undeserved", door: "Something has hurt you, or someone you love, that was not earned. There is no good answer to why, and the asking is not a weakness.",
    words: ["unfair", "not fair", "why me", "didn't deserve", "doesn't deserve", "didn't deserve this", "suffering", "suffer", "why do bad things", "cruel", "for no reason", "injustice", "how could god", "why would god", "what did I do to deserve"], to: "in", leads: ["i1c", "o1c", "i1a"] },
  { id: "change", family: "existential", name: "Confronting change or impermanence", door: "Something that was there is going, or gone, and you can feel the ground moving. Noticing that is not the same as losing your footing.",
    words: ["everything changes", "everything is changing", "nothing lasts", "slipping away", "temporary", "fleeting", "won't last", "end of an era", "falling apart", "used to be", "not what it was", "all changing", "impermanent", "impermanence"], to: "in", leads: ["i1b", "i1a", "o1c"] },

  { id: "lost", family: "directional", name: "Feeling lost or without direction", door: "You do not know which way to go. That is a true thing to know, and it is where every direction starts.",
    words: ["lost", "no direction", "directionless", "adrift", "which way", "where to go", "don't know where", "drifting", "aimless", "no idea what to do", "what next", "where I'm going", "where I am going", "no path"], to: "in", leads: ["i1a", "i1b", "o1a"] },
  { id: "decision", family: "directional", name: "Facing a hard decision", door: "There is a choice in front of you, and it is hard because both sides have something true in them. The weight you feel is the weight of caring how it goes.",
    words: ["decide", "decision", "choose", "choice", "can't choose", "cant choose", "should I", "or should", "torn", "either way", "crossroads", "make up my mind", "two options", "dilemma", "can't decide", "cant decide"], to: "in", leads: ["i1b", "i1a", "o1a"] },
  { id: "restart", family: "directional", name: "Starting over", door: "You are beginning again, and not from nothing: you are beginning with everything you learned the first time.",
    words: ["start over", "starting over", "start again", "starting again", "new start", "fresh start", "from scratch", "begin again", "lost everything", "rebuild", "new chapter", "after the divorce", "moved to a new", "new city", "clean slate"], to: "in", leads: ["i1a", "i1b", "o1a"] },
  { id: "calling", family: "directional", name: "Sensing a calling but unsure of it", door: "Something is pulling at you and you cannot yet say what it is for. A pull like that is worth taking seriously before it is worth obeying.",
    words: ["calling", "called to", "meant to", "meant for", "supposed to do", "vocation", "feel drawn", "drawn to", "pulled toward", "pulled towards", "should be doing", "what I'm for", "what I am for", "a voice", "my life's work"], to: "out", leads: ["o1b", "i1b", "o1a"] },
  { id: "inertia", family: "directional", name: "Stuck in inertia", door: "You are not moving, and you know it. The smallest true motion counts for more here than the largest plan.",
    words: ["stuck", "inertia", "can't get going", "cant get going", "can't start", "cant start", "putting off", "procrastinate", "procrastinating", "procrastination", "no energy", "can't be bothered", "same every day", "in a rut", "going nowhere", "can't move", "nothing changes", "unmotivated", "no motivation"], to: "in", leads: ["i1c", "i1a", "o1a"] },

  { id: "loneliness", family: "relational", name: "Loneliness", door: "You are more alone than you want to be. That wanting is not a failing: it is the part of you that is made for other people, still working.",
    words: ["lonely", "loneliness", "alone", "no one to", "nobody to", "isolated", "no friends", "by myself", "miss people", "no one calls", "nobody calls", "on my own", "left out", "no one to talk to", "nobody to talk to"], to: "out", leads: ["o1a", "o1b", "o1c"] },
  { id: "betrayal", family: "relational", name: "Betrayal or broken trust", door: "Someone you trusted did not keep it. What broke was theirs to keep, and the hurt you feel is the measure of how much you had given.",
    words: ["betray", "betrayed", "betrayal", "lied to me", "lying to me", "cheated", "cheated on", "broke my trust", "can't trust", "cant trust", "trust anyone", "went behind my back", "stabbed in the back", "deceived", "let me down", "two-faced"], to: "in", leads: ["i1c", "i1b", "o1c"] },
  { id: "love", family: "relational", name: "Love and its obligations", door: "You love someone, and the love has brought duties with it. The weight of them is the shape of the love, seen from the inside.",
    words: ["love", "in love", "marriage", "married", "my wife", "my husband", "my partner", "relationship", "what I owe", "obligation", "take care of", "taking care of", "caring for", "my kids", "my children", "my parents", "my mother", "my father", "duty", "commitment"], to: "out", leads: ["o1a", "o1b", "o1c"] },
  { id: "forgiveness", family: "relational", name: "Forgiveness, both giving and seeking", door: "Something between you and another person is unsettled: a wrong to be let go of, or one to be owned. Either way, you are carrying it, and it can be set down.",
    words: ["forgive", "forgiveness", "forgiven", "can't forgive", "cant forgive", "apologize", "apologise", "apology", "say sorry", "make amends", "resent", "resentment", "grudge", "let it go", "hurt them", "hurt her", "hurt him", "wronged", "make it right"], to: "out", leads: ["o1c", "o1b", "i1c"] },
  { id: "grief", family: "relational", name: "Grief and loss", door: "Someone, or something, is gone, and the place they held is still there. Grief is love with nowhere to go; it is not a problem to be fixed.",
    words: ["grief", "grieving", "grieve", "died", "passed away", "lost my", "lost her", "lost him", "funeral", "miss him", "miss her", "miss them", "mourning", "widow", "widowed", "bereaved", "gone now", "no longer here", "since she died", "since he died"], to: "in", leads: ["i1c", "o1c", "i1b"] },

  { id: "guilt", family: "inner", name: "Guilt or regret", door: "There is something you did, or did not do, that you cannot put down. That you cannot put it down says something good about you, even if the thing itself does not.",
    words: ["guilt", "guilty", "regret", "should have", "shouldn't have", "shouldnt have", "if only", "my fault", "ashamed", "shame", "can't forgive myself", "cant forgive myself", "wish I had", "wish I hadn't", "wish I hadnt", "blame myself", "never forgive myself"], to: "in", leads: ["i1c", "i1b", "o1c"] },
  { id: "pride", family: "inner", name: "Pride and humility", door: "Something in you does not want to bend, and some part of you suspects it should. Both are worth listening to; only one of them is usually right.",
    words: ["pride", "proud", "humility", "humble", "humbled", "arrogant", "arrogance", "my ego", "better than them", "better than everyone", "admit I was wrong", "can't admit", "cant admit", "look foolish", "look stupid", "superior", "vanity", "being right", "need to be right"], to: "out", leads: ["o1c", "o1b", "i1b"] },
  { id: "anger", family: "inner", name: "Anger", door: "You are angry, and anger is a signal before it is a fault: something you care about has been crossed. The signal is worth reading before it is acted on.",
    words: ["angry", "anger", "furious", "rage", "so mad", "resentful", "want to scream", "seething", "irritated", "lose my temper", "my temper", "frustrated", "frustrating", "bitter", "fed up", "sick of", "hate him", "hate her", "hate them"], to: "in", leads: ["i1c", "i1a", "o1c"] },
  { id: "fear", family: "inner", name: "Fear and courage", door: "You are afraid of something, and you are here anyway. Courage was never the absence of the fear; it is what you are doing right now.",
    words: ["afraid", "fear", "scared", "frightened", "terrified", "anxious", "anxiety", "dread", "worried", "worry", "worrying", "can't face", "cant face", "courage", "brave", "nerve", "panic", "what if", "petrified", "nervous"], to: "in", leads: ["i1c", "i1a", "i1b"] },
  { id: "contentment", family: "inner", name: "The search for contentment", door: "You have been looking for enough, and not finding it. The looking is not the problem; where it has been looking might be.",
    words: ["content", "contentment", "never enough", "never satisfied", "restless", "can't relax", "cant relax", "want more", "always wanting", "at peace", "no peace", "can't enjoy", "cant enjoy", "should be happy", "not enough", "comparing myself", "envy", "envious", "jealous", "unsatisfied"], to: "in", leads: ["i1a", "i1b", "i1c"] },
  { id: "honesty", family: "inner", name: "Self-deception versus honesty", door: "Part of you knows something the rest of you has been avoiding. You would not be here if that part had given up.",
    words: ["lying to myself", "kidding myself", "fooling myself", "pretending", "pretend", "honest with myself", "honesty", "the truth is", "admit to myself", "denial", "in denial", "face the truth", "don't want to see", "dont want to see", "deep down", "making excuses", "excuses", "face it"], to: "in", leads: ["i1b", "i1c", "o1c"] },

  { id: "awe", family: "transcendent", name: "Awe and wonder", door: "Something has stopped you and made you look. That is one of the best things that can happen to a person, and it does not need explaining to be kept.",
    words: ["awe", "wonder", "wondrous", "took my breath", "takes my breath", "beautiful", "beauty", "the stars", "the night sky", "sublime", "so vast", "magnificent", "can't explain", "cant explain", "mystery", "the sea", "the ocean", "the mountains", "speechless", "overwhelmed by"], to: "out", leads: ["i1a", "o1a", "o1c"] },
  { id: "gratitude", family: "transcendent", name: "Gratitude", door: "You have been given something, and you know it. Gratitude is the one feeling that grows when it is spent.",
    words: ["grateful", "gratitude", "thankful", "thank", "thanks", "blessed", "blessing", "lucky", "fortunate", "appreciate", "appreciation", "so much to be", "given so much", "count my blessings", "thank god", "thank goodness"], to: "out", leads: ["o1c", "o1a", "o1b"] },
  { id: "larger", family: "transcendent", name: "The desire to connect to something larger", door: "You want to belong to something bigger than yourself. Most people who have found it started exactly where you are: with the wanting.",
    words: ["something larger", "something bigger", "something more", "part of something", "greater than myself", "bigger than me", "bigger than myself", "god", "prayer", "pray", "praying", "spiritual", "the divine", "higher power", "belong", "connected to everything", "transcend", "sacred", "the holy"], to: "out", leads: ["o1a", "i1a", "o1b"] },
  { id: "doubt", family: "transcendent", name: "Doubt and faith as a pair", door: "You believe and you doubt, or you used to believe and are not sure now. The two have always come together; a faith that was never doubted was never held.",
    words: ["doubt", "doubting", "doubts", "faith", "believe", "belief", "don't believe", "dont believe", "used to believe", "lost my faith", "still believe", "is god real", "is there a god", "can't believe anymore", "cant believe anymore", "unbelief", "want to believe", "skeptic", "sceptic", "losing my religion", "agnostic", "my religion"], to: "in", leads: ["i1b", "o1c", "i1a"] }
];

export function stateById(id) { return STATES.find(s => s.id === id) || null; }
export function familyById(id) { return FAMILIES.find(f => f.id === id) || null; }
export function statesIn(family) { return STATES.filter(s => s.family === family); }

const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/* A single word matches as a whole word, with a plain ending allowed
   (lost, losts, losting are all "lost"); a phrase matches anywhere. */
function hits(text, word) {
  if (word.includes(" ")) return text.includes(word.toLowerCase()) ? 2 : 0;
  return new RegExp("\\b" + escRe(word.toLowerCase()) + "(?:s|es|ed|ing|ly)?\\b").test(text) ? 1 : 0;
}
/* Place a few words of a person's against the states: the keyword layer.
   Returns up to `top` states that something in the words points at, the
   most pointed-at first, ties in the document's order. An empty list means
   nothing matched, and the page says so rather than guess. The words are
   read and let go: nothing here keeps them. */
export function placeWords(words, top = 3) {
  const text = " " + String(words ?? "").toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim() + " ";
  if (text.trim().length < 2) return [];
  return STATES.map((s, i) => ({ s, i, score: s.words.reduce((n, w) => n + hits(text, w), 0) }))
    .filter(x => x.score > 0).sort((a, b) => b.score - a.score || a.i - b.i).slice(0, top).map(x => x.s);
}

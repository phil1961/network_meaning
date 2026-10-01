/* ─────────────────────────────────────────────
   File: src/server/owner-sample.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   The owner's sample stream: Phil's archived chats, in his own words. It
   used to be built into the page, where every visitor received it. Phil,
   2026-09-30: "Remove Phil's streams from the users, and from the guest's
   accounts." It now lives on the server and is given only to the owner
   (GET /api/samples), who sees it in the Stream menu as before. Ideas and
   quotes are his own words; dates and timestamps are illustrative. */

const SAMPLE_NAME = "Sample: Phil's archived chats";
const SAMPLE_STEPS = (function () {
  const P = "Pure-Conscousness.md";
  const META = [
    { source: "Anchors you chose", date: "Sep 20", text: "Anchors: 1 Corinthians 13:13 and Matthew 22:37–39 (KJV)." },
    { source: "JUng-Shadow.md", date: "Sep 24", text: "Sample content from the archived chat JUng-Shadow.md." },
    { source: "Isaiahs-Life.md", date: "Sep 25", text: "Sample content from the archived chat Isaiahs-Life.md." },
    { source: "Fascinating-Disovery.md", date: "Sep 26", text: "Sample content from the archived chat Fascinating-Disovery.md." },
    { source: P, date: "Sep 27", text: "Sample content from the archived chat Pure-Conscousness.md." },
    { source: "Conversation-Motivation (parts 1 and 2)", date: "Sep 28", text: "Sample content from the two archived motivation chats." }
  ];
  const NODES = {
    triad: { step: 0, t: "Faith, hope, charity", kind: "quote", anchor: true, stuck: true, src: "quoted_text", words: "And now abideth faith, hope, charity, these three; but the greatest of these is charity.", cite: "1 Corinthians 13:13 (KJV)", slots: [] },
    great: { step: 0, t: "Love God, love your neighbor", kind: "quote", anchor: true, stuck: true, src: "quoted_text", words: "Thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind. … Thou shalt love thy neighbour as thyself.", cite: "Matthew 22:37–39 (KJV)", slots: [] },
    shadow: { step: 1, t: "The shadow falls in your path", kind: "idea", stuck: true, src: "user_said", at: "04:20", words: "In that shadow lies the things that you don't wanna face.", slots: [] },
    isaiah: { step: 2, t: "Jesus as the endpoint of emergence", kind: "idea", stuck: true, src: "user_said", at: "11:30", words: "There probably is a source to whatever it is that emergence is. … I see the arrival of Jesus Christ as the endpoint of that emergence problem.", slots: [] },
    vector: { step: 3, t: "Meaning is the engine", kind: "idea", stuck: true, src: "user_said", at: "01:15", words: "Everybody has their own meaning, and our meaning is the engine that propels our transformations forward.", slots: ["What's it meaning? How would you respond?"] },
    furnished: { step: 4, t: "Faith is furnished by memory", kind: "idea", stuck: true, src: "user_said", at: "03:40", words: "The child has memories of grandma, what going to the house means, and what was possible last time. Maybe there's a toy over there that's a favorite toy. He immediately imagines playing with that favorite toy.", slots: ["What does a child with no memory of grandma's house trust?", "Where does a furnished faith fail?"] },
    grandma: { step: 4, t: "Grandma's after dinner", kind: "image", stuck: true, src: "user_said", at: "03:05", words: "Your dad or your mom said, you know, such and such will happen after dinner, and by god, you did.", slots: [] },
    car: { step: 4, t: "The car starts every morning", kind: "image", stuck: true, src: "user_said", at: "01:50", words: "Every morning when you wake up, you go out to your car that starts.", slots: [] },
    furniture: { step: 4, t: "Faith becomes furniture", kind: "idea", stuck: true, src: "user_said", at: "04:30", words: "And we trust the car will start. After a while, you stop thinking of it as a fantasy future. It becomes part of the furniture.", slots: ["What happens the morning the car doesn't start?"] },
    invisible: { step: 4, t: "Faith works best when it's invisible", kind: "idea", stuck: false, src: "inferred", reading: "Habit turns faith into background certainty. You only notice it again when it fails.", basis: ["furniture", "car"], slots: [] },
    peter: { step: 4, t: "Peter on the water", kind: "image", stuck: true, src: "user_said", at: "06:10", words: "He took a couple steps, and then began to think about the situation, and then fell into the water. And Jesus reached out his hand and pulled him right up.", slots: [] },
    analysis: { step: 4, t: "Thinking is what sinks it", kind: "idea", stuck: false, src: "inferred", reading: "Faith fails at the moment it gets turned back into analysis.", basis: ["peter", "furniture"], slots: ["Is it the thinking, or the noticing of the wind?"] },
    mustard: { step: 4, t: "The mustard seed", kind: "image", stuck: true, src: "user_said", at: "07:30", words: "If you had the faith of the mustard seed, you could move a mountain into the sea. So that was obviously a conscious construct of the use of faith. So there's certainly thinking involved. Or is there?", slots: ["If thinking is involved, which part: the aim or the step?"] },
    creation: { step: 4, t: "Faith is the creative component", kind: "idea", stuck: true, src: "user_said", replaced: true, at: "09:02", words: "I guess another dimension I would add is that faith is the creative component of the human consciousness.", slots: [] },
    realization: { step: 4, t: "Faith is realization", kind: "idea", stuck: true, src: "user_said", at: "09:40", words: "From a human consciousness point of view, realization of something new is creation in that regard. The realization is the function.", history: ["Sep 27, 09:40. Replaced “Faith is the creative component” from 09:02. Both versions are kept."], slots: [] },
    stable: { step: 4, t: "Stable means something maintains it", kind: "idea", stuck: true, src: "user_said", at: "12:15", words: "It's almost like your realization creates things that become stable. Stable simply means that some other level of your consciousness maintains it.", slots: [] },
    comestay: { step: 4, t: "Things come, stay, and leave", kind: "idea", stuck: true, src: "user_said", at: "13:00", words: "Things come into your world. And then things stay. And then things leave.", slots: ["What does it take to let something leave?"] },
    pure: { step: 4, t: "Consciousness, a pure being", kind: "idea", stuck: true, src: "user_said", replaced: true, at: "00:04", words: "Consciousness, a pure being.", slots: [] },
    watcher: { step: 4, t: "The alarm guards who you are", kind: "idea", stuck: true, src: "user_said", at: "24:10", words: "Wrong means something about your being is being threatened. You've got goals, you've got ideas. … What is the furniture of your consciousness that feels threatened? That's who you are.", history: ["Sep 27, 24:10. Replaced “Consciousness, a pure being”: “the word pure is doing a lot of work.”"], slots: [] },
    robber: { step: 4, t: "The bank robber silences the alarm too", kind: "idea", stuck: true, src: "user_said", at: "27:30", words: "Robbing the bank is in line with his inner self. None of the things that could go wrong during the bank robbery threaten the things that he cared about, or at least not so much that they outweighed his desire for gold.", slots: ["What makes a good untakeable?"] },
    field: { step: 4, t: "A shared field of consciousness", kind: "idea", stuck: true, src: "user_said", at: "17:05", words: "When things come unbidden, we're not operating alone. We're operating in a field of consciousness of others.", slots: ["Who is “Verbenade Capsaro”?"] },
    joined: { step: 4, t: "Peter walked inside Jesus's consciousness", kind: "idea", stuck: true, src: "user_said", at: "20:05", words: "Jesus invited Peter to walk on the water with him in his consciousness, with his consciousness.", slots: [] },
    home: { step: 4, t: "Home is faith made of walls", kind: "idea", stuck: true, src: "user_said", at: "33:40", words: "We make sure that we bring in all the toys from outside. We lock them in the garage. … Everything is anchored where we put them in the hopes that the next day, they'll be there. That's a home.", history: ["Sep 27, 34:15. You corrected “boys” to “toys”. Both versions are kept."], slots: ["What does a person with no walls trust at night?"] },
    foundations: { step: 4, t: "The other foundations of consciousness", kind: "question", stuck: true, src: "user_said", at: "02:30", words: "Along with the other five or six primary foundations of consciousness.", slots: ["Faith is one. What are the other four or five?"] },
    battery: { step: 5, t: "Maintenance on no feeling", kind: "idea", stuck: true, src: "user_said", at: "05:10", file: "Conversation-Motivation-2026-09-28.md", words: "You do that task because you really have a sense of the necessity of the necessity.", slots: [] },
    glory: { step: 5, t: "Glory is an open loop", kind: "idea", stuck: true, src: "user_said", at: "02:40", file: "Conversation-Motivation-2026-09-28-part2.md", words: "The chase for glory is a belief in other people's opinion.", slots: ["Is a verdict you'll never hear a kind of faith?"] }
  };
  const LINKS = [
    ["car", "furnished", "example of"], ["grandma", "furnished", "example of"], ["car", "furniture", "example of"],
    ["furnished", "furniture", "leads to"], ["furniture", "invisible", "my reading", 1], ["peter", "analysis", "my reading", 1],
    ["analysis", "furniture", "tension with", 1], ["mustard", "peter", "pairs with"], ["realization", "creation", "replaces"],
    ["realization", "furnished", "refines"], ["realization", "comestay", "extends to"], ["stable", "furniture", "explains"],
    ["comestay", "stable", "includes"], ["watcher", "pure", "replaces"], ["watcher", "peter", "explains"], ["robber", "watcher", "tests"],
    ["field", "joined", "grounds"], ["joined", "peter", "reframes"], ["home", "furniture", "example of"], ["foundations", "furnished", "raised with"],
    ["furnished", "triad", "traces to"], ["robber", "triad", "traces to"], ["isaiah", "triad", "traces to"], ["joined", "great", "traces to"],
    ["battery", "glory", "same session"]
  ].map(([a, b, f, r]) => ({ a, b, f, read: !!r }));
  const FLAGS = [
    { step: 3, id: "s-meaning", type: "unanswered", text: "“When somebody says to you, what's it meaning? How would you respond?”", detail: "Asked Sep 26. The conversation moved on without an answer.", nodes: ["vector"], question: "When somebody says to you, “what's it meaning?”, how would you respond?" },
    { step: 4, id: "s-kastrup", type: "garble", text: "“Verbenade Capsaro” → Bernardo Kastrup?", detail: "Sep 27, 17:05. You cited this thinker for consciousness as a shared field.", nodes: ["field"], phrase: "Verbenade Capsaro", suggestion: "Bernardo Kastrup" },
    { step: 4, id: "s-scient", type: "garble", text: "“The scientists are big on this idea of clearing” → Scientologists?", detail: "Sep 27, 41:20. Said alongside Landmark.", nodes: [], phrase: "scientists", suggestion: "Scientologists" },
    { step: 4, id: "s-echo2", type: "echo", text: "“The shadow falls in your path” ↔ “The alarm guards who you are”", detail: "Sep 24 and Sep 27. Both are about something in you that you'd rather not face.", nodes: ["shadow", "watcher"] },
    { step: 4, id: "s-gap", type: "gap", text: "“Five or six primary foundations of consciousness.” You named one.", detail: "Sep 27, 02:30. Faith was the one.", nodes: ["foundations"], question: "You said faith is one of five or six primary foundations of consciousness. What are the others?" },
    { step: 4, id: "s-toys", type: "correction", text: "“boys” → “toys”", detail: "Sep 27, 34:15. Both versions kept. “toys” leads.", nodes: ["home"] },
    { step: 5, id: "s-echo1", type: "echo", text: "“Maintenance on no feeling” ↔ “Stable means something maintains it”", detail: "Sep 28 (the battery terminals) and Sep 27. Both describe upkeep that runs without being felt.", nodes: ["battery", "stable"] },
    { step: 5, id: "s-tension", type: "tension", text: "Sep 28: “An application that helps create a meaning map of the ideas a user presents.” Earlier: the theology was the deliverable and the app was there to help round out thoughts.", detail: "The first is your words. The second is a summary from the handoff, not a quote. They point at different first builds.", nodes: [], question: "Earlier the app was there to serve the theology. Now the app is the goal. Which comes first for you?" },
    { step: 5, id: "s-bet", type: "bet", text: "Expected you to come back to “home.” You went to motivation instead.", detail: "Bet recorded Sep 27. A missed bet gets extra attention next pass.", nodes: ["home"] }
  ];
  const steps = META.map((m, i) => ({ kind: "ingest", seq: i, at: null, date: m.date, source: m.source, text: m.text, model: null, tier: null, result: { add: {}, touch: [], replace: [], links: [], flags: [], question: "" } }));
  for (const [id, n] of Object.entries(NODES)) {
    const c = JSON.parse(JSON.stringify(n)); delete c.step;
    c.date = META[n.step].date; c.file = c.file || META[n.step].source; c.history = c.history || [];
    steps[n.step].result.add[id] = c;
  }
  for (const l of LINKS) steps[Math.max(NODES[l.a].step, NODES[l.b].step)].result.links.push(l);
  for (const f of FLAGS) { const c = { ...f }; delete c.step; steps[f.step].result.flags.push(c); }
  steps[4].result.question = "You said faith becomes “part of the furniture” once it's habitual. Then you said Peter sank when he started thinking. Is thinking what breaks the furniture, or is it something else?";
  return steps;
})();

/* What the owner's Stream menu gets beside the samples everyone has. */
export const OWNER_SAMPLES = [{ key: "sample", name: SAMPLE_NAME, steps: SAMPLE_STEPS }];

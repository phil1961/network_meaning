/* ─────────────────────────────────────────────
   File: src/shared/scenes.js
   File Version: 0.1.0
   ─────────────────────────────────────────────
   Bobby's arc: a way in from Start where the person answers for a
   character, never about themselves (Phil, 2026-10-03: "Okay, build", on
   the Drive documents "Meaning Guide — Bridge, Scenarios & Big Five
   Integration", "— Mapping Mechanism & Admin Review Spec", the browser
   session's "Concurrence & Answers" and "Synchronization with VISION.md").

   The model is the spec's: a scene (one plank) holds a choice point, a
   choice point holds options, and an option is the scored unit. "Metrics
   are authored IN, not inferred OUT": every option carries its loadings
   on the ten aspects and its signals toward the twenty-five states
   (src/shared/states.js), written in by hand with a note saying why.
   Nothing is scored after the fact. The weights are AUTHORED HYPOTHESES,
   not measurements: IPIP keying is built for direct self-report, and
   wrapping it in a story means its validated scoring does not carry over.
   The admin view exists to inspect and tune them.

   What the person sees: never a number. Each aspect has a pair of plain,
   honourable descriptions, one for each end, and only a lean past a
   threshold is described at all; the rest stays quiet. The threshold is a
   named setting, untuned, shown in the admin view. The numbers themselves
   are for the admin view, and the person is told from the start that a
   picture is being formed, so that its later showing is a feature and not
   a surprise.

   Every answer is a plank: the bridge is built by taking part, not by
   answering right. Nothing here keeps anything; the answers live in the
   stream as steps (src/shared/replay.js, action "answer").

   All the words, loadings and signals are Claude's first draft, written
   to be tuned. Pure: no DOM, no fetch, no imports. */

export const TRAITS = [
  { id: "O", name: "Openness" }, { id: "C", name: "Conscientiousness" }, { id: "E", name: "Extraversion" },
  { id: "A", name: "Agreeableness" }, { id: "N", name: "Neuroticism" }
];
/* id | trait | name | what it is about | low, high: both ends written as dignified ways of being a person */
export const ASPECTS = [
  { id: "openness", trait: "O", name: "Openness", about: "imagination, beauty, the new",
    low: "You tend to find your footing in what is solid and tested, and you are not easily carried off by a pretty idea.",
    high: "There is something in you that is drawn to what is new and strange, and that sees more in a thing than it first shows." },
  { id: "intellect", trait: "O", name: "Intellect", about: "ideas, reasoning, turning a thing over",
    low: "You lean toward what can be done over what can be argued, and you do not need a theory before you move.",
    high: "You like to turn a thing over and understand it before you trust it, and you enjoy the turning." },
  { id: "industriousness", trait: "C", name: "Industriousness", about: "drive, getting it done",
    low: "You lean toward taking the day as it comes, and you do not drive yourself for the sake of driving.",
    high: "There is something in you that likes to get the thing done, and finds its rest in having done it." },
  { id: "orderliness", trait: "C", name: "Orderliness", about: "things in their place, a plan kept to",
    low: "You sit easily with a bit of mess and a plan that bends.",
    high: "You tend to like things in their place and a plan you can count on." },
  { id: "enthusiasm", trait: "E", name: "Enthusiasm", about: "warmth, company",
    low: "You lean toward quieter company and do not need a crowd to feel at home.",
    high: "There is a warmth in you that comes out easily around other people, and they feel it." },
  { id: "assertiveness", trait: "E", name: "Assertiveness", about: "taking charge, speaking up",
    low: "You tend to let others take the lead, and you find your own way of being heard.",
    high: "When something needs saying or deciding, you lean toward being the one who says it." },
  { id: "compassion", trait: "A", name: "Compassion", about: "other people's feelings",
    low: "You lean toward helping with what can be done rather than dwelling in how it feels, and that steadiness is a help of its own.",
    high: "Other people's feelings reach you quickly, and you are moved to do something about them." },
  { id: "politeness", trait: "A", name: "Politeness", about: "what is proper, giving others their due",
    low: "You lean toward speaking plainly and bending a rule that does not fit the moment.",
    high: "You tend to keep to what is proper and give people their due, and others are at ease because of it." },
  { id: "volatility", trait: "N", name: "Volatility", about: "how fast things that go wrong show",
    low: "You tend to keep an even keel when things go wrong, and other people steady themselves on that.",
    high: "Things that go wrong reach you fast and show, and that same quickness is where your fire comes from." },
  { id: "withdrawal", trait: "N", name: "Withdrawal", about: "dread beforehand, guarding your energy",
    low: "You lean toward meeting hard things head on, without much dread beforehand.",
    high: "You tend to feel the weight of what might go wrong before it does, and you guard your energy when things get hard." }
];

/* How far a lean has to go before it is described at all. Anything
   nearer the middle than this stays quiet: the person is balanced there,
   and that aspect has nothing to say about them. The number is a first
   guess and is not tuned; it is shown in the admin view as such. */
export const PICTURE = { quiet: 2, tuned: false, most: 4 };

/* One character, five scenes, one choice point each, three options each.
   aspects: { aspectId: signed weight }   states: { stateId: signed weight }
   then: what happens next in the story, said to the person after they choose. */
export const ARC = {
  id: "bobby", character: "Bobby", name: "An evening of Bobby's",
  lead: "Bobby went to the store to get milk. Nothing much happens to him this evening, and five small things do. At each one, say what he does. There is no right answer: the bridge is built by answering, and what you say for Bobby is yours to say.",
  scenes: [
    { id: "s1", order: 1, title: "The old friend",
      text: "Bobby is on his way to the store for milk, and the store shuts in ten minutes. On the corner he sees Ray, an old friend he has not spoken to in three years. Ray looks like he has had a bad day. He has not seen Bobby yet.",
      prompt: "What does Bobby do?",
      options: [
        { id: "s1a", text: "Stops and asks Ray how he is, even if the store shuts.",
          aspects: { compassion: 2, enthusiasm: 1, industriousness: -1, orderliness: -1 }, states: { loneliness: 1, love: 1 },
          note: "Puts a person before an errand. Compassion is the main loading; the errand undone costs a little on both C aspects.",
          then: "Bobby stops. Ray talks for longer than Bobby expected, and the store shuts while he listens." },
        { id: "s1b", text: "Waves, says he will call tonight, and goes on for the milk.",
          aspects: { orderliness: 1, industriousness: 1, politeness: 1 }, states: { decision: 1 },
          note: "Keeps the plan and keeps it civil. The promise to call is a small debt taken on; see scene 5.",
          then: "He gets the milk with two minutes to spare. The promise to call rides home in his pocket." },
        { id: "s1c", text: "Walks past. It has been too long, and he would not know what to say.",
          aspects: { withdrawal: 2, enthusiasm: -1, assertiveness: -1 }, states: { loneliness: 1, guilt: 1, fear: 1 },
          note: "Avoidance under social dread. Withdrawal, not volatility: the move is inward. Three state signals, each weak, because the scene is ambiguous.",
          then: "He walks on. Ray did not see him, or did not show that he had." }
      ] },
    { id: "s2", order: 2, title: "The shelf",
      text: "In the store the lights are already half off. The milk shelf is empty except for one carton that went out of date yesterday. The clerk is counting the till and does not look up.",
      prompt: "What does Bobby do?",
      options: [
        { id: "s2a", text: "Asks the clerk whether there is any in the back.",
          aspects: { assertiveness: 2, enthusiasm: 1 }, states: { decision: 1 },
          note: "Speaks up to a stranger who is busy. Assertiveness is the whole of it.",
          then: "The clerk sighs, goes to the back, and comes out with a cold one. Bobby thanks him twice." },
        { id: "s2b", text: "Takes the carton that is a day over. It is probably fine.",
          aspects: { openness: 1, orderliness: -1, volatility: -1 }, states: { contentment: 1 },
          note: "Easy with imperfection; rules bent without heat. A small negative on volatility because nothing about it bothers him.",
          then: "He takes it. At home it is fine, as he thought." },
        { id: "s2c", text: "Leaves without milk and works out something else for the morning.",
          aspects: { intellect: 1, industriousness: 1, withdrawal: 1 }, states: { change: 1 },
          note: "Solves rather than asks. The withdrawal weight is for not approaching the clerk; the intellect weight for the working out.",
          then: "He leaves. On the walk home he decides the morning can be toast and black coffee." }
      ] },
    { id: "s3", order: 3, title: "The message",
      text: "On the way home Bobby's phone buzzes. His sister: \"You said you'd come on Sunday. Are you coming or not?\" He had half forgotten saying it.",
      prompt: "What does Bobby answer?",
      options: [
        { id: "s3a", text: "Yes. And this time he means it.",
          aspects: { politeness: 1, compassion: 1, industriousness: 1 }, states: { love: 1, guilt: 1 },
          note: "Keeps a promise to family under a little pressure. Guilt is signalled by the half-forgetting, not the yes.",
          then: "He writes Yes, and then, after a moment, What can I bring." },
        { id: "s3b", text: "No, he cannot. And he says why.",
          aspects: { assertiveness: 2, politeness: -1 }, states: { honesty: 1, contentment: 1 },
          note: "Plain speaking at a small social cost. Honesty signalled; the negative politeness is the cost, not a fault.",
          then: "He writes it plainly. The reply takes a while to come, and when it does it is only: Fine." },
        { id: "s3c", text: "Puts the phone back in his pocket. He will answer later.",
          aspects: { withdrawal: 1, orderliness: -1 }, states: { inertia: 1, guilt: 1 },
          note: "Deferral. Weak loadings, because one deferred message is ordinary; the signals are to inertia and guilt together.",
          then: "The phone buzzes once more on the walk, and he does not take it out." }
      ] },
    { id: "s4", order: 4, title: "The kitchen",
      text: "Home. The porch light has been left on all day and the kitchen is as the morning left it: dishes, crumbs, a pan on the hob. Bobby is tired.",
      prompt: "What does Bobby do first?",
      options: [
        { id: "s4a", text: "Cleans the kitchen before anything else.",
          aspects: { orderliness: 2, industriousness: 1 }, states: { inertia: -1 },
          note: "Order before rest. A negative signal to inertia: this is the opposite of being stuck.",
          then: "Twenty minutes, and the kitchen is a kitchen again. He feels better than the twenty minutes cost." },
        { id: "s4b", text: "Makes tea and sits in the half dark for a while first.",
          aspects: { withdrawal: 1, openness: 1, volatility: -1 }, states: { contentment: 1 },
          note: "Rest taken on purpose, without irritation. Withdrawal here is retreat as replenishment, which is why the weight is 1 and not 2.",
          then: "He sits. The kitchen can wait, and it does." },
        { id: "s4c", text: "Says, out loud and to nobody, who exactly left it like this.",
          aspects: { volatility: 2, politeness: -1 }, states: { anger: 1 },
          note: "Irritation outward. The one clear volatility item in the arc.",
          then: "Nobody answers, because nobody is there. He hears himself, and laughs, a bit." }
      ] },
    { id: "s5", order: 5, title: "The call",
      text: "Late. Bobby is in bed with the light off when he remembers Ray on the corner, looking the way he looked. It is past ten.",
      prompt: "What does Bobby do?",
      options: [
        { id: "s5a", text: "Calls Ray now, late as it is.",
          aspects: { compassion: 1, assertiveness: 1, enthusiasm: 1 }, states: { loneliness: 1, love: 1 },
          note: "Acts on the pull straight away, at the cost of the hour. Three light loadings rather than one heavy one.",
          then: "Ray picks up on the second ring. He had not been asleep either." },
        { id: "s5b", text: "Writes him one line: \"Good to see you today. Call me.\" and sleeps.",
          aspects: { politeness: 1, orderliness: 1 }, states: { loneliness: 1 },
          note: "Reaches, but in a bounded way. Politeness for the care taken over the hour; orderliness for the boundary.",
          then: "He sends it and puts the phone face down. In the morning there is an answer." },
        { id: "s5c", text: "Decides tomorrow is better, and means to.",
          aspects: { orderliness: 1, withdrawal: 1 }, states: { inertia: 1, decision: 1 },
          note: "A real decision to wait, and a small retreat; the two cannot be told apart from here, so both are signalled lightly.",
          then: "He turns over. Tomorrow he remembers, around four." }
      ] }
  ]
};

export const sceneById = id => ARC.scenes.find(s => s.id === id) || null;
export function optionById(id) { for (const s of ARC.scenes) { const o = s.options.find(x => x.id === id); if (o) return { scene: s, option: o }; } return null; }
export const aspectById = id => ASPECTS.find(a => a.id === id) || null;

/* The answers a stream holds for this arc: the latest answer for each
   scene, in scene order. answers: st.answers from the reducer. */
export function arcAnswers(answers, arcId = ARC.id) {
  const latest = {};
  for (const a of answers || []) if (a.arc === arcId && sceneById(a.scene) && optionById(a.option)) latest[a.scene] = a.option;
  return ARC.scenes.filter(s => latest[s.id]).map(s => ({ scene: s.id, option: latest[s.id] }));
}
/* The next scene to answer, or null when the arc is walked. */
export function nextScene(answers) {
  const done = new Set(arcAnswers(answers).map(a => a.scene));
  return ARC.scenes.find(s => !done.has(s.id)) || null;
}

/* The two running tallies the spec names: ten aspect scores, rolled up to
   five traits, and a weighting over the states. Pure arithmetic over the
   options chosen; nothing is inferred. */
export function tally(answers) {
  const aspects = Object.fromEntries(ASPECTS.map(a => [a.id, 0]));
  const states = {};
  for (const a of arcAnswers(answers)) {
    const o = optionById(a.option).option;
    for (const [k, w] of Object.entries(o.aspects || {})) if (k in aspects) aspects[k] += w;
    for (const [k, w] of Object.entries(o.states || {})) states[k] = (states[k] || 0) + w;
  }
  const traits = Object.fromEntries(TRAITS.map(t => [t.id, ASPECTS.filter(a => a.trait === t.id).reduce((n, a) => n + aspects[a.id], 0)]));
  const ranked = Object.entries(states).filter(([, w]) => w > 0).sort((a, b) => b[1] - a[1]).map(([id, weight]) => ({ id, weight }));
  return { answered: arcAnswers(answers).length, aspects, traits, states: ranked };
}

/* The picture in plain words: for each aspect whose lean passes the quiet
   threshold, the honourable description of that end; at most `most` of
   them, the strongest first. Never a number. */
export function describe(t, picture = PICTURE) {
  return ASPECTS.map(a => ({ a, v: t.aspects[a.id] })).filter(x => Math.abs(x.v) >= picture.quiet)
    .sort((x, y) => Math.abs(y.v) - Math.abs(x.v)).slice(0, picture.most)
    .map(x => ({ aspect: x.a.id, end: x.v > 0 ? "high" : "low", says: x.v > 0 ? x.a.high : x.a.low }));
}

/* Every option as one row, for the admin's item table. */
export function itemRows() {
  const rows = [];
  for (const s of ARC.scenes) for (const o of s.options) rows.push({ scene: s.id, plank: s.order, title: s.title, prompt: s.prompt, option: o.id, text: o.text, aspects: o.aspects || {}, states: o.states || {}, note: o.note || "" });
  return rows;
}
/* What the arc reaches and how heavily: per aspect, how many options load
   it, the net weight, and the positive and negative sums; per state, how
   many options signal it. States no option reaches are listed, since an
   unreachable state is the thing this view exists to show. */
export function coverage(stateIds) {
  const aspects = ASPECTS.map(a => {
    let items = 0, pos = 0, neg = 0;
    for (const r of itemRows()) { const w = r.aspects[a.id]; if (w) { items++; if (w > 0) pos += w; else neg += w; } }
    return { aspect: a.id, trait: a.trait, items, net: pos + neg, pos, neg };
  });
  const reach = {};
  for (const r of itemRows()) for (const [k, w] of Object.entries(r.states)) { reach[k] = reach[k] || { routes: 0, net: 0 }; reach[k].routes++; reach[k].net += w; }
  const states = (stateIds || Object.keys(reach)).map(id => ({ state: id, routes: reach[id] ? reach[id].routes : 0, net: reach[id] ? reach[id].net : 0 }));
  return { aspects, states, unreached: states.filter(s => !s.routes).map(s => s.state) };
}

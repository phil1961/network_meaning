/* ─────────────────────────────────────────────
   File: src/client/20-sample.js
   File Version: 0.6.0
   ─────────────────────────────────────────────
   The built-in sample streams everyone gets: ordinary steps that never
   went to a server. Darlene and the appointment is the state-layer scenario
   with the three world maps filled in beside it, and Bobby's world is the
   four maps of one world. Both are made up for review. When
   a sample is forked, its steps are copied into the new stream as they
   are, so a saved stream never depends on this file again. The owner's own
   sample (his archived chats) is not here: the server gives it to the
   owner alone after sign-in (src/server/owner-sample.js). */
/* Darlene and the appointment: the state layer walked through in time, with
   the three world maps filled in beside it. State facts are put forth, a
   goal is read in the text and confirmed, moves bring it closer and set it
   back, a supposition is ruled out when the world answers, and reaching the
   goal changes the state. A second goal shows the ground being stuck.
   Phil, 2026-09-30: "Add some data to Bobby and the milk stream to his
   Environment, Mental State and Assumptions. Change the goal too that way
   we don't duplicate what already exists. Maybe change Bobby to Darlene."
   All of it is made up, for review. */
const DARLENE_NAME = "Sample: Darlene and the appointment";
const DARLENE_STEPS = (function () {
  const act = (date, source, action) => ({ kind: "action", at: null, date, source, action });
  const item = (date, id, map, text) => act(date, "item", { type: "item", id, map, text, supposed: true });
  const link = (date, a, b, f) => act(date, "link", { type: "link", a, b, f });
  const ask = (date, id, text) => act(date, "ask", { type: "ask", id, text });
  const STORY = "Darlene, the story", SAID = "Darlene took Thursday morning off to drive her mother to the eye doctor.";
  const steps = [
    /* where she stands, and a goal that will not move */
    act("Sep 26", "state", { type: "state", stateId: "s-appt", text: "Mom's eye appointment is Thursday at 10." }),
    act("Sep 26", "state", { type: "state", stateId: "s-work", text: "Darlene works Thursday mornings." }),
    act("Sep 26", "state", { type: "state", stateId: "s-nodrive", text: "Mom no longer drives." }),
    act("Sep 26", "goal", { type: "goal", goalId: "g-brother", text: "Get my brother to share the driving." }),
    act("Sep 27", "move", { type: "move", goalId: "g-brother", text: "Left him a message. No call back yet.", effect: "same" }),
    act("Sep 28", "regoal", { type: "regoal", goalId: "g-brother", status: "stuck", note: "Nothing moves until he calls." }),
    /* what was said, and the goal read in it */
    { kind: "ingest", at: null, date: "Sep 29", source: STORY, text: SAID, model: null, tier: null, result: {
      add: {
        d1: { t: "Darlene took Thursday morning off to drive her mother", kind: "idea", stuck: true, src: "user_said", words: SAID, date: "Sep 29", at: "¶ 1", file: STORY, slots: ["Did her mother ask her to?", "Why not her brother?"], history: [] },
        dr1: { t: "She is the one the family counts on", kind: "idea", stuck: false, src: "inferred", reading: "She rearranged her own work for it without being asked. The sentence implies this is not the first time.", basis: ["d1"], slots: [], history: [] }
      },
      touch: [], replace: [],
      links: [{ a: "d1", b: "dr1", f: "my reading", read: true }],
      flags: [{ id: "d-open", type: "unanswered", text: "Did Mom get to the appointment?", detail: "Sep 29 · Darlene, the story. It says she took the morning off. It doesn't say how Thursday went.", nodes: ["d1"], phrase: "", suggestion: "", question: "Did Mom get to the appointment?" }],
      goals: [{ id: "g-appt", t: "Get Mom to the eye doctor", words: SAID, at: "¶ 1", ideaId: "d1", moves: [{ text: SAID, at: "¶ 1" }] }],
      question: "Did Mom get to the appointment?"
    } },
    act("Sep 29", "goal", { type: "acceptgoal", goalId: "g-appt" }),
    act("Sep 29", "state", { type: "release", stateId: "s-work", note: "She took this Thursday off." }),
    /* her environment: the situation, from near to far */
    item("Sep 29", "e-alone", "env", "Mom lives alone, twenty minutes from Darlene."),
    item("Sep 29", "e-doctor", "env", "The eye doctor is across town."),
    link("Sep 29", "e-alone", "e-doctor", "within reach of"),
    item("Sep 29", "e-car", "env", "Darlene has a car that runs."),
    link("Sep 29", "e-alone", "e-car", "by"),
    item("Sep 29", "e-job", "env", "Her job lets her take a morning off if she asks."),
    link("Sep 29", "e-doctor", "e-job", "only if"),
    item("Sep 29", "e-brother", "env", "Her brother lives nearby and has not been asked."),
    link("Sep 29", "e-alone", "e-brother", "within reach of"),
    /* her mental state: what she wants, takes for granted, and means to do */
    item("Sep 29", "m-intent", "mind", "She means to get Mom there on time."),
    item("Sep 29", "m-worry", "mind", "She worries that Mom's sight is getting worse."),
    link("Sep 29", "m-worry", "m-intent", "leads to"),
    item("Sep 29", "m-assume", "mind", "She takes it for granted that Mom will want to go."),
    link("Sep 29", "m-assume", "m-intent", "allows"),
    item("Sep 29", "m-must", "mind", "She feels this appointment can't be missed."),
    link("Sep 29", "m-must", "m-intent", "presses"),
    item("Sep 29", "m-alone", "mind", "She feels the driving always falls to her."),
    link("Sep 29", "m-alone", "m-must", "sharpens"),
    /* her assumptions: what she takes to be right */
    item("Sep 29", "a-care", "moral", "You look after your mother when she can't look after herself."),
    item("Sep 29", "a-promise", "moral", "A promise to family is kept."),
    link("Sep 29", "a-promise", "a-care", "serves"),
    item("Sep 29", "a-share", "moral", "Brothers and sisters share the load."),
    link("Sep 29", "a-share", "a-care", "serves"),
    item("Sep 29", "a-will", "moral", "You don't make someone go against their will."),
    link("Sep 29", "a-will", "a-care", "blocks"),
    /* where the maps meet */
    link("Sep 29", "m-intent", "d1", "carried out as"),
    link("Sep 29", "e-alone", "m-worry", "gives rise to"),
    link("Sep 29", "e-brother", "m-alone", "gives rise to"),
    link("Sep 29", "e-job", "m-intent", "is trusted"),
    link("Sep 29", "a-care", "m-intent", "makes it worth doing"),
    link("Sep 29", "a-will", "m-intent", "limits how"),
    link("Sep 29", "a-share", "m-alone", "presses"),
    ask("Sep 29", "m-assume", "Has anyone asked Mom whether she wants to go?"),
    ask("Sep 29", "e-brother", "Why hasn't he been asked?"),
    ask("Sep 29", "a-will", "What does Darlene do if Mom says no?"),
    ask("Sep 29", "e-job", "Did she give something up to take the morning?"),
    /* moves, and the world answering */
    act("Sep 30", "move", { type: "move", goalId: "g-appt", text: "Asked my manager for Thursday morning. He said yes.", effect: "closer" }),
    act("Sep 30", "confirm", { type: "confirm", id: "e-job", note: "He said yes." }),
    act("Oct 1", "move", { type: "move", goalId: "g-appt", text: "Mom says she doesn't want to go.", effect: "farther" }),
    act("Oct 1", "ruleout", { type: "ruleout", id: "m-assume", note: "Mom said she doesn't want to go." }),
    act("Oct 1", "move", { type: "move", goalId: "g-appt", text: "Talked it through. She'll go if we have lunch after.", effect: "closer" }),
    act("Oct 2", "reach", { type: "reach", goalId: "g-appt", text: "Mom saw the eye doctor." }),
    act("Oct 2", "state", { type: "release", stateId: "s-appt", note: "It's done." }),
    act("Oct 2", "state", { type: "state", stateId: "s-glasses", text: "Mom needs new glasses." }),
    /* A Help analysis, made up like the rest and not made by any model, so that
       a guest (who cannot call the AI) can see suggestions and give a word on
       each, and so the Evidence view has something to count. */
    act("Oct 2", "help analysis", { type: "analysis", id: "h-darlene", model: "made up for the sample",
      standing: "The appointment goal is reached, and Mom needs new glasses. The goal to share the driving has not moved since Sep 28.",
      suggestions: [
        { id: "h-darlene-1", kind: "loose", text: "Is “Did Mom get to the appointment?” answered now? The goal is reached, and Now says Mom saw the eye doctor.",
          why: "The loose end is still open, and the state of play answers it.", about: [{ on: "flag", id: "d-open" }, { on: "goal", id: "g-appt" }, { on: "state", id: "s-g-appt" }] },
        { id: "h-darlene-2", kind: "move", text: "Mom needs new glasses, and picking them up is a second drive. Ask your brother for that one trip, by name and by day.",
          why: "The goal to share the driving is stuck on a message with no answer. A request for one dated trip is a different move.", about: [{ on: "goal", id: "g-brother" }, { on: "state", id: "s-glasses" }, { on: "idea", id: "e-brother" }] },
        { id: "h-darlene-3", kind: "question", text: "Lunch after is what moved Mom from no to yes. Was the lunch the point for her, more than the eye doctor?",
          why: "The move that brought the goal closer was an offer of time together, and “You don't make someone go against their will” limited how.", about: [{ on: "goal", id: "g-appt" }, { on: "idea", id: "a-will" }] }
      ] })
  ];
  steps.forEach((x, i) => { x.seq = i; });
  return steps;
})();

/* Bobby's world: the four maps of one world (what was said, environment,
   mental state, assumptions), assembled by the built-in world script. The
   sample is that script run here with no server, so the two cannot drift.
   All of it is made up (2026-09-30). */
const WORLD_NAME = "Sample: Bobby's world";
const WORLD_STEPS = scriptToSteps(SCRIPT_EXAMPLES.world.text, replay).steps;

/* Every built-in sample, by key. The owner's sample is added under the key
   "sample" once the owner has signed in, and taken away at sign-out. */
const SAMPLES = { darlene: { name: DARLENE_NAME, steps: DARLENE_STEPS }, world: { name: WORLD_NAME, steps: WORLD_STEPS } };
const DEFAULT_SAMPLE = "world";

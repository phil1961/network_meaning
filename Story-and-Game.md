# Story and Game

Voice session, 2026-09-30. Continues Three-Layers.md. Phil's framing;
Claude's contributions marked.

## Story

A person exists in a story. A story written by a good author already paints
out everything this system is trying to map — without ever naming the layers.
Character, setting, conflict: foundation, environment, and the friction
between them, rendered as events.

Story supplies what the graph does not: **time**. Things change. Partly
through your own actions, partly through your reactions to other people's
actions. A story is a vector that actually moves — the person changes, or
fails to.

Open: whether story is an input form (have people narrate rather than assert)
or an output form. Not settled.

## Game

Games achieve, deliberately and at scale, what this system is after. People
spend hours on a quest. The best games have a great deal of this story
structure built in, and there is probably a real science behind it worth
learning from.

Claude's notes on the craft:

- **Core loop** — action, feedback, a small legible change in state, repeat.
  This is motivation-as-gap, engineered on purpose.
- **Difficulty curve** — good games hold the gap between current capability
  and quest demand in a narrow band. Too small is boring; too large is
  despair. That is the tension calculation with a *target value*, not merely a
  measurement.
- **Caution** — games manufacture the gap. This system must read a real one.
  Quest design cannot invent the goal, only surface it.

## Generate the game at goal time

Phil's key move: the game is **not** authored in advance. A game designer
starts work the moment a goal is named. State a goal, and the goal gets
wrapped in a generated game.

The materials are already computed:

| Layer | Supplies |
|---|---|
| Foundation | the rule set |
| Environment | the map — where the walls are |
| Terrain | which walls are breakable |
| Goal | the quest |

So the generator is not inventing a world. It renders the one already
computed as something playable.

The designer has one lever this system lacks: control of difficulty. A
designer tunes the gap; this inherits it. So the generator's real lever is
**sequencing** — which sub-quest first, given what is plastic right now. You
cannot lower the mountain, but you can choose the order.

**The person plays it.** That is the goal, not a spectator view.

Two consequences (Claude's):

1. **The loop has to close through real life.** Moves happen out in the
   person's world, so the app only learns the outcome when they come back and
   narrate it. Action → live it → report. That is slow, and it is where
   systems like this usually die.
2. **Failure has to be allowed.** A game lets you retry; real terrain
   sometimes does not move. If the generator keeps issuing quests against a
   wall that will not break, it becomes a nagging machine. It needs to be able
   to say: the ground is stuck, pick a different goal.

**Time grain** — undecided, and probably should not be a fixed app setting.
The terrain sets the tempo: plastic ground gives feedback in days; a career
move or a relationship gives signal in months, where a daily check-in only
manufactures noise. The grain follows the quest. Corollary: if there is
nothing to report, do not ask.

## Motivation is excitable

Phil: in a real game, achieving a minor step along the way is exciting,
because it makes the goal feel more possible.

Claude's account of the mechanism: the excitement is not "I got one step
closer." It is **new evidence that the ground is more plastic than believed**.
The wall moved. Everything behind that wall gets revalued at once.

This is why small wins are not small. They are information about terrain, and
terrain is what the whole tension calculation rests on. One step does not
shrink the gap by one step — it can collapse it.

Design consequence: the generator should select the sub-quest with the highest
**information value** about whether the ground moves. Not the easiest step —
the most revealing one.

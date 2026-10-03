# Network Meaning: A Vision

Written 2026-09-28. A first attempt at describing the finished software: what
it feels like to use, how it works underneath, and what the screens look like.
Everything here is a proposal to argue with. The raw material is in
`HANDOFF-Salient-Points.md`, and the source chats are in `_archive/`.

---

## The goal

**"The goal of the end result app is to promote human understanding by
allowing exploration and documentation of ideas and motivation and meaning
for oneself and others."** (Phil, 2026-09-30.)

Everything in this document serves that sentence. The map, the verbatim
words, the one question, and the loose ends are the means of exploring and
documenting. Understanding, one's own and other people's, is what they are
for. What "others" asks of the software is not settled yet: reading or being
shown someone's map, keeping a map of one's own, or both.

### Statements from Phil (verbatim, dated)

Phil's rule, 2026-09-30: his statements about the app are recorded here and
in `HANDOFF-Salient-Points.md` as he gives them, exactly as said. Claude's own
enhancements are kept apart in §9, labelled as experiments under lab test.

**2026-09-30, containers and perspective.** "The ideas, thoughts, and
concepts recorded in the tool sit within an overall concept and the concepts
themselves site within a perspective. Both the underlying containing concepts
and the perspective concepts are alterable, and their alteration changes the
things presented by the social environment and environment, which in turn
allows a change in user perspective which allows the user to see the facts
and concepts in new ways."

("site within" is most likely "sit within," a dictation slip.)

Nothing in §4 or §5 below has containers or a perspective layer yet. The map
there is flat. §9 holds the experiments that would test this statement
(E1 to E4).

**2026-09-30, time.** "Time has to be considered. How?"

§4.3 covers time for a flat map: an append-only log, replay of any past day,
and come, stay, leave. It says nothing about time for containers and
perspectives. Claude's answers are experiments E5 to E7 in §9.

**2026-09-30, the motivation battery.** "I like the idea of a motivation
energy storage battery which is drawn from and added to."

Not yet said: what adds to it, what draws from it, and whether there is one
per person or one per concept. Claude's proposal is experiment E8 in §9.

**2026-09-30, the background corpus.** "We need to prepopulate the
background environment with a corpus that itself can be explored and its
concepts and relationships can be tweaked."

§4.2 has a loaded source text (KJV, WEB), used only to check that a quote is
verbatim. A corpus that is mapped, explored, and tweaked is new. Not yet
said: which corpus. Claude's proposal is experiment E9 in §9.

**2026-09-30, parting thought.** "Parting thought. I am an entity with
consciousness and a self/body travelling/gliding through an existing physical
and social structure. My understanding on subjects ebb and flow with every
challenge and with the corresponding attention to the challenge, whose
outcome is desired to be at minimum, life at the present moment... With a
consideration of easily future challenges."

("easily future challenges": one word may be a dictation slip. Left as said.)

The Timeline in §5.4 shows how much an idea was talked about over time. It
does not show how well a subject is understood, and nothing records the
challenge that moved it. No new experiment was added for this one. It bears
on E6 and E8 in §9.

**2026-09-30, evening, phone session.** Three docs written by Claude on the
phone from Phil's voice session, brought into this repo unchanged:
`Three-Layers.md` (foundation, environment, interaction; motivation read off
the gap between the first two), `Story-and-Game.md` (story supplies time;
the game is generated when a goal is named), and
`NEXT-STEP-Three-Layer-Build.md` (the Bobby probe). They are Claude's
phrasing of Phil's framing, with Claude's own contributions marked inside
them, so they are not quoted here as Phil's words. §9 takes its layer
vocabulary from them, revises E4 and E9, and adds E10.

**2026-09-30, the state layer.** "Okay, I see another layer, and that would
be the user's state. When a goal is put forth, the state must eventually
change so that the goal is now part of the person's state. Movement towards
the goal is tracked. For our Bobby went to the store to get milk scenario in
mind. Design me an app that can reflect that. You dont need to worry too
much about how the layers interact, unless you actually have a good idea.
But lets build this."

And, while it was being built: "Also, feel free to make up as much data as
you want. Take a stab, I'll review and revise at a later point after we
review the app."

This one was built the same day. It is experiment E11 in §9, status
*testing*, and the State view in the app. The Bobby data in the app is made
up, for Phil to revise.

**2026-09-30, the help analysis button.** "I want a help analysis button I
can press which makes suggestions given the state of play."

Said while walking the State view on the Bobby sample. Built the same
evening as experiment E12 in §9, status *testing*: a button at the top of
the State view. What "the state of play" takes in, what kinds of suggestion
come back, and where the button sits are Claude's choices, for Phil to
revise.

**2026-09-30, the scripting language and the stepper.** "Great. Now imagine
creating a scripting language that interacts with the app to make it go.
Provide a stepper so we can watch as all the actions happens."

Built the same evening as experiment E13 in §9, status *testing*: a Script
view and a stepper that stays in view on every tab. The words of the
language and the way the stepper shows each action are Claude's choices,
for Phil to revise.

**2026-09-30, yes to the script proposals.** "I think all of your proposals
are a yes."

Said in answer to the four questions Claude put after building the stepper:
should scripts be saved on the server and shared; should a stream be able
to write itself out as a script; should a line be able to check something,
so a script is also a test; may the model write scripts. All four are
agreed and none is built yet. See the note under E13 in §9.

**2026-09-30, modelling a world.** "I want to stream of consciousness some
things first. We are modelling a world, in this case its bobby's world. It
consists of facts about his environment, his mental furniture, and his
motivations. In the case of Bobby Went To The store to buy milk. That's the
end goal and it starts in a place where he needs milk."

("its bobby's world" is most likely "it's." Left as said. He said "to buy
milk" here; the sentence locked earlier is "to get milk.")

Said as the opening of a stream of thought, with more to come, so nothing
is built or proposed from it yet. Against the build as it stands: the State
view's Now holds facts of one kind only. It does not tell a fact about the
environment from a piece of mental furniture or from a motivation, and the
Bobby sample starts from "There is no milk in the house," which is a fact
about the house, not "he needs milk."

*(Note, later the same evening: E14 in §9 built a map each for the
environment, the mental state and the assumptions, and drew "He needs milk"
with a reading on each. Now, in the State view, still holds facts of one
kind.)*

**2026-09-30, a map and a diagram for each feature.** "Good question. But
before we answer that I think our modelling software ought to have maps
that represent each of those features. His environment, mental state, and
assumptions (moral presuppositions). Each of those maps needs their own
diagram that we can select on and improve."

("Good question" answers Claude's question of which of the three "he needs
milk" belongs to. It is set aside, not answered.)

Still part of the stream of thought, so nothing is built or proposed from
it yet. The three named here are not the same three as in the statement
before: "mental furniture" has become "mental state," "motivations" is not
in this list, and "assumptions (moral presuppositions)" is new. Against the
build as it stands: the app has one map with one diagram, the map of ideas
drawn from what was said. The State view is lists, not a diagram. There is
no map of the environment and none of assumptions, and nothing on any map
can be edited in place except keeping or discarding a reading and pinning
an anchor.

*(Note, later the same evening: no longer so. E14 in §9 built the three
maps, a selector above the one diagram, and a panel that confirms, rules
out and adds items.)*

**2026-09-30, the diagrams as the defining feature.** "And what the
diagrams present to represent those sounds like an awesome defining
feature. Because the better job our world modelling does of presenting
those conceptual maps the more wondereful our "engine" component becomes."

("wondereful" is as typed.)

Still the stream of thought. It ties the worth of the engine to how well
the maps are presented. In `HANDOFF.md` §8 the diagram generator was prong
three, the part that "comes last"; this statement puts it at the front.
Claude's question from the entry before, whether motivation gets a map of
its own, was not taken up and stays open.

**2026-09-30, make one up for Bobby.** "I suggest it'll have to visuallized
with the diagramming capability we've already made a stab at. I want you to
step back and consider how a world renown psychological investigator would
assemble it. Make one up for bobby, and we'll ad more complications and
nuance as we do."

("visuallized," "renown" and "ad" are as typed. This answers Claude's
question of what is on the diagram of Bobby's environment.)

Built the same evening as experiment E14 in §9, status *testing*: four maps
of one world, drawn by the diagram the app already had, and a made-up world
for Bobby. How an investigator would assemble it, and everything in Bobby's
world beyond the two things that were said, are Claude's, for Phil to
revise.

**2026-09-30, a blank box takes its suggestion.** "Also, a UI improvement.
Where you make a suggestion in a text box, like "e.g. Get Milk", I want to
be able to just click the button (Put it forth, etc), and if the field is
blank it runs with the suggestion and makes that the entry."

Built the same evening, as said. It applies wherever a box shows a
suggestion beginning "e.g.": a state fact, a goal, a move, and an item added
to a world map.

**2026-09-30, other people in Bobby's world.** "I imagine a future for this
app, where we have maps that represent other people in Bobby's world. The
store clerk, his wife or girl friend, his mechanic. And each adds to and
fills out their own interior and exterior representations. Eventually, they
use this software to coordinate their actions."

A picture of the future, not a request to build. It bears on what "for
oneself and others" asks of the software (under "The goal" above): here the
others each keep maps of their own and use them together. Against the build
as it stands: one person signs in, a stream holds one world, and nothing in
it says whose world it is. The store clerk and the mechanic are not in
Bobby's made-up world at all, and "someone else lives there" is a
supposition with no person behind it.

*(Note, later the same evening: "one person signs in" is no longer so. E15
in §9 built accounts at three levels, an area for each person, and streams
an admin can share. A stream still holds one world and still does not say
whose world it is.)*

**2026-09-30, a coordination routine, thousands of people, and the AI
filling in.** "I also imagine a world where this app has a centralized
coordination routine, and thousands of people use their version of the
software. I even imagine AI filling out lots of things that nobody wants to
take the trouble to do. Like attributes for common objects, and actions."

Also a picture of the future. Against the build as it stands: the model
reads text it is given and makes suggestions when asked; it fills in
nothing on its own. One thing already built would carry it: an item on a
world map is either given or supposed, and what the AI fills in could
arrive as supposed, dashed, until someone confirms it. That is Claude's
reading, not Phil's words.

**2026-09-30, counts in the Stream menu.** "Also, for the Stream Drop down
selelector, I want to see the number of Environment, Mental State, and
Assumptions coded on the map. That way when I'm selecting a stream I can
see before I choose how many of them it has"

("selelector" is as typed.)

Built the same evening, as said (app 0.5.1). Each line in the Stream menu
gives the stream's steps and the number of items on its Environment, Mental
state and Assumptions maps, or "no world maps" when it has none. Claude's
additions: the step count on the built-in samples, and the "no world maps"
wording.

**2026-09-30, sign-up and an admin panel.** "I want you to add user signup
mechanism, and for me, a user add ability. Someone should be able to signup
themselves, and I should be able to use an admin panel to add them myself.
Email address is the unique. They should get their own personal area to add
and play with streams, and they should all share Bobby's story."

**2026-09-30, three levels.** "philipalarson@gmail.com is an admin. The
database should have at least three levels. User, Guest, and Admin. What a
user does is stored, what a guest does isn't."

**2026-09-30, a guest and the AI buttons.** "Also, a Guest can't use the AI
Analysis buttons. Those buttons should provide an info box that says he has
to become a registered user to use it."

These three were built together the same evening as experiment E15 in §9,
status *testing* (app 0.6.0). What is Phil's and what is Claude's is set
out there. The owner's email in `.env` is philipalarson@gmail.com, which
makes that account an admin.

**2026-09-30, a check before every call to the AI.** "Also, for every call
out to the AI API, whatever the user provides in that context call has to
be sanity checked for malicious, or stupid inputs"

Built the same evening as experiment E16 in §9, status *testing*.

**2026-09-30, a help doc.** "Great. Now I need a help doc, and the help doc
should contain something on the ultimate vision"

Built the same evening (app 0.7.0): `HELP.md` in the repo, and a Help tab
in the app built from that same file, open to guests too. Its last section,
"Where this is going," quotes Phil's goal and his three statements on
modelling a world, other people's maps, and coordination, and says plainly
which part exists today.

**2026-09-30, a document of the method.** "Also, I love what you have
invented so far with regard to deriving the map data. Make sure to create a
document of your thinking so it can be reliably replicated and to have an
artifact we can track over time in our repo"

Written the same evening: `METHOD-Deriving-the-Maps.md`, version 1, with a
change log. It sets out the stance, the procedure in eight steps, the link
labels, the checks a result has to pass, Bobby as the worked example, the
decisions and the thinking behind each, and where the method is weak.

**2026-09-30, where the panel is.** "Where is the user's panel."

A question, asked while looking for the admin panel. The tab was labelled
"People" and showed only to admins, and the owner's account had not yet
been marked an admin for the session already open. Both are fixed: the tab
is labelled **Admin**, and the owner's account is made an admin when the
server starts.

**2026-09-30, Phil's streams are his own.** "Remove Phil's streams from the
users, and from the guest's accounts."

Done the same evening. The sample *Phil's archived chats* was built into
the page, so every visitor received it. It now lives on the server
(`src/server/owner-sample.js`) and is given only to the owner after
sign-in. Everyone else has the two Bobby samples, and the page opens on
*Bobby's world*. One thing of Phil's is still in the page for everyone: the
Talk tab's simulated voice session, which replays a few of his sentences
about faith. It is not a stream, so it was left, and is flagged for his
decision.

**2026-09-30, yes to the evidence pieces.** "I do want you to add those
peices when you get a chance, but first."

("peices" is as typed.)

"Those pieces" are the three parts of experiment E17 in §9: the Evidence
report, a verdict on each Help analysis suggestion, and script lines that
check a result. Agreed, not built. See the note under E17.

**2026-09-30, spendable resources.** "Bobby has access to spendable
resources, money, time and physical strength. What do you think about
somehow integrating those features?"

A question put to Claude, and the first mention of resources. Against the
build as it stands: a move records whether it brought the goal closer and
nothing about what it cost; "He has the money to pay for it" is one
supposed item on Bobby's Environment map, a yes or no with no amount; time
appears only as the date on a step; strength appears nowhere. Claude's
answer is experiment E18 in §9, *proposed*.

**2026-09-30, the resources are refreshed.** "And he gets those refreshed,
in a paycheck, sleep, and food"

Said a few minutes after the statement above, while E18 was being written.
It adds what E18 lacked: where a resource comes from. In the order given,
the two lists pair as money with a paycheck, time with sleep, and physical
strength with food; whether Phil meant them paired that way is not said.
See the note under E18.

**2026-09-30, motivation is a resource too.** "Yes, motivation energy, or
desire for the end result is also a resource which can be recharged, and
spent."

The "Yes" answers Claude's question whether motivation is one of the
spendable resources or a different kind of thing. It also bears on the
battery statement of the same morning ("drawn from and added to"): the
battery and the resources are now one kind of thing. Phil gives it two
names here, "motivation energy" and "desire for the end result." Not yet
said: what recharges it, as a paycheck, sleep and food recharge the other
three. See the second note under E18, and the note on E8.

**2026-09-30, separate them; eating together.** "No seperate them because
sometimes a social goal is to eat together and I want that accounted for."

("seperate" is as typed.)

Said in reply to Claude's message that put the four resources "on one
ledger," folded the battery into the resources, and asked whether
motivation is held per goal or per person. What "them" refers to is not
certain, and Claude has asked. What is certain from the words: eating
together can be a social goal; Phil wants the app to account for it; and
something Claude had joined is to be kept apart. This is also the first
mention of a *social* goal, one that has other people in it. See the third
note under E18.

**2026-09-30, what refreshes motivation.** "Reflection on the right ideas
refreshes motivation and desire"

This answers Claude's question of what recharges motivation, as a
paycheck, sleep and food recharge the other three. It joins the two halves
of the app: the map of ideas is where motivation is refreshed, and the
goals, moves and resources are where it is spent. It is close to the
purpose in `HANDOFF.md` §1, "to anchor a highly meaningful and
motivational attitude." Not yet said: which ideas are "the right ideas,"
and who says so. See the fourth note under E18.

**2026-09-30, motivation is kept apart.** "Yes, keep motivation apart from
money, time and strength"

The "Yes" confirms Claude's first reading of "separate them" (the third
note under E18): motivation is not on one ledger with the other three.
This settles it. See the fifth note under E18.

**2026-09-30, motivation is held per goal; not building yet.** "Motivation
is held per goal, and yes, we aren't building yet. We have to get to a
point where you see a coherent picture [...]"

(The end of the sentence is left out at Phil's request. It said that he
was not done talking.)

Two things. First, a decision: motivation is held per goal, not per
person. That answers the question open since the battery statement of the
morning (one per person or one per concept) and is noted under E8.
Second, how the work goes for now: Phil is still thinking aloud, nothing
from this stream of thought is to be built, and the aim is a coherent
picture first. That holds for E8 and E18, and Claude takes it to hold for
the evidence pieces of E17 as well until Phil says to start.

**2026-09-30, an invite code.** "Yes, add that feature too when you are on
to make changes."

"That feature" is signing up by invite code, which Claude had suggested
for a site Phil means to show to "a friend or two" and not to publicize.
The code path already existed as a setting in a file on the server. Built
the same night (app 0.9.0) as a choice on the Admin tab: anyone, anyone
with the invite code, or nobody. See the note under E15.

**2026-09-30, change password; go.** "Okay, he's doing some admin stuff.
Also, I need a Change Password Capability for Users while you are at it.
And don't forget, the IIS App will have to be restarted if you make
changes. Commit and Push when through."

This is the word to start on the evidence pieces of E17, with one more
thing asked for. Built the same night (app 0.9.0): **Change password**
beside Sign out. See the notes under E15 and E17.

**2026-09-30, two reviews.** "Great. Grok created a bug analysis, and
brother claude created an archecture doc. Read those and take action
accordingly."

("archecture" is as typed.) Said in the session that built E11 to E16. The
two are `GROK-REVIEW.md` and `ARCHITECTURE.md`, both in this repo. Both
were read in full and acted on the same night (app 0.8.0). What was done
about each finding, and what was left, is in `HANDOFF.md` §16 and
summarized as E19 in §9.

**2026-09-30, Darlene.** "Add some data to Bobby and the milk stream to his
Environment, Mental State and Assumptions. Change the goal too that way we
don't duplicate what already exists. Maybe change Bobby to Darlene."

Done the same night. The sample *Bobby and the milk* is now *Darlene and
the appointment*: a different person and goal (getting her mother to the
eye doctor), the same walk through facts, a goal read in the text, moves
and reaching it, and now five environment items, five mental-state items
and four assumptions beside them, with one item confirmed and one ruled
out. All of it is made up, for Phil to revise.

**2026-09-30, on the server.** "I want to see the app mounted on this
server under: http://www.toughguycomputing.com/network_meaning"

Done the same night. The app runs under IIS as the application
`/network_meaning` on the site toughguycomputing.net, from this folder,
in its own app pool. A visitor who arrives over plain HTTP is sent to
HTTPS. The details are in `README.md` ("On the server") and
`HANDOFF.md` §16.

**2026-09-30, the Talk demo.** "Replace the Talk tab demo with a made-up
one"

Done the same night (app 0.9.1). The Talk tab had replayed a few of Phil's
own sentences about faith to every visitor. It now plays a made-up session:
Darlene talking about Thursday, with one mis-heard word ("off the mall
adjust" for ophthalmologist) and one question. With this, nothing of
Phil's own is in the page that everyone receives; a test holds that.

**2026-09-30, colour.** "also while you are at it provide some colors to
the app. Either matte background to the whole thing or styles. Your
choice."

Done the same night (app 0.9.1). Claude chose a matte background with a
little style on top: a warm matte paper for the whole app with cream panels
on it, a deep slate band for the header with the chosen tab in gold, and a
colour along the top of each State card (green for Now, blue for Goals,
purple for Help analysis). The three map colours are unchanged in meaning.
Every colour is a token at the top of `src/client/style.css`, with a dark
set beside it, so the palette can be changed in one place.

**2026-10-01, size, move and centering controls.** "brother ai claude has
finished. But now I have one more set of changes and they relate to the map
diagrams, we need some size, move and centering controls." And then:
"Proceed to completion, document as needed and push, commit and sync with
google drive"

Built the same night (app 0.10.0). Above the diagram, on the right: **Size**
(− and +, with the percentage between them to go back to full size),
**Move** (four arrows), and **Center**, which puts the middle item back in
the middle. Claude's reading of the three words, for Phil to correct: size
is how large the whole diagram is drawn, move is moving the whole diagram
within its frame, and centering is undoing the move. It is the view that
changes, not the map: none of it makes a step. Claude's additions:
dragging the diagram with the mouse, Ctrl and the wheel for size, the
arrow keys and + and − from the keyboard, and the size being remembered in
the browser. Not built, and it may be what "move" was also meant to cover:
moving one box by hand to arrange a map. That would change the map and
would have to be a step, so it is left for Phil to ask for.

**2026-10-01, drag a single box; the page is too big.** "Yes, I also want
to drag a single box, and also, the page itself is too big to fit on a
regular sized browser window. I cant see the bottom of the app's lower
edge"

("cant" is as typed.)

Both built the same night (app 0.11.0). A box other than the middle one can
be dragged, and where it is dropped is a step. The Map view now takes the
height of the window: the diagram's frame is the room that is left, and
the panel beside it scrolls inside itself. Claude's choices, for Phil to
judge: a moved box is kept for the diagram drawn around one middle item,
not for the map as a whole, because the diagram is drawn afresh around
whatever is in the middle; the drawing is not shrunk below the point where
its words can be read, so on a short window part of a large map lies
outside the frame, and the edge says so; and the key to the diagram folds
away. Only the Map view was made to fit; the other tabs still scroll.

**2026-10-01, sign-in counts.** "also, I want to track the number of times
a user logs in and his first and last login DTGs"

Built the same night (app 0.11.0). The Admin tab shows, for each person,
how many times they have signed in and the date and time of the first and
the last. Claude's readings: signing up counts as the first sign-in;
coming back with a session that is still good is not counted, so this is a
count of sign-ins and not of visits; and the count starts from the night
it was added. "DTG" is taken as date and time; the tab shows them in the
viewer's own local time, not in the military date-time-group form.

**2026-10-01, it worked.** "awesome. When finished, commit push and sync
with google drive"

Said after dragging a box on the live site and seeing it stay. A minute
before, the same drag had sprung back with an error, because the server
had not yet been restarted with the new code; that is recorded in
`HANDOFF.md` §19.

**2026-10-02, three new docs, and the relationship labels.** "their are
three new docs in google drive. Find them and read"

("their" is as typed.)

The three are Google Docs made that morning in a browser session, in the
Drive folder `network_meaning-docs`. They are not in this repo. *Meaning
Map — Relationship Models: Framework & Review Brief* is a briefing for the
terminal session: the meaning of a map is largely in its labelled links,
with six families of relationship, seven questions to ask of each label,
and five checks on the set. *Sunlight, Movement, and the Meaning Problem*
is a chain of thought from a solar panel to its closing claim that
saturation "is a meaning problem": energy is abundant, the scarce thing is
"the wanting", and how an act feels governs whether it is wanted again.
*From Energy to Decisions — Grounding the Meaning App* joins the two: "Energy
is becoming free; meaning is not." The prose of all three is the browser
session's, not Phil's dictation, so they are quoted here as documents and
not as his words.

Then: "find the relationship labels in the code and document them"

Done the same day as `RELATIONSHIP-LABELS.md`: 39 labels in two lists
(`LINK_LABELS` and `WORLD_LINKS` in `src/shared/replay.js`), and free words
from scripts beyond them. No code was changed.

**2026-10-02, the relationship doc as the core of the engine.** "I believe
this relationship doc will be the core of the magic of the yet to be built
engine. So lets keep our mind wide open on its uses and capabilites."

("lets" and "capabilites" are as typed.)

Said while the document was being written. Taken as an instruction on how
to write it: say what the code has, and lay the uses out without choosing
among them. Section 10 of `RELATIONSHIP-LABELS.md` does that, and E20 in §9
records it as Claude's, proposed and not built. "The yet to be built
engine" is Phil's phrase; what the engine is has not been said.

**2026-10-02, trauma and long recorded patterns.** "A person's mental map
has components of trauma, and long recorded behavior patterns, that are
triggered by discovered patterns he encounters."

Said a few minutes later, with nothing asked. Recorded and not built on.
Claude's reading, for Phil to correct: three things here have no place on
a map today. A mental-state item that is old, laid down by a wound or by
long repetition. A *pattern* met in the world, as against a single fact.
And the relationship between them, "triggered by", which none of the 39
labels says; the nearest, "gives rise to", does not tell a fresh response
from an old one firing again. Noted in `RELATIONSHIP-LABELS.md` §10, M.

**2026-10-02, the ultimate purpose.** "Give me some options abuot what you
think the ultimate purpose of this app will be?"

("abuot" is as typed.)

Asked of Claude, so the answers are Claude's and none is Phil's. Six were
given: (1) an instrument for deciding where one life's energy goes; (2) a
mirror in which a person sees why they do what they do, old patterns
included; (3) a way to understand another person's world, and for people to
find where their worlds differ; (4) a companion for working out and writing
a body of thought traced back to its anchors, which is where the project
began; (5) a shared library of what people have found worth doing; (6) a
test bench for a theory of meaning. Claude's lean, said as a lean: they
nest, and the one the others serve is (3) by way of (2): seeing a world
truly, one's own and then a neighbour's. Phil has not answered.

**2026-10-02, "I agree".** "commit, push and sync with google drive, and I
agree."

Said in reply to the six options and the lean above, with nothing else
between. Claude takes "I agree" to be about the lean as it was put to him
in the session: "these nest rather than compete. You cannot aim your energy
well (1) while an old pattern is aiming it for you (2), and understanding a
neighbour (3) is the same act turned outward. So I would put it as seeing a
world truly, your own and then another's." Those words are Claude's; the
agreement is Phil's, and it is two words. Whether he agrees with the whole
of it or with a part has not been said, and it should not be built on as if
he had written it.

**2026-10-02, "3".** "3"

That is the whole message, sent after the commit and the sync were
reported. Claude takes it as a choice among the six options above, the
only numbered list that had been put to him: (3), a way to understand
another person's world, and for people to find where their worlds differ.
As it was worded to him in the session: "Understanding another person's
world. This is Bobby and Darlene, and 'thy neighbour': two maps of one
situation, and the engine shows where they differ." If that reading is
right, it narrows the "I agree" above to its centre: of the purposes that
nest, the one the others serve is understanding another person. It is one
character, and the reading is Claude's until Phil confirms it.

**2026-10-02, an aspirational section, and the relationship model, in the
help.** "New task. I want an aspirational section available in our help, as
well as data on the relationship model."

Built the same day (app 0.12.0), as two new sections of `HELP.md`, which is
also the Help tab.

*The links: how one thing bears on another* sits after the Map section. It
says how to read a link, how one gets onto a map, and what the app does
with the words today, which is little. Then the 39 words in three tables
(between ideas, within one map, from one map to another), each with what it
says and what kind of relationship it is, and a count by kind. A test holds
the tables to the lists in the code, word for word and in order.

*The aspiration* sits just before "Where this is going". It says the scarce
thing is knowing what is worth doing; that the aim is to see a world truly,
one's own and then someone else's, in three steps; and that the links are
where it will happen. It quotes two of Phil's statements of this day, on
trauma and on the relationship doc. It says plainly that only the first
step exists.

What is Claude's in these, for Phil to correct:
- The wording of the aspiration. It rests on "I agree" and "3" above, which
  are three characters between them. If "3" meant something else, the
  section's centre is wrong.
- "Energy is becoming free; meaning is not" is taken from the Drive
  document *From Energy to Decisions*, whose prose is the browser
  session's.
- What each of the fifteen idea words says. Nothing in the repo defined
  them before; the help now does, in Claude's reading, and the AI still
  chooses among them by the word alone. The world words keep the meanings
  the method document already gave them.
- The eleven kinds, and which word is which kind. Six are the families in
  the relationship brief, in plainer words; five (reading, question,
  belief, identity, place) are added for the words that fit none.
- Putting two more of Phil's statements into a page every visitor can
  read. The help already quoted four at his request ("the help doc should
  contain something on the ultimate vision"); these two follow that.

**2026-10-02, two more docs.** "There are two more docs in google drive
network_meaning. Read"

Two Google Docs made that morning in a browser session, after the help was
built. They sit in the Drive folder `network_meaning`, not in
`network_meaning-docs`, and not in this repo. The prose of both is the
browser session's, so they are quoted as documents and not as Phil's words.

*The Gap, the Bridge, and the Joy of Crossing — Design Thesis for the
Meaning App* runs in eleven steps. Impact is "intelligence times leverage".
Drive is "latent in many people and effective in few". The map is
"external working memory for patterns too big to hold in one head".
Bigness moves authority away from the point of contact, and equipping the
edge can bring it back. The tool must be "genuinely sophisticated
underneath, yet require no sophistication to benefit from", must read a
person's level "from behavior, not a declared setting", and must bring
them along "as they will", in "the user's own" direction. A gap "feels
impassable not because it truly is, but because the crossing is
invisible"; the tool "reveals the bridge — or helps construct one". The
building has to be joyful or it is abandoned, and people who find it
joyful "invent" new gaps, which is its answer to saturation. Its last
step: "The onboarding is the philosophy, enacted."

*Instructions for Terminal Claude — First Crack at the Inviting UI* is a
build brief for that last step: a single page on which "a person feels a
small 'gap' close and enjoys it, within the first minute". Three buttons,
none wrong; a warm acknowledgement; then a slightly bigger gap, three to
five deep; a choice between a good aimed outward and one aimed inward; a
"reach" estimate kept inside and never shown as a score. No points, badges
or streaks. Out of scope by its own words: the map, accounts, saving, and
any scoring of the person.

Read and not built. Phil's message asked for reading only.

**2026-10-02, the inviting UI as a tab.** "Create a new top level tab that
is our inviting UI. Lets see how far you get."

And while it was being built: "And then update a separate help doc for this
new UI Tab."

("Lets" is as typed.)

Built the same day (app 0.13.0). A **Start** tab, first in the row. It
opens on one sentence, the outline of a bridge, and three choices, none of
them wrong. Choosing one crosses it: a plank is laid, the page says what
just happened, and asks whether the next is for someone else or for you.
Each next one asks a little more, and for those the page waits and takes
one of three answers, all of them fine: I did it, keep it for later,
something smaller. Five planks is a bridge crossed. Nothing is counted
against the person, no number is shown, and nothing done there is saved,
sent, or made a step. Its help is a file of its own, `HELP-Start.md`, shown
as the fold at the foot of the tab. The design record is E21 in §9.

What the brief decided and what Claude did: the brief ("Instructions for
Terminal Claude — First Crack at the Inviting UI") set the goal, the six
principles, the three buttons, the outward or inward choice, the depth of
three to five, and what is out of scope. Phil decided it is a tab of this
app. Everything else is Claude's, for Phil to judge:
- The name "Start", and putting it first in the row.
- That a guest, and a person who has just made an account, land on it.
  Someone signing in to an account they already have lands where they did
  before.
- The opening sentence: "One small good thing, right now. It takes a
  moment, and it feels good."
- The bridge as the picture of it, drawn in outline from the start so the
  way across is seen before any of it is built.
- The thirty small goods and every word said after one is crossed.
- That the first three are thoughts, crossed in the choosing, so nobody can
  fail the first one; and that anything bigger is taken on the person's
  word.
- That "keep it for later" lays no plank. The page never says a thing was
  done that was not.
- That the stream bar is put away while Start is open.

**2026-10-03, a state taxonomy.** "commit, push and sync with google drive,
and their is a new doc in the google drive under network_manager_docs"

("their" and "network_manager_docs" are as typed; the folder is
`network_meaning-docs`.)

The document is *Meaning Guide — State Taxonomy*, a Google Doc made that
night in a browser session, so its prose is the browser session's. Its
cue is "the 'helps' index in the front of a Gideon Bible, which maps a
person's condition to words that speak to it." Its ground is "Christian
theology — not as one tradition among many, but as a coherence worked out
over two thousand years," while "people come to these questions from many
faiths, philosophies, and places, and they are met as they are." "The
states that follow are not diagnoses. They are doorways." Then twenty-five
states in five families: existential (mortality, purpose,
insignificance, undeserved suffering, impermanence), directional (lost,
a hard decision, starting over, a calling, inertia), relational
(loneliness, betrayal, love and its obligations, forgiveness, grief),
inner (guilt, pride and humility, anger, fear and courage, contentment,
self-deception), and transcendent (awe, gratitude, the desire to connect
to something larger, doubt and faith as a pair).

Read, recorded, and not built on. Claude's note, for Phil: these are
states of a person, where the Mental state map holds items a person puts
forth and the State view holds facts. A family of states that a map could
be read against is new; nothing in the code has a place for it yet.

---

## 1. The experience in one paragraph

You talk. It listens, keeps your exact words, and quietly builds a map of what
you said: the ideas, the examples, the questions, the corrections, and how
they connect. It doesn't lecture, agree, or summarize at you. When you pause,
it asks at most one question, the one that fills the most interesting gap.
Over weeks, the map becomes a living picture of your thinking. It shows what's
new, what has settled, what has faded, where you contradicted yourself, which
questions you asked and never answered, and which idea from March connects to
the one you had this morning. When you want to write, it hands you your own
thinking back, organized, with your exact words pinned in place.

The handoff files in this repo were made by hand from 14 phone chats. **The
software's job is to produce those files on its own, continuously, for anyone.**

---

## 2. Principles (from the corpus)

1. **Your words are the ground.** Everything you say is kept verbatim with its
   audio. Nothing the machine infers can overwrite it. Inferences are drawn
   differently and can be thrown out.
2. **Surprise is where the value is.** Attention goes where something breaks:
   a contradiction, a correction, a link nobody expected, a question left
   hanging. Confirmations cost nothing and get little.
3. **Everything happens in time.** The map is never rebuilt from scratch. It
   moves forward. Ideas arrive, stay, and leave, and the software shows which
   is which.
4. **Don't anchor too early.** It holds ideas unlabeled and unresolved as long
   as you want. It doesn't force categories.
5. **One question, not a critique.** Its voice is a good listener's: brief,
   curious, specific.
6. **Guard against the flattering mirror.** An AI will find profound meaning in
   anything. The software is built so it *can't* do that without your words
   to stand on.
7. **Plain language on the surface.** Nodes, arcs, and budgets exist
   underneath. The user sees "your words," "my reading," "open question,"
   "connects to," and "you changed this."

---

## 3. A walkthrough

**Monday, in the car.** Phil taps the mic on his phone and talks for six
minutes about faith: the car that starts every morning, the child going to
grandma's, Peter on the water.

As he talks, the phone shows a rolling transcript. One phrase gets a faint
underline: *"Verbenade Capsaro."* He ignores it and keeps driving.

When he stops, a single card appears:

> You said faith becomes "part of the furniture" once it's habitual. Then you
> said Peter sank when he started thinking. Is thinking what breaks the
> furniture, or is it something else?

He answers it out loud, or he doesn't. Either way the session is saved.

**Monday night, at the desk.** He opens the map. Monday's ideas are bright,
new clusters. "Faith is furnished by memory" sits next to "the car starts"
and "grandma's after dinner," all with solid outlines because they're his
words. A dashed node between them says *faith habituates into background
certainty*. That's the machine's reading, and it's marked as such.

The **Loose Ends** tray has three items:
- *"Verbenade Capsaro": did you mean Bernardo Kastrup?* (Confirm / Fix / Ignore)
- *You said faith is one of "five or six primary foundations." You named one.
  What are the others?*
- *This echoes something from Sept 12: "maintenance on no feeling" (the
  battery terminals).* (Link / Not related)

He taps *Link*. A new line appears between two clusters that were weeks
apart.

**Three weeks later.** In the timeline view, the "faith" lane is thick and
settled. "Glory as an open loop" appeared, flared for two sessions, and has
faded. The software doesn't nag about it; it just shows that it's gone quiet.
When he selects the faith cluster and taps **Draft**, he gets an outline in
plain prose. Every one of his quotes is pinned with a play button, and
nothing says "node."

---

## 4. How it works underneath

### 4.1 The pipeline, per session

```
 voice ─► transcript ─► spans ─► extraction ─► reconcile ─► score ─► spend ─► respond
   │          │                     │              │          │        │         │
 audio     garble               candidate      merge with  surprise  deeper   one question
 kept      flags                ideas + links  the map     per item  passes   + bets saved
```

1. **Capture.** Audio is recorded and kept. Speech-to-text runs with
   word-level confidence. Low-confidence words and unfamiliar proper nouns
   become **garble flags**. These are never auto-corrected, only offered as
   guesses.

2. **Spans.** The transcript is cut into spans: sentence-ish units with
   timestamps. Spans are the atoms of stuckness. Everything else must point
   back to at least one span.

3. **Extraction.** A mid-size model reads the new spans with nearby map
   context and proposes items:
   - *kinds of idea:* claim, example or image, question, quote, correction,
     term, person, anchor
   - *kinds of link:* supports, example-of, refines, contradicts, **corrects**
     (A replaces B), raises (a question), answers, echoes
   Each proposal cites its spans. A proposal with no citation is discarded.

4. **Reconcile.** New proposals are matched against the existing map by
   embeddings plus a judgment call from the model. Is this the same idea said
   again, a refinement of it, or something new? Repeats strengthen an existing
   node instead of cloning it. **Corrections never delete.** "Toys, not boys"
   creates a `corrects` link, the old version is kept, and the new one leads.

5. **Frames and slots.** Each idea gets a small set of expected slots: who,
   how, why, when, compared to what. They come from a cheap model call or a
   template per kind. Empty slots are **open vectors**. "Bobby went to the
   store" gets *how did he get there?*, *which store?*, and *why milk?*.
   Links get slots too, because the arcs explode as well as the nodes.

6. **Score.** Every new item gets a surprise score from signals that can be
   measured:
   - contradicts a stuck item (your earlier words, a quoted source)
   - corrects something
   - links two clusters that were far apart
   - breaks a **bet** (see 4.3)
   - leaves a question unanswered at the end of a session
   - comes back after a long quiet period

7. **Spend.** Each session has an attention budget: model calls and tokens.
   It's allocated by surprise. First comes a cheap shallow pass on
   everything. Then deeper passes (a bigger model, a wider search, drafting
   the question) go only to the items that came back rich. A branch stops
   when a pass produces no new idea, link, or question.

8. **Unbidden pass.** In the background, the whole map is searched for
   resonance with today's material. Anything above a threshold goes to Loose
   Ends as an *echo*. It's never pushed into the conversation mid-thought.

9. **Respond.** One question, chosen from the highest-scoring open slots and
   contradictions. It's phrased in your words and short enough to hear while
   driving. Sometimes the right response is no question at all.

10. **Bets.** Before closing, the system writes down what it expects next
    time. For example: *will return to Peter*, or *will resist the label
    "currency."* Next session is scored against them.

### 4.2 Stuck and plastic

Every item carries `kind` (stuck or plastic) and `source`:

| source | stuck? | examples |
|---|---|---|
| `user_said` | stuck | your exact spans |
| `quoted_text` | stuck | a verse matched **verbatim** against a loaded source text (KJV, WEB) |
| `world_probe` | stuck | "I tried it, and here's what happened" |
| `user_confirmed` | stuck | a garble fix or echo you accepted |
| `inferred` | plastic | the machine's readings, generalizations, links |

Rules:
- Plastic can be rewired freely. Stuck can only be interpreted.
- A **verifier pass** checks plastic items against the stuck items they touch.
  Any plastic chain that contradicts something you said gets killed, and the
  contradiction becomes a Loose End for you instead.
- A paraphrased quote is never allowed to look like a quote. If it doesn't
  match the source text verbatim, it's plastic.

This is the brake on the flattering mirror.

### 4.3 Time

- **Activity state** per item, computed from how recently and how often it's
  touched, along with its links: *arriving*, *settled*, *fading*, *gone
  quiet*. This is come, stay, leave.
- **Versioning**: the map is an append-only event log. Any past day can be
  replayed. "What did I think in March?" is a real query.
- **Budget ownership** is a hybrid, answering the open question: each session
  gets a base budget, and *unresolved* threads accumulate budget across
  sessions. What you keep circling gets more attention. That's the lattice
  idea: pull decides what becomes real.

### 4.4 Anchors (optional, per user)

A user can pin a few **anchors**, fixed points they want everything traced
back to. For Phil, those would be the two commandments and the sacrifice.
Other users might pick their company's mission, a set of vows, or none at
all. When anchors exist, every cluster shows its **traceback path** to them
in plain words, and ideas with no path are simply shown as unanchored, not
judged.

This also resolves the tension in `HANDOFF.md`. The app is general, and the
theology is Phil's anchor configuration and content.

### 4.5 Data model (first cut)

```
sessions     id, user, started, ended, audio_uri, budget_spent
spans        id, session, t_start, t_end, text, stt_confidence
items        id, kind, text, stuckness, source, activity, created, last_touched
item_spans   item → span(s)                      -- the traceback to your words
links        id, from, to, type, stuckness, source, confidence
slots        id, item|link, question, filled_by (item|null)
flags        id, type (garble|gap|echo|contradiction|unanswered), payload, status
bets         id, session, expectation, outcome (hit|miss|pending)
probes       id, proposed, result_item (null until reported)
anchors      id, user, text, source_ref
events       append-only log of every create/merge/correct/confirm/kill
```

Postgres with pgvector handles storage and similarity search. The graph is
small per user (thousands of items, not millions), so no dedicated graph
database is needed.

**Decided (2026-09-28): Postgres.** The source of truth is the stream: an
append-only log of steps (`streams`, then `steps` with `seq`, `kind` =
ingest | action, the raw text, and the validated model result as `jsonb`).
The map tables above are a projection, rebuilt by replaying steps. Reset to
zero, rewind, and branch all fall out of that without calling the model
again. The prototype in `mockup.html` uses this exact shape.

### 4.6 Models and stack (a proposal)

- **STT:** a Whisper-class model, run on the server so confidence scores and
  audio are kept. Native phone dictation throws away the confidence data.
- **LLMs:** a tiered budget. A small, fast model (Haiku-class) does cheap
  passes, slot filling, and scoring. A mid model (Sonnet-class) does
  extraction, reconciliation, and questions. A large model (Opus-class) does
  deep passes, drafting, and verification. All calls go through one budget
  meter.
- **Server:** it fits Phil's Windows/IIS servers. The API sits behind IIS (an
  ASP.NET Core or Python app), with Postgres alongside. The phone client is a
  PWA, so there's no app store.
- **Privacy:** this is the inside of someone's head. Everything is private by
  default and exportable to plain markdown. A local-first mode is worth
  designing for early.

---

## 5. What the UI looks like

Five surfaces. The phone is for talking. The desk is for looking.

### 5.1 Talk (phone)

```
┌─────────────────────────────┐
│  Network Meaning      ☰     │
│                             │
│  …and the car starts every  │
│  morning. After a while you │
│  stop thinking of it, it's  │
│  part of the furniture. I   │
│  reach for ̲V̲e̲r̲b̲e̲n̲a̲d̲e̲        │
│  ̲C̲a̲p̲s̲a̲r̲o̲ because…          │
│                             │
│                             │
│         ┌───────┐           │
│         │  ●    │  hold to  │
│         │  mic  │  talk     │
│         └───────┘           │
│  ─────────────────────────  │
│  ? Is thinking what breaks  │
│    the furniture, or is it  │
│    something else?          │
│       [answer]  [later]     │
└─────────────────────────────┘
```

- Big mic. A live transcript. Garbles get a faint underline and are never
  interrupted.
- The question card shows up only after a pause, and only one of them.
- Hands-free mode reads the question aloud.

### 5.2 Map (desktop)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Map ▾   Search…         Focus: faith          [Timeline] [Loose Ends 3]   │
├───────────────────────────────────────────────┬──────────────────────────┤
│                                               │ ┃ Faith is furnished      │
│      ┌──────────────┐                         │ ┃ by memory               │
│      │ the car      │                         │                          │
│      │ starts       │──example──┐             │ YOUR WORDS  ▶ 0:42       │
│      └──────────────┘           ▼             │ "the child has memories  │
│                        ┏━━━━━━━━━━━━━━┓       │ of grandma … immediately │
│  ┌──────────────┐      ┃ faith is     ┃       │ imagines playing with    │
│  │ grandma's    │─────►┃ furnished    ┃       │ that favorite toy"       │
│  │ after dinner │      ┃ by memory    ┃       │                          │
│  └──────────────┘      ┗━━━━━━┯━━━━━━━┛       │ OPEN QUESTIONS           │
│                         ○ ○   ┆ refines       │ ○ what does a child      │
│                  open slots   ┆               │   with no memory trust?  │
│                        ┌╌╌╌╌╌╌┴╌╌╌╌╌╌╌┐       │ ○ where does it fail?    │
│                        ╎ habituates   ╎       │                          │
│                        ╎ into back-   ╎       │ CONNECTS TO              │
│                        ╎ ground       ╎       │ • maintenance on no      │
│                        ╎ (my reading) ╎       │   feeling · Sept 12      │
│                        └╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘       │ • Peter on the water     │
│                                               │                          │
│   ░ faded: glory as an open loop              │ TRACES BACK TO           │
│                                               │ ⚓ Faith, hope, charity   │
├───────────────────────────────────────────────┴──────────────────────────┤
│ solid = your words   dashed = my reading   ○ = open question   ░ = faded  │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Never the whole hairball.** It always shows a neighborhood around a focus.
  You walk the map by clicking outward.
- **Visual grammar:** solid outline for your words, dashed for the machine's
  reading, and hollow dots for open slots hanging off an idea like unplugged
  sockets. Brightness means arriving, full tone means settled, and faded
  means leaving. A thick border marks an anchor.
- **The side panel** is the traceback: your exact words with audio, the
  history ("you changed this on Sept 20; it was 'creation'"), open questions,
  connections, and the path to your anchors.
- You can drag to link, and merge or split ideas. Anything you do by hand
  becomes stuck.

### 5.3 Loose Ends (the inbox)

```
┌──────────────────────────────────────────────────────────────┐
│ Loose Ends                                         12 open   │
├──────────────────────────────────────────────────────────────┤
│ ≈ GARBLE     "Verbenade Capsaro" → Bernardo Kastrup?          │
│                                   [yes] [fix…] [ignore]      │
│ ? UNANSWERED "What's it meaning? How would you respond?"      │
│              asked Sept 26, never answered   [pick up] [drop] │
│ ↔ ECHO       "the shadow falls in your path" ↔               │
│              "the alarm fires when furniture is threatened"   │
│                                   [link] [not related]       │
│ ⚡ TENSION   Sept 28: "app is the goal" vs Sept 27:           │
│              "the app is window dressing"   [talk it through] │
│ ∅ GAP        "five or six foundations." One named.            │
│ ⌛ BET MISSED expected a return to "home." You went to Isaiah. │
└──────────────────────────────────────────────────────────────┘
```

This is the "lost threads" list, made by the machine. Triage is quick: swipe
on the phone, one key on the desk. It's also where you teach the system.
Every confirm or reject becomes stuck data.

### 5.4 Timeline (being in time)

```
        Sep 12      Sep 19      Sep 26      Oct 3       Oct 10
faith   ····▁▂▃▅▇███████████████████████████▇▇▇▇▇▇  settled
motiv.        ▁▃▇█▇▅▃▂▁·                              faded
glory               ▂▆█▆▂·                            gone quiet
meaning                  ▁▂▄▆███████▇▆▅▅▆▇█           active
isaiah                         ▃▇▅▂·    ▁▃▆           returning
              ↑ battery terminals ↔ stability (linked Oct 2)
```

Ideas as lanes. You can see arrival, staying, and leaving, and scrub back to
see the map as it was on any day.

### 5.5 Draft (writing)

Select a cluster and choose **Draft**. You get a plain-prose outline in your
order, not the machine's. Your quotes are pinned verbatim with their dates.
The machine's connective text is visibly marked, and open questions are left
as honest gaps rather than papered over. Graph vocabulary never appears.
Export goes to markdown, which is also how handoffs like the ones in this repo
get generated.

---

## 6. What it refuses to do

- Summarize you in its own words and hand that back as if it were yours.
- Resolve a tension you haven't resolved.
- Reward intensity. Excitement doesn't raise a node's weight. Recurrence and
  links do.
- Interrupt a thought in progress.
- Fill a gap with a plausible guess and not mark it as one.

---

## 7. First build (prong one)

**Prototype status (2026-09-28).** `mockup.html` already runs the
text-in half of this: paste or drop text, ideaify it with Claude, map it,
flag loose ends, ask one question, and save every pass as a step in a stream
that can be reset, rewound, branched, and reopened. Pasted text is the
discovery path. It lets the pipeline be tuned on real material before voice
capture exists. What remains for prong one is real voice, a server, and
Postgres.

The smallest thing that proves it:

1. **Phone Talk screen**: record, transcribe, and store audio and spans.
2. **Extraction and reconcile**, with span citations and stuck/plastic marking.
3. **Loose Ends**: garbles, unanswered questions, gaps, echoes.
4. **A plain neighborhood map**, read-only at first.
5. **One question per session.**

**The first test is already sitting in `_archive/`.** Feed it the 14
transcripts. It passes if it independently finds most of what the hand-made
handoff found: the Kastrup garble, the missing Defining-Consciousness middle,
the unanswered "what's it meaning," the "five or six foundations" gap, and
the shadow↔alarm and battery↔stability echoes. That's a concrete evaluation
set before a single line of UI is polished.

---

## 8. Hard problems, honestly

- **Granularity.** How big is one idea? Too fine and the map is confetti. Too
  coarse and links go missing. This probably needs tuning against real
  transcripts, starting with `_archive/`.
- **Merging.** Deciding "same idea, said again" versus "new idea" is where
  maps rot. Wrong merges lose meaning, and missed merges create clutter.
- **Scoring surprise** without the scores being arbitrary.
- **Graph bloat** after a year of talking. Fading needs to actually retire
  things from view, not just dim them.
- **Voice latency.** The question has to come quickly after a pause, or the
  moment is gone.
- **Trust.** People will pour private things into this. Security and
  exportability aren't features, they're the precondition.

---

## 9. Experiments (Claude's proposals, under lab test)

Everything in this section is Claude's enhancement, not Phil's words. Each one
is an experiment being lab tested: it states what would be tried and what
result would count for or against it. None is part of the design until a
test says so and Phil agrees. Status is one of *proposed*, *building*,
*testing*, *adopted*, *dropped*.

E1 to E4 respond to Phil's 2026-09-30 statement on containers and
perspective, E5 to E7 to "Time has to be considered. How?", E8 to the
motivation battery, and E9 to the background corpus (all under "The goal"
above). E10 and the revisions to E4 and E9 respond to the three docs from
the phone session of 2026-09-30 evening: `Three-Layers.md`,
`Story-and-Game.md` and `NEXT-STEP-Three-Layer-Build.md`, now in this repo.
E11 is the state layer Phil asked to have built. E12 is the help analysis
button he asked for, E13 the scripting language and stepper, E14 the
maps of one world with Bobby's world made up, E15 accounts and the three
levels, and E16 the check before every call to the AI. E17 (evidence) and
E18 (spendable resources) come from a parallel session the same night, and
E19 is what was done about the two reviews. E20 (2026-10-02) is what the
relationship labels could carry for the engine, and E21 is the Start tab
built the same day. Earlier experiments
are revised by a note that refers
to them, never rewritten in place.

**E1. A containing concept is an ordinary idea that other ideas sit within.**
*Status: proposed, not built.*
No new kind of thing. A container is an item on the map, and "sits within" is
a link from an idea to it, drawn as nesting instead of a line. The person
makes or changes a container with an action step, so it replays, rewinds, and
branches like everything else. The machine may suggest a container, but only
as a reading that can be thrown out. Needs new action types in
`src/shared/replay.js`. No database change, since actions are stored as JSON
in the step.
*Test:* take two `_archive/` transcripts already mapped. Have Phil name the
containing concepts by hand. Count how many ideas find a home, how many sit
in two containers at once, and how many refuse all of them. For: most ideas
settle and the leftovers are interesting. Against: most ideas want several
containers, which would mean containment is really just linking.

**E2. A perspective is a named branch of the stream.**
*Status: proposed, not built.*
Branching already copies a stream up to a step without calling the model. A
perspective would be a branch in which the containers are altered (renamed,
regrouped, a different one made the anchor) while every verbatim word stays
identical. Two perspectives can then be laid side by side: same words,
different containers.
*Test:* branch one mapped stream, alter one container, and show the two maps
together. For: Phil can say in a sentence what the second one shows that the
first didn't. Against: the two look the same apart from labels.

**E3. A re-reading pass when a container or perspective changes.**
*Status: proposed, not built.*
After an alteration, one model call re-reads the same verbatim spans under
the new container and reports only what moved: ideas that now belong
elsewhere, tensions and gaps that appear or dissolve, echoes that weren't
visible before. Everything it reports is a reading, marked as the machine's,
and nothing stuck is rewritten. This is the step aimed at "see the facts and
concepts in new ways."
*Test:* run it on the E2 branch. Phil marks each reported change as *new to
me*, *already knew*, or *wrong*. For: a fair share of *new to me* and few
*wrong*. Against: mostly restatement, which is the flattering mirror again.

**E4. Ask what the world shows under the new perspective.**
*Status: proposed, not built.*
The tool can't observe "the things presented by the social environment and
environment." The person can. After a perspective change, the one question
asks what they now notice in people or surroundings that they didn't before.
The answer comes back as the person's own words, stuck, tagged with the
perspective it was seen under. This reuses the world probe from §4.2.
*Test:* over a few sessions, check whether what gets noticed differs by
perspective. For: the observations cluster by perspective. Against: the same
observations show up whichever perspective is active.

**E5. Trying a perspective on is a branch. Adopting one is a dated step.**
*Status: proposed, not built. Revises E2.*
E2 treats a perspective only as a side-by-side branch. A person's view also
changes once, in order, in their life, and that is a before and an after,
not two parallel maps. So there are two operations. *Trying on* is a branch:
hypothetical, and it can be dropped. *Adopting* is an action step on the main
stream with its date. Nothing is overwritten either way. An idea keeps the
record of every container it has sat within and when, the same way a
correction keeps both versions.
*Test:* adopt one alteration on a mapped stream, then rewind past it. For:
the earlier map comes back exactly, and each idea can answer "where did this
sit in September?" Against: the history is there but nobody ever looks at it.

**E6. Two dates on every entry, and fading counted in days.**
*Status: proposed, not built.*
Today a step has one time, when it was recorded. A transcript from March
pasted in October is dated October. Each entry would carry *said on* as well
as *recorded on*, and the timeline would order by *said on*. Come, stay,
leave is counted in passes today (`actOf` in `src/shared/replay.js` says so
in its own comment), so a 14-file drop fades everything at once. It would
weigh calendar days between *said on* dates instead. Words are also tagged
with the perspective that was adopted when they were said, so an old thought
can be read in its own frame.
*Test:* feed the `_archive/` transcripts with their original dates. For: the
timeline matches the order Phil remembers, and nothing fades merely because
it was loaded early. Against: the original dates can't be recovered well
enough to matter.

**E7. Write down what the change is expected to show, then check later.**
*Status: proposed, not built. Extends E4.*
Phil's loop takes time. A perspective is altered today, and the world
presents something different days later. When a perspective is adopted, the
tool records a bet in the person's words: what they expect to notice. Later
sessions are scored against it, using the bets from §4.1 step 10. A missed
bet is a surprise worth attention.
*Test:* three adopted changes, each with a bet, checked two weeks on. For:
hits and misses are both informative. Against: the bets are too vague to
score.

**E8. The motivation battery as a ledger of dated deposits and draws.**
*Status: proposed, not built.*
The battery is a level that replays like everything else: an append-only list
of entries, each one a deposit or a draw, dated, and tied to the person's own
words. The level on any day is the sum to that day, so it rewinds and
branches with the map and can be drawn along the timeline (§5.4). Two
guesses to test, both Claude's. First, what charges it is fruit, not fervor
(§6): a reported action, a loose end closed, a bet that came true. Excitement
alone adds nothing. Second, "maintenance on no feeling" is a draw: doing the
necessary thing when the feeling is absent spends what was stored earlier.
*Test:* hand-mark the two Conversation-Motivation transcripts for moments
that add and moments that draw. For: Phil and the ledger agree on most of
them, and the level's shape over the sessions looks true to him. Against:
the entries are arbitrary, or the number invites gaming and self-judgment.
*Needs from Phil before building:* what adds, what draws, and whether the
battery belongs to the person or to each containing concept.

**E9. The background corpus is a map of its own, loaded before the person
says anything.**
*Status: proposed, not built. May revise E4.*
The corpus goes through the same pipeline as a person's text and is kept as
its own stream. Its words are stuck, as quoted text, and are never shown as
the person's words. Its concepts and relationships are the machine's
readings, so they are plastic: the person can explore them and tweak them.
Each tweak is a dated action step (E5), so the first reading can always be
brought back and two people can hold different tweaks of the same text. The
person's own map links into it. What the corpus presents beside a given idea
depends on the containers and perspective in force. E4 assumed the tool
cannot see the environment. If the corpus is part of that environment, the
tool can see that part, and E4 narrows to the world outside the tool.
*Test:* load one short text Phil chooses, small enough to read the whole
map. Tweak one relationship. For: the text is untouched, the tweak can be
undone, and what is presented beside one of Phil's ideas changes in a way he
can describe. Against: the machine's map of the text is too poor to be worth
tweaking, or tweaks change nothing downstream.
*Cost to know before scaling:* every chunk of a corpus is a model call. A
whole Bible is tens of thousands of verses, so the lab test starts with one
chapter or one short book.
*Needs from Phil before building:* which corpus, and whether everyone starts
from the same one.

**Vocabulary, adopted 2026-09-30 from `Three-Layers.md`:** three layers.
*Foundation:* authored in advance, moral precepts, the theology skeleton.
*Environment:* the person's own situation (job, family, place, the
conditions they feel themselves to be in), which has to be asked for.
*Interaction:* what the person said, which is what the app maps today.
Stuck versus plastic is a property of items on every layer, so it is treated
here as a dimension, not a fourth layer (Phil flagged this and did not settle
it).

**E4, revised 2026-09-30 evening.** E4 said the tool cannot see the
environment. In the three-layer vocabulary, E4 is about the *environment
layer*: what the person's situation shows them under a perspective. It is
asked for, never inferred without confirmation, and each answer is the
person's own words, stuck. `Three-Layers.md` leaves open whether the
environment is asked for directly or inferred from the interaction layer
and confirmed; E10 is where that gets tested.

**E9, revised 2026-09-30 evening.** The "background corpus" of E9 is the
*foundation layer*. The environment is not a corpus and is not part of E9.
One reconciliation, Claude's, not yet Phil's: `Three-Layers.md` calls the
foundation "fixed before anyone talks to the tool," and Phil said the same
morning that the corpus's "concepts and relationships can be tweaked." Both
hold if the foundation's words are stuck and the relationships among them
are plastic, which is how E9 is written. Needs Phil's yes.

**E10. The Bobby probe: one thin sentence, two layers built beneath it.**
*Status: proposed, not built. From `NEXT-STEP-Three-Layer-Build.md`.*
Before any layer is added to the app, run the probe with prompts alone.
Input: "Bobby went to the store to get milk." A foundation list authored by
Phil by hand, a few lines (two commandments, three virtues, the sacrifice).
One model call asked for two things: environment facts the sentence implies,
each citing its span and marked as a reading until confirmed; and foundation
objects the sentence lands on or near, by lookup against the authored list.
The brief's predictions, phone Claude's: the environment partly derives
(somewhere to be, a store within reach, a need for milk, plausibly someone at
home); the foundation does not derive at all until someone asks why the milk
matters.
*For:* the predictions hold, and the run shows plainly whether foundation
objects should be *matched* against an authored set or *proposed* and then
confirmed. That one answer decides the schema, so it has to come out of the
probe, not precede it. *Against:* the model derives foundation precepts from
the bare sentence with confidence, which would mean the foundation can be
inferred and the design consequence in the brief ("authored and matched
against, never inferred") is wrong.
*Then:* the same run on a paragraph with real stakes, and compare. Thin
sentence first, because it costs one call and tests the prediction directly.
*Persistence, if the probe leads to a build:* the environment is kept per
person, but as its own stream, so it replays, rewinds and branches like the
foundation (E9) and the interaction layer. A plain per-person table would
break "what did I think in March."
*Needs from Phil before running:* the hand-authored foundation list.

**E11. The state layer: Now, goals, moves, and the moment a goal becomes
part of the state.**
*Status: built and testing, 2026-09-30. Phil's design; the data is made up
for review.*
A fourth layer beside foundation, environment and interaction: the person's
**state**. Three things in it, all in the person's words and all kept:
- *State facts:* what is true for the person now ("There is no milk in the
  house"). A fact can stop being true; it keeps both dates and moves to the
  past. Nothing is deleted.
- *Goals:* put forth by the person, or read in their text by the model. A
  goal read in the text is a *proposal*, plastic, until the person says
  "yes, this is a goal" or "not a goal." Its words are the cited spans,
  verbatim, by the same rule as ideas.
- *Moves:* what was done toward a goal, each with the person's own reading
  of its effect: closer, no change, farther. Movement toward a goal is the
  list of its moves in order. No distance is invented; the app shows only
  what was reported, as beads on a track and a count.
When a goal is **reached**, the state changes: a new fact enters Now,
marked as coming from that goal, and the goal keeps a pointer to it. That is
the sentence "the state must eventually change so that the goal is now part
of the person's state," made literal. A goal can also be marked *ground is
stuck* (from `Story-and-Game.md`: the app must be able to say so instead of
nagging), *dropped*, or reopened; a move on a stuck goal reopens it.
*How it is built:* eight action types in the one reducer (`state`,
`release`, `goal`, `acceptgoal`, `rejectgoal`, `move`, `reach`, `regoal`),
so the state layer rewinds, branches and replays with the map, and the
database schema did not change. The model's answer gained a `goals` field
(title, cited spans, moves with cited spans, and `existing` to land a move
on a goal already put forth); the prompt shows the model the current state
facts and live goals. A State view in the app: Now, Past, Goals.
*Test so far:* the built-in sample *Bobby and the milk*, 14 hand-made steps,
rewinds cleanly: at step 7 the goal is only a reading from the text and Now
holds the three original facts; at step 14 "Bobby has milk" is a fact that
came from the goal. Two real model runs on 2026-09-30: "Bobby went to the
store to get milk" came back as one proposed goal with one move and the
question "Did Bobby get the milk and bring it home?"; a second paragraph
landed a move on the already-open car goal and proposed the milk goal again.
*For:* Phil can walk the Bobby sample and say the state layer shows what he
meant, and a real paragraph of his own yields goals and moves he recognizes.
*Against:* goals the model reads are mostly wrong or trivial, or the
closer/same/farther reading is not something a person will bother to give.
*Open, Claude's:* the model never proposes that a goal was reached, even
when the text says he "came home with two gallons of milk." Reaching is the
person's call today. Whether the model should at least ask "was that
reached?" as its one question is worth deciding. Also open: how the state
layer meets the containers, perspective and battery. The state facts are
the obvious place for the battery's level to live, if it is a level.

**E12. Help analysis: a button that makes suggestions given the state of
play.**
*Status: built and testing, 2026-09-30 (app 0.3.0). Phil's request; the
design below is Claude's.*
A **Help analysis** button at the top of the State view. Pressing it makes
one model call that reads the state of play at the latest step and returns
one or two sentences on where things stand and at most six suggestions.
- *What the model is shown:* Now (the standing facts), the past facts, every
  goal with its moves in order, dropped goals, the loose ends still open,
  the ideas on the map with their open questions, and the last question the
  app asked.
- *Kinds of suggestion:* **next move** (one step toward an open goal; the
  prompt asks for the small step that would show most plainly whether the
  ground moves, from `Story-and-Game.md`), **reached?** (the moves read as
  if a goal may be reached; it asks, it never declares), **now** (a fact
  that may no longer be true, or one that is missing), **stuck?** (an open
  goal that is not moving), **loose end** (one the state of play now bears
  on), **question** (one thing worth asking).
- *The brake:* every suggestion must point at something in the state of
  play (a fact, a goal, a loose end, an idea). One that points at nothing,
  or whose kind does not fit what it points at, is dropped and counted, the
  same rule `normalize.js` applies to ideas. A goal already marked *ground
  is stuck* cannot be asked about again as "stuck?"; that is the no-nagging
  rule. The prompt forbids praise and encouragement (§6).
- *Suggest, don't decide:* a suggestion changes no fact, goal or move. It is
  shown as the machine's reading, with links to what it rests on. The
  person acts with the ordinary buttons, or doesn't.
- *In time:* the analysis is a step in the stream (action type `analysis`,
  made only by the server), so it rewinds, branches, and comes back on
  reload without calling the model again. Only the latest is in view, with
  a count of the steps taken since it was made. No database change.
*How it is built:* `src/server/analyze.js` (prompt, schema, validation),
`POST /api/streams/:id/analyze`, one new case in the reducer, and the card
in `src/client/65-statelayer.js`. Pressing it on a built-in sample starts a
saved copy first, like any other action.
*Test so far:* one real run on the finished Bobby sample (Sonnet 5.5, about
7 seconds). It returned one suggestion, a loose end, which read: *Is "Did
Bobby get the milk?" answered now? He has milk and is home again.* It
pointed at the loose end, the fact and the goal. Nothing was dropped. It left the stuck car goal
alone, as told to. It did not notice that Bobby went to the store while the
car grinds on starting.
*For:* on a stream of Phil's own, most suggestions are things he would act
on or is glad to have been asked. *Against:* the suggestions restate what
the page already shows, or they read as nagging, or Phil never presses it.
*Open, Claude's:* whether the button belongs on every view or only State;
whether a suggestion should carry its own button (record this move, mark
reached) instead of only a link; whether suggestions can be dismissed one
by one; whether Depth should be offered (it runs on the Balanced tier now).
The "reached?" kind is a partial answer to the question left open in E11:
the model may ask whether a goal was reached, and still may not say so.

**E13. A scripting language that makes the app go, and a stepper to watch
it.**
*Status: built and testing, 2026-09-30 (app 0.4.0). Phil's request; the
language and the stepper's behaviour are Claude's design.*
A **script** is plain text, one action per line, in plain words:
`verb [name or "a few words"] [word] : free text`. Lines starting with `#`
are comments. An example:

```
stream: Bobby, scripted
date: Sep 28
fact home: Bobby is at home.
goal milk: Get milk.
release home: He left for the store.
move milk closer: Bobby is at the store. They have milk.
reach milk: Bobby has milk.
help
```

- *Everything a script does is something the person could press.* Each line
  becomes an ordinary action step, a model call (`text` ideaifies, `help`
  presses Help analysis), or a change of what is in view (`show`, `focus`,
  `rewind`, `latest`). A script has no powers the buttons lack, so a
  scripted stream rewinds, branches and reloads like any other. Steps a
  script makes carry the source `script`.
- *The words:* `stream`, `date`, `note`; `fact`, `release`; `goal`, `move`,
  `reach`, `stuck`, `drop`, `reopen`, `accept`, `reject`; `text`, `help`;
  `keep`, `discard`, `anchor`, `resolve`; `focus`, `show`, `rewind`,
  `latest`, `branch`. The Script view lists each with what it does.
- *Pointing at things:* a line that makes a fact or a goal can give it a
  name (`goal milk: …`), and later lines use the name. Anything else,
  including what the model read in a text, is pointed at by a few of its
  words in quotes (`accept "milk"`). The words must match exactly one thing
  the line could act on. None or several stops the run at that line and
  says so in plain words.
- *`date:`* dates the steps that follow, so a scripted story can span days.
  This is the first place a step's date is something other than the day it
  was recorded, which bears on E6.
- *The stepper* is a dock under the page that stays in view on every tab.
  **Step** runs one line. **Play** runs them in turn at a chosen pace and
  can be paused. Each action opens the view where it lands and marks the
  fact or goal it touched; model calls wait for the answer. A line that
  can't run stops the run there, with the reason, and Step tries it again.
  A script that can't be read lists its lines and does not run at all.
*How it is built:* `src/shared/script.js` (the parser and the planner, pure
and shared), `src/client/85-script.js` (the runner, the Script view, the
dock). The server gained only an optional `date` on `/ingest` and
`/analyze`. No database change. The last script worked on is kept in the
browser, not on the server.
*Test so far:* two built-in scripts, both run end to end in a headless
browser against the live database on 2026-09-30. *Bobby and the milk, by
hand* (21 lines, no model calls) left 13 steps dated Sep 28 to Oct 1 and
the same Now, Past and Goals as the Bobby sample. *Bobby and the milk, read
by the model* (11 lines, 3 model calls, about 16 seconds) had the model
read the goal from the sentence, `accept "milk"` found it, and the last
`help` returned three suggestions.
*For:* Phil can write or dictate a short script of his own and watch it
run; scripts become the way scenarios are tried, shown and re-run.
*Against:* the words are harder to write than the buttons are to press, or
pointing at things by a few words fails too often on real streams.
*Open, Claude's:* whether scripts should be saved on the server and shared;
whether a stream should be able to write itself out as a script (every
action step already has a line that would make it); whether a script line
should be able to check something ("expect milk reached") so a script is
also a test; whether the model should be able to write scripts.

**E13, note 2026-09-30.** Phil: "I think all of your proposals are a yes."
The four open items above are agreed: scripts saved on the server and
shared; a stream writes itself out as a script; a line can check something;
the model may write scripts. *Status of each: agreed, not built.* Phil
asked to think aloud first, so the build waits on that.

**E14. The maps of one world, and Bobby's world as an investigator would
assemble it.**
*Status: built and testing, 2026-09-30 (app 0.5.0). Phil's request: a map
each for "his environment, mental state, and assumptions (moral
presuppositions)," each with a diagram "that we can select on and improve,"
drawn "with the diagramming capability we've already made a stab at," and
one made up for Bobby. The method and the made-up content are Claude's.*

*The method, stepping back.* An investigator does not start from a theory
of Bobby. He starts from what there is to go on and keeps it apart from
everything he adds:
1. *Evidence first.* Two things were said: "He needs milk" and "Bobby went
   to the store to get milk." Those are **given**. Nothing else is.
2. *Everything else is a supposition, and says so.* A supposed item is
   drawn dashed. It can be **confirmed** (it turns solid, with the date) or
   **ruled out** (it is kept, struck through). This is stuck and plastic
   again: the words put forth are fixed; whether they hold is open.
3. *Every supposition carries the question that would check it.* "A store
   that sells milk is within reach" carries "Which store? How far?" These
   are the open questions already drawn as hollow dots.
4. *The situation is worked from near to far:* home, what it lacks, who
   else is there, the store, the way, the money, the hour.
5. *The mental state is worked as want, what is taken for granted, and
   intention.* What is taken for granted is Phil's "mental furniture": "He
   takes it for granted that the store will have milk."
6. *The assumptions are found by asking "why does that matter?"* and asking
   it again of the answer, from the act up to what he takes to be right.
7. *An ambiguous word is read every way it can be before one is chosen.*
   "Needs" is read once on each map: a lack in the house, a want in him, an
   ought he holds. The map of what was said shows "He needs milk" in the
   middle with those three readings around it. That is the question Phil
   set aside (which of the three it belongs to), laid out to be looked at,
   not answered.
Borrowed from, as far as Claude recalls and not checked against sources:
Kurt Lewin's life space (behaviour as a function of the person and the
environment), Henry Murray's pairing of a need in the person with a press
from the environment, the belief, desire and intention account of action,
the cognitive-therapy case formulation with its layer of rules and
assumptions, and laddering from personal construct psychology.

*What was built.*
- Four maps of one world: **What was said**, **Environment**, **Mental
  state**, **Assumptions**. A selector above the diagram picks one and
  shows how many items each holds.
- One diagram draws them all. "What was said" shows one link out from the
  item in the middle, as before. A world map shows two links out within
  that map, so a small map is seen whole, plus the middle item's own links
  into the other maps, marked with the map they sit on. Each world item has
  a bar in its map's colour. Selecting any item makes it the middle;
  following a link into another map changes the map in view.
- *Select on and improve:* the panel can confirm or rule out a supposition
  and add a new item to the map in view, given or supposed, joined to the
  item in the middle.
- Five new action types in the one reducer (`item`, `link`, `ask`,
  `confirm`, `ruleout`), so the maps rewind, branch and replay. No database
  change. Script words for each: `said`, `environment`, `mental`,
  `assumption`, `link`, `ask`, `confirm`, `ruleout`, and `show environment`
  and its like.
- *Bobby's world* is a built-in script of 67 lines, and a built-in sample
  that is the same script run in the page, so the two cannot drift: 2
  things said, 7 environment items, 7 mental-state items, 5 assumptions, 29
  links, 13 open questions. Run in the stepper, it shows the world being
  assembled in the order above.
*Test so far:* the script ran end to end in a headless browser against the
live database (67 lines, about 26 seconds at the fast pace); then an item
was added from the panel and a supposition confirmed.
*Two things the made-up world shows, for Phil to judge.* There is no map of
motivation in it. What moves Bobby appears as the links that cross between
maps ("gives rise to," "makes it worth doing," "presses"), which is close
to `Three-Layers.md`, where motivation is read off the distance between
layers. And the sentence says "get" where Phil last said "buy"; the world
carries that as an open question on the act and on "You pay for what you
take from a store," not as a choice.
*For:* Phil can look at each diagram and say it shows something true about
how such a world is put together, and adding a complication is easy enough
that he does it. *Against:* the three maps blur (items could sit on any of
them), or the diagrams are no clearer than a list.
*Open, Claude's:* whether motivation gets a map; whether the State view
(Now, goals, moves) is part of the mental state or a fifth thing; whether
the model should be allowed to propose world items from text, as supposed;
whether each map wants a diagram of its own shape (rings for nearness, a
ladder for assumptions) instead of one shape for all; and whose world a
stream is, which the two pictures of the future (other people's maps, and
thousands of people coordinating) will need answered.

**E15. Accounts: sign-up, an admin panel, three levels, and a shared
stream.**
*Status: built and testing, 2026-09-30 (app 0.6.0). Phil's requests are
quoted under "The goal." The points marked Claude's are choices Phil has
not yet seen.*
- *Phil's:* a person can sign up themselves; an admin can add them from a
  panel; email is the unique key; each person has an area of their own;
  three levels, **guest**, **user**, **admin**; what a user does is stored
  and what a guest does is not; a guest cannot use the AI, and the AI
  buttons give an info box saying he has to become a registered user;
  philipalarson@gmail.com is an admin; everyone shares Bobby's story.
- *How it is built:* `sql/002-users.sql` adds a password hash, a level, a
  disabled date and who added the person, and a `shared` mark on streams.
  `src/server/auth.js` holds sign-in, sign-up and the levels. A password is
  stored only as a salted scrypt hash. The **Admin** tab, shown only to admins, is the panel:
  list, add, set a level, set a new password, disable or enable.
- *Guests, Claude's reading of "guest":* there are two kinds, and both get
  the same treatment. Someone with no account can press **Look around as a
  guest** on the sign-in card. An account can also be at the guest level.
  Either way the work lives in the browser tab and is never sent to the
  server; the server refuses every storing route to a guest account as
  well, so the rule does not depend on the page. A guest can still do
  everything that needs no AI, including running a script. If a guest
  becomes a user, the stream in hand is saved for them.
- *Sharing Bobby's story, Claude's reading:* the three built-in samples,
  two of them Bobby's, are in the page for everyone, guests included. An
  admin can also mark one of their own streams **shared with everyone**. A
  shared stream is listed for all, read-only; acting on it starts a copy in
  the person's own area. Others cannot add to the shared original. That is
  the cautious reading, chosen because sign-up is open to anyone.
- *Note, 2026-09-30 later:* at Phil's word, "Remove Phil's streams from the
  users, and from the guest's accounts," the sample of his archived chats
  is no longer in the page. Two samples are built in for everyone, both
  Bobby's. The owner alone gets his own sample, from the server.
- *Claude's additions:* signing up makes a user unless `SIGNUP_LEVEL=guest`;
  sign-up can be closed (`SIGNUP=closed`) or asked for an invite code
  (`SIGNUP_CODE`); everyone but an admin has a daily number of AI calls
  (`DAILY_CALL_LIMIT`, 40 unless set), because every call is paid for with
  the server's key; a disabled account stops working at once and its
  streams are kept; nothing in the panel deletes a person.
*Test so far:* the Postgres tests cover sign-up, signing in, the walls
between personal areas, sharing, the panel, the daily limit, and that no
stream, step or call is recorded for a guest. A headless browser run on a
throwaway schema signed a person up, added a guest from the panel, shared a
stream, showed the guest the info box, promoted the guest and disabled the
first person.
*For:* people Phil invites can get in, work without stepping on each other,
and see Bobby's story. *Against:* strangers sign up and spend the AI
budget, or the guest level confuses more than it helps.
*Open, Claude's:* whether others should be able to add to a shared stream,
which the coordination Phil pictures will need; whether a guest account is
wanted at all beside looking around with no account; that the app sends no
email, so a forgotten password needs an admin; that changing a password
does not sign out sessions already open.

**E15, note 2026-09-30, late night (app 0.9.0).** Two additions, both at
Phil's request. *Change password:* anyone signed in can change their own,
by giving the current one. This answers part of what was left open above:
a person no longer needs an admin to change a password they know. Still
open: a forgotten password needs an admin, and a change does not end
sessions already open. For the owner, the server's own password goes on
working after a change, as the way back in. *Who may sign up:* an admin
chooses on the Admin tab between anyone, anyone with an invite code, and
nobody. The choice is kept in the database and wins over the setting in
the server's files. *For:* Phil gives a code to a friend or two and
strangers cannot make accounts. *Against:* the code is passed around, or
it is forgotten that sign-up was left open.

**E16. A check before every call to the AI.**
*Status: built and testing, 2026-09-30 (app 0.6.0). Phil's request: "for
every call out to the AI API, whatever the user provides in that context
call has to be sanity checked for malicious, or stupid inputs." The checks
are Claude's.*
Before Ideaify and before Help analysis, `src/server/screen.js` looks at
everything a person supplied that is about to go into the prompt: the text
being sent, its label, and the facts, goals, moves and map items already in
the stream.
- *Stupid:* empty; longer than one pass takes; not text (binary, control
  characters); no words in it; mostly symbols or numbers; a run of several
  hundred characters with no space; one character or the same few words
  repeated. Refused for everyone, admins included.
- *Malicious:* phrases that give orders to an AI instead of saying
  something ("ignore your previous instructions," "reveal your system
  prompt," markup posing as the AI's own channel). Kept narrow: talking
  about instructions or prompts passes. An admin's text skips this check,
  since Phil's own transcripts quote such phrases and it is his key.
- A refusal says what was found, the AI is not called, and the refusal is
  logged as a call with the status `screened`, so it counts toward the
  daily limit.
- *Beside the check:* both prompts now say that the text is material to
  read and none of it is addressed to the model; every line a person wrote
  is set in the prompt as one bounded line, so it cannot start a section of
  its own; one step cannot be enormous. The answer was already held to a
  JSON schema and rebuilt from the person's own spans by `normalize.js`.
*For:* junk and plain attempts never reach the model, and an honest user
is rarely refused. *Against:* honest text is refused often enough to
annoy, which the narrow patterns are meant to prevent.
*What it cannot do, said plainly:* a list of phrases cannot catch every
attempt to steer a model. This is the first gate, not the only one. A
second, model-based check on each call is possible and was not built; it
would double the calls.

**E17. Evidence: the stream reports how the machine's claims fared.**
*Status: proposed, not built, 2026-09-30. Claude's proposal, from the
review in `ARCHITECTURE.md` and two questions Phil asked after reading it:
"What would evidence look like?" and "Can the app benefit by your analysis
of the need for evidence now?"*
The review's main opinion was that the experiments from E11 on are at
*testing* and none has had its test. Much of the evidence is already in
the stream, uncounted: every time the person keeps or discards a reading,
accepts or rejects a goal, settles a loose end, or confirms or rules out a
supposition, that verdict is a step.
- *An Evidence report.* A pure function over the steps, shared like
  `replay.js`, so it rewinds with everything else and needs no model call
  and no database change. For one stream, and split by model: readings
  kept, discarded and left undecided; goals read in the text accepted and
  rejected; loose ends by outcome; suppositions confirmed, ruled out and
  still open; ideas said again; and items dropped for citing nothing,
  which each ingest step already records.
- *A verdict on each Help analysis suggestion:* new to me, already knew,
  or wrong (the marks E3 proposes). One new action type. Today a
  suggestion can only be read, so E12 has no way to collect its own test.
- *Script lines that check* (agreed under E13) carry the archive test of
  §7 as a script, so it can be run again after any change to a prompt.
*Test:* run the report on the first real stream of Phil's own, and on the
archive test. *For:* a number changes a decision: a Depth setting, a
prompt, or an experiment's status moving to *adopted* or *dropped*.
*Against:* the counts are too small to mean anything, nobody looks at
them, or the rates become a score to chase (§6).
*What it is not:* a judgment of the person. It counts the machine's
claims and what became of them.

**E17, note 2026-09-30.** Phil: "I do want you to add those peices when you
get a chance." All three parts are agreed. *Status: agreed, not built.* The
build waits until the work in progress in the same working tree is
committed, since it touches `src/shared/replay.js` and the State view.

**E17, second note 2026-09-30, built.** *Status: built and testing (app
0.9.0).* All three parts are in.
- *The Evidence report* is a new **Evidence** tab. `src/shared/evidence.js`
  counts from the steps alone, and the view rewinds with the Step slider.
  It also counts loose ends put off, moves read in text, and ideas said
  again and replaced.
- *A verdict on each suggestion:* three buttons under each one, New to me,
  Already knew, Wrong. The word is an action step of type `verdict`. It
  does not make the analysis count as stale. The latest word stands.
- *Script lines that check:* `expect goal milk reached`, with `no` for
  "nothing matches." Claude's choice, to be judged in use: a check that
  does not hold never stops the run. The stepper marks it and counts how
  many held, so a run gives a score and not only a first failure.
- *One addition, Claude's:* the Darlene sample now ends with a made-up
  Help analysis, so a guest can try the three buttons and Evidence has
  something to show. It is labelled as made up, in its model chip.
*Test so far:* unit tests for the counting, the verdict and the checks;
in a headless browser, Evidence on the Darlene sample, a guest's word on a
suggestion, and a script of three checks of which two held. *Still to do,
and it is the real test:* run the report on a stream of Phil's own, and
write the archive test of §7 as a script of `expect` lines.

**E18. Spendable resources: what a person has, what a goal takes, and what
a move costs.**
*Status: proposed, not built, 2026-09-30. Phil's statement is quoted under
"The goal": "Bobby has access to spendable resources, money, time and
physical strength." The design below is Claude's.*
- *Three kinds, because the three behave differently.* Money is a
  **store**: it stays until it is spent, and it can pass to someone else.
  Time is a **window**: it runs out whether it is spent or not ("the store
  closes at nine"). Strength is a **capacity**: it is used up and comes
  back with rest. One number with one rule would get two of the three
  wrong.
- *Three places it shows.* A **holding**: what the person has, kept in
  State beside Now, given or supposed like any world item, with the
  question that would check it. A **need** on a goal: what reaching it
  takes. A **cost** on a move: what it spent or brought in. The level of a
  holding on any day is replayed from the moves, so it rewinds and
  branches with the rest.
- *Words before numbers.* The app invents no distance to a goal (E11) and
  should invent no amounts. A level can be said in words (plenty, enough,
  tight, none, not known); an amount is optional. A need or a cost the
  person did not state is a supposition, drawn dashed.
- *What it joins up.* The battery of E8 is the same shape, a store drawn
  from and added to, so one ledger could carry money, strength and
  motivation. *Ground is stuck* could name what is short. Help analysis is
  told to prefer "the small, cheap step" and has no notion of cost; with
  costs it would. And in the Bobby sample the car goal waits on "the first
  opening is next month," which is the mechanic's time, not Bobby's:
  resources belong to people, and what one person has and another needs
  is where worlds touch. The coordination Phil pictures will turn on that.
*How it would be built:* three action types in the one reducer (a holding
put forth or revised, a need on a goal, a cost on a move) and script words
to match. No database change. No model call at first; later the model may
propose needs and costs it reads in text, as supposed.
*Test:* by script, on Bobby, made up for review: he has twenty dollars
(given), an hour before the store closes (supposed), and he is on foot
because the car grinds (supposed). *For:* the milk errand and the stuck
car goal read more truly with what they take in view, and Phil adds a
complication through a resource (the money is short, the store closes)
more easily than through a fact. *Against:* nobody enters what a move
cost; the amounts give a false precision; or State turns into a budget
and the goal is lost in it.
*Cautions, Claude's:* money is private in a way most of a map is not,
which bears on sharing; and a level that rises and falls invites being
treated as a score (§6).
*Needs from Phil before building:* whether motivation is one of these
resources or a different kind of thing; words, amounts, or both; and
whether resources get a place of their own on screen or live inside State
and the Environment map.

**E18, note 2026-09-30, refreshing.** Phil: "And he gets those refreshed,
in a paycheck, sleep, and food." E18 had holdings, needs and costs, and
said only in passing that a move can bring something in. This adds a
fourth thing, a **source**: what refills a holding. Claude's reading of
what follows, none of it Phil's words:
- *A source is not a move toward a goal.* It is part of the upkeep of a
  life, and most sources come round again: a paycheck by the fortnight or
  the month, sleep by the night, food several times a day. So a source
  has a rhythm as well as an amount, which is one answer to "Time has to
  be considered. How?"
- *Resources turn into one another.* Work spends time and strength and
  brings the paycheck. Money buys food. Food and sleep restore strength,
  and sleep spends time. It is a cycle, and Bobby's errand is inside it:
  milk is food. Getting milk spends money, time and strength to keep the
  cycle going, which may be part of why it matters.
- *Nothing is refilled by the clock.* By the rule that the app shows only
  what was reported, a refresh is a step when it happens ("the paycheck
  came"), not something the app adds on its own each Friday.
- *The expected refresh is mental furniture.* "He takes it for granted
  that the paycheck will come" is the same kind of item as "the car starts
  every morning": trust laid down by repetition. So an expected refresh
  belongs on the Mental state map as something taken for granted, and the
  day it does not come is a surprise of the kind §4.1 calls a missed bet.
*Added to the test:* give Bobby a payday, a night's sleep and a meal in
the script, and one refresh that fails to come. *For:* the missed refresh
shows up as the thing that changes what he can do, without anyone working
it out by hand. *Added to what is needed from Phil:* whether the two lists
pair in the order given (time with sleep), or sleep and food both restore
strength.

**E18, second note 2026-09-30, motivation.** Phil: "Yes, motivation energy,
or desire for the end result is also a resource which can be recharged,
and spent." So there are four resources, not three, and the ledger of E8
is the ledger of E18. What is Phil's: motivation is a resource; it is
recharged and it is spent. What follows is Claude's reading:
- *"Desire for the end result" ties it to a goal.* Money, time and
  strength belong to the person and can be spent on any goal. Desire for
  an end result is desire for *that* result. So motivation may be held per
  goal, where the other three are held per person. That would answer the
  question left open under E8, one battery per person or one per concept,
  with "one per goal," but Phil has not said so.
- *What a goal's states would then mean.* A goal dropped is one whose
  desire ran out. A goal where the ground is stuck and the desire is still
  high is the painful case, which `Three-Layers.md` describes as
  resistance against the vector being travelled. The app could tell the
  two apart, where today both are a status the person picks.
- *What recharges it is not yet said.* One candidate is already in
  `Story-and-Game.md`, in Phil's framing: achieving a minor step is
  exciting "because it makes the goal feel more possible." If so, a move
  that brings the goal closer recharges the desire for it, and moves that
  change nothing draw it down. Another is the source of the desire
  itself: in Bobby's world, the links "gives rise to" and "makes it worth
  doing" that run from his situation and his assumptions into what he
  wants.
- *It converts like the others.* Motivation is what gets time, strength
  and money spent on one goal instead of another. Spending it is choosing.
- *The caution in §6 applies most here.* A motivation level must not
  reward intensity of feeling. Like the other three it should be the
  person's own report, in words first, never something the app computes.
*Added to what is needed from Phil:* what recharges motivation, and
whether it is held per goal or per person.

**E8, note 2026-09-30.** E8 proposed the motivation battery as a ledger of
dated deposits and draws, and asked what adds, what draws, and whose it
is. Phil's statement the same evening makes motivation one of the
spendable resources of E18. E8 is folded into E18: same ledger, same
rules, and its two guesses (fruit charges it; "maintenance on no feeling"
draws it) stand as guesses to be tested there. The question of *gap or
battery* further down is partly answered: it is a store. Whether the gap
between foundation and environment is what charges the store is still
open.

**E18, third note 2026-09-30, "separate them."** Phil: "No seperate them
because sometimes a social goal is to eat together and I want that
accounted for." This corrects something in the two notes above. Which
thing is not certain; the readings below are Claude's, in order of
likelihood, and the question has been put to Phil.
1. *Keep motivation apart from money, time and strength.* The note on E8
   folded the battery into one ledger with the other three. But a meal
   does two different jobs. As food it refills strength. Eaten together it
   is a social goal, a desire for an end result. On one ledger the meal
   would be only a refill and the second job would vanish. On this reading
   there are two kinds: *means* (money, time, strength: held by the
   person, refilled by a paycheck, sleep and food) and *motivation*
   (desire for an end result: bound to goals). The fold in the E8 note is
   withdrawn until Phil says.
2. *Keep the refill apart from the goal.* The first note said "a source is
   not a move toward a goal." Eating together shows that is wrong as
   written: one event can be a source and a goal at once. On this reading
   the two must be recorded separately on the same event so neither
   swallows the other.
3. *Keep the resources apart from one another,* each with its own record,
   instead of one ledger for all.
What holds on every reading, and so changes the design now:
- *One event, several effects.* A meal together spends money and time,
  refills strength, and reaches or moves a social goal. Today one action
  step does one thing. E18 needs an event that can carry what it spent,
  what it refilled, and which goals it moved, each shown on its own.
- *A social goal has other people in it.* Bobby's made-up world already
  has "Someone else lives there and uses milk" and "He has someone in mind
  who is waiting for it." The milk may be for a meal together. A goal
  would need to say with whom, which is the first place the maps of other
  people (Phil's picture of the future) are needed by something being
  designed now.
*Added to the test:* in the Bobby script, a supper eaten with the person
at home. *For:* the State view shows it both as strength restored and as
a social goal reached, and neither is lost.

**E18, fourth note 2026-09-30, reflection.** Phil: "Reflection on the
right ideas refreshes motivation and desire." So each resource now has its
source in Phil's words: money a paycheck, strength (and perhaps time)
sleep and food, motivation reflection on the right ideas. The rest is
Claude's reading:
- *The idea map is the source.* What a paycheck is to money, time spent
  with one's own ideas is to motivation. That makes the first thing the
  app did (keep a person's ideas, verbatim, and ask one question) the
  place where the fourth resource is refilled, and the State view the
  place where it is spent. The two halves were built separately and had
  no stated connection until this sentence.
- *It supports the first reading of "separate them."* Motivation's source
  is of a different kind from a paycheck or a meal, which fits keeping
  motivation apart from the three means. Still to be confirmed by Phil.
- *"The right ideas" is the person's to say.* The app already has a way:
  an anchor is an idea the person pinned as one everything should trace
  back to. For Phil those are the two commandments and the triad. The app
  must not pick the right ideas itself, and must not count intensity (§6);
  an AI choosing which ideas motivate is the flattering mirror.
- *A reflection can be a step.* Opening an idea, answering its open
  question, or drafting from it is already something the app sees. With
  the person's own word on whether it refreshed them, it becomes a refill
  recorded like any other, and it rewinds.
- *It can be tested with E17.* The claim is checkable from the stream: do
  moves toward a goal follow reflection on the ideas that goal traces back
  to, more than they follow nothing? *For:* they do, on Phil's own stream
  over some weeks. *Against:* reflection and moves show no relation, or
  only the person's say-so connects them.
*Added to what is needed from Phil:* which ideas are "the right ideas"
(the anchors, the ideas a goal traces back to, or something else), and
whether "motivation" and "desire" are one thing or two.

**E18, fifth note 2026-09-30, settled: two kinds.** Phil: "Yes, keep
motivation apart from money, time and strength." Reading 1 of the third
note is confirmed and readings 2 and 3 are set aside as readings of that
sentence. The fold of E8 into E18 is withdrawn for good. As it now stands,
in Phil's words where they exist:
- **Means:** money, time and physical strength. "Spendable resources."
  Refreshed "in a paycheck, sleep, and food."
- **Motivation:** "motivation energy, or desire for the end result."
  "Recharged, and spent." Refreshed by "reflection on the right ideas."
  Kept apart from the means.
E18 is the experiment for the means. E8 is again the experiment for
motivation, with its ledger of its own, and now has two of the three
answers it was waiting for: it is a store, and reflection on the right
ideas is what adds to it. Still open there: what draws from it, and
whether it is held per goal or per person.
Two things from the third note stand whichever kind is in question, and
are Claude's: one event can carry several effects (a supper together
spends means, refills strength, and reaches a social goal), each shown on
its own; and a social goal has other people in it.

**E8, second note 2026-09-30, per goal.** Phil: "Motivation is held per
goal." Settled. Each goal carries its own motivation: its own level, its
own refills and draws. The means of E18 stay with the person and can be
spent on any goal. What E8 now has, in Phil's words: it is a store,
"drawn from and added to"; it is "desire for the end result"; it is
"recharged, and spent"; "reflection on the right ideas" refreshes it; it
is kept apart from money, time and strength; it is held per goal. Still
open: what draws it down; which ideas are "the right ideas"; whether
"motivation" and "desire" are one thing or two. *Status: proposed, not
built.* Phil, the same message: "we aren't building yet."

**E19. What was done about the two reviews.**
*Status: built and testing, 2026-09-30 (app 0.8.0). The reviews are
`GROK-REVIEW.md` and `ARCHITECTURE.md`. The fixes are Claude's. The full
list, finding by finding, is `HANDOFF.md` §16.*
The reviews agreed on what mattered most, and those are fixed:
- *The reducer decides.* The state's maps have no prototype and every id is
  checked, so a hostile id does nothing. What an action may act on (only a
  reading can be kept or discarded; only fixed words can be an anchor) is
  now decided in the reducer, for the page, a script and the server alike.
  The server stores only actions the reducer knows.
- *The page and the server are one stream.* A failed save stays on screen
  and nothing new is taken until it is saved; a change the server refuses
  is undone.
- *Stop stops.* The model call is cancelled on the server and nothing is
  stored.
- *Nothing is invented.* A move the model read in the text has no effect
  until a person reports one, and stays marked as read in the text.
- *One phrase cannot lock a stream.* A line already in a stream that reads
  as an order to an AI is left out of what the model is shown, and the
  person is told which. This revises E16, which refused the call instead.
- *One list of link words* (`WORLD_LINKS`), shared by the panel, the
  method document and a test.
- *Spend is bounded.* A ceiling on AI calls a day for everyone who is not
  an admin, and throttles on sign-in and sign-up.
*Left for Phil, because both reviews say it is his call:* sign-up is still
open, as he asked; the reviews advise closing it until he decides. On the
public site the limits are set tight instead.
*Not done, and why:* storing the map in tables so that worlds can be
queried across streams, real dates beside the date labels (E6), an author
on every step, sessions that end when a password changes, and running the
site from a release folder instead of the working copy. Each is structure
for the later vision, and the architecture review's own advice is to prove
one world on real material first.
*For:* the fixes hold up when Phil and one more person use the public site.
*Against:* a fix has made honest use harder, most likely the save queue
refusing new changes on a bad connection.

**E20. The relationship labels as something the engine reads.**
*Status: proposed, not built, 2026-10-02. Prompted by Phil: "I believe this
relationship doc will be the core of the magic of the yet to be built
engine. So lets keep our mind wide open on its uses and capabilites." The
review of what exists is `RELATIONSHIP-LABELS.md`; the uses are its §10.
All of it is Claude's.*
What the review found: a link is `{a, b, f, read}`, there are 39 labels in
two lists, and nothing that reasons ever reads a label back. Neither AI
call is shown a link. Only the traceback to an anchor looks at what a
label says.
What is proposed, kept wide on purpose: thirteen uses, A to M in that
section, none chosen. Among them: a record for each label that the engine
reads; walking the same map by different labels for different questions
(what this sets in motion, what has to hold, why it matters, what stands
against it); a question raised by every link; a link that can itself be
supposed, confirmed or ruled out; and a relationship for what sets off an
old pattern, from Phil's statement of the same day on trauma.
Three things nearly all of them need first: a link that can be pointed
at, a way to change or withdraw a link as a step, and the labels'
meanings kept in one place.
*For:* one of the uses, tried by hand on Bobby's or Darlene's world,
tells Phil something about the world that the diagram alone did not.
*Against:* the walks give nothing a person would not see at a glance on a
map this size, or the labels have to be made so strict that they stop
being words the person would say.

**E21. The Start tab: one small gap crossed in the first minute.**
*Status: built and testing, 2026-10-02 (app 0.13.0). Phil asked for "a new
top level tab that is our inviting UI". The brief and its thesis are two
Drive documents from a browser session ("Instructions for Terminal Claude —
First Crack at the Inviting UI" and "The Gap, the Bridge, and the Joy of
Crossing"). The build, the picture and all the words are Claude's.*
*What was built.* A person picks one of three small goods, each a thought
that is done in the reading of it. A plank is laid on a bridge and the page
says what just happened. The next offer is one step bigger, for someone
else or for the person, as they choose. From the second on, the good is
done away from the page, and the person says how it went: done, kept for
later, or something smaller. Five planks is a bridge.
*How the next one is sized.* A reach from 1 to 5, read from what the person
does (`src/shared/gaps.js`). Done raises it by one. Kept for later holds
it. Something smaller lowers it by one. It is never shown and never kept.
*What it deliberately is not.* It has no points, marks or streaks; a test
fails if any such word appears in what the page says. It makes no step,
calls no server and no AI, and is not joined to the maps.
*What is thin.* The thirty goods are written by hand and are the same for
everyone. The page takes the person's word that a thing was done. The
reach has two inputs. Nothing carries to another visit.
*For:* a person who has never seen the app opens it, crosses the first gap
inside a minute without being told how, and chooses to take a second.
*Against:* people stop at the first one; or the goods read as chores or as
advice; or "I did it" is pressed without doing, which would mean the page
rewards pressing and not crossing.
*Open, and Phil's to say:* whether Start should be where everyone lands,
whether what a person does there should become part of their own world
(a goal and its moves, in the State view's terms), and whether the goods
should come from the person's own map instead of a list.

**Open, and it changes E1 and E2:** whether the nesting is exactly three
levels (idea, containing concept, perspective) or a concept can sit within
another concept. Asked 2026-09-30, not yet answered.

**Open, from reading the morning and evening of 2026-09-30 together:**
- *Gap or battery.* `Three-Layers.md` reads motivation off the distance
  between foundation and environment, a quantity at an instant. Phil's
  morning statement makes motivation a battery, a store drawn from and
  added to over time. A distance and a store are different quantities. They
  could be force and stored energy, but that is Claude's guess. E8 waits on
  this.
- *Where containers and perspective sit.* Nothing in the three-layer docs
  maps the containing concept or the perspective onto the layers. Two
  candidates, both Claude's: a perspective is the person's position between
  floor and environment; a containing concept is the foundation object an
  idea lands on. Neither is Phil's.

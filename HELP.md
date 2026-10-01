# Network Meaning: Help

This page is the help for the app. It is also the Help tab inside the app,
built from this same file, so the two always say the same thing.

## What this is

Network Meaning is a place to model a world: one person's situation, what
is in their mind, and what they take to be right. You put in what was said
and what you suppose, and the app keeps the two apart. It draws the result
as maps you can select on and improve, and it keeps every change as a step
you can rewind.

Three promises run through all of it:

- **Your words stay your words.** What you say is kept exactly as you said
  it. Nothing the AI adds can overwrite it.
- **A guess is marked as a guess.** The AI's readings and your own
  suppositions are drawn dashed until someone confirms them.
- **Nothing is lost.** Every change is a step in a stream. You can go back
  to any earlier step, and branch from it.

## Getting in

The sign-in card offers three ways in.

- **Look around as a guest.** No account. You can open the samples and try
  everything that does not use the AI. Nothing a guest does is saved; it
  lives in the browser tab and is gone when you close it.
- **Create an account.** Your email and a password of 8 or more characters.
  You become a registered user, with an area of your own.
- **Sign in**, if you already have an account or someone added you.

There are three levels of person:

- **Guest.** Can look and try. Nothing is stored. The AI buttons explain
  that they are for registered users.
- **User.** What you do is stored in your own area. Nobody else sees your
  streams. You can use the AI, up to a daily number of calls.
- **Admin.** A user who can also add people, set their level, give someone
  a new password, disable an account, and share a stream with everyone.

If you made something as a guest and then create an account or sign in as a
user, the stream you were working on is saved for you.

To change your password, press **Change password** beside **Sign out** at
the top right. You give your current password and the new one.

The app does not send email. If you forget your password, an admin sets a
new one and tells you.

## Streams

A **stream** is one world and its whole history. The **Stream** menu at the
top lists the built-in samples, your own streams, and any stream an admin
has shared with everyone. Each line says how many steps the stream has and
how many items are on its Environment, Mental state and Assumptions maps,
so you can see what it holds before you choose it.

- A **sample** or a **shared** stream is read-only. The first thing you do
  to it starts a copy of your own, and the original is untouched.
- The **Step** slider beside the menu takes you back to any earlier step.
  Later steps are kept. **Branch from here** starts a new stream from the
  step you are looking at.
- **New empty stream** starts from nothing.

Two samples come with the app, both made up as examples. *Darlene and the
appointment* walks a goal from start to finish, with her environment, her
mental state and her assumptions drawn beside it. *Bobby's world* is the
four maps of one small world, built from two sentences.

## The Map: four maps of one world

Above the diagram, pick which map to look at.

- **What was said.** The evidence: the words themselves.
- **Environment.** The situation: places, people, things, means.
- **Mental state.** What the person wants, takes for granted, and means to
  do.
- **Assumptions.** What the person takes to be right; their moral
  presuppositions.

How to read the diagram:

- A **solid** box is given: something said, or confirmed.
- A **dashed** box is supposed. It stays dashed until it is confirmed or
  ruled out. A ruled-out item is kept, struck through.
- A dashed box labelled **my reading** is the AI's interpretation. You can
  keep it or discard it.
- A small **hollow dot** under a box is an open question about it.
- The **coloured bar** on a box says which map it belongs to. A box from
  another map appears where the item in the middle links to it.
- **+n** beside a box means it has more links than this view shows.

Select any box to put it in the middle. The panel on the right shows its
exact words, its open questions and what it connects to. Following a link
into another map changes the map in view.

To improve a map, select an item and use the panel: **Confirm it**, **Rule
it out**, or **Add** a new item joined to the one in the middle.

## State: where things stand

- **Now** holds what is true at this step. A fact can stop being true; it
  moves to **Past** and keeps both dates.
- **Goals** are put forth by you, or read in your text by the AI and
  offered for you to confirm. Each **move** toward a goal says whether it
  brought the goal closer, changed nothing, or set it back. A move the AI
  read in your text says none of those: it is shown as read in your text,
  and nothing is assumed about it.
- When a goal is **reached**, a new fact lands in Now. A goal can also be
  marked **ground is stuck**, or dropped.
- **Help analysis** reads where things stand and makes a few suggestions.
  Each one points at what it rests on, and nothing changes until you act.
  Under each suggestion you can give your word on it: **New to me**,
  **Already knew**, or **Wrong**. That is how the app learns whether its
  suggestions are worth having. The sample *Darlene and the appointment*
  ends with a made-up analysis you can try this on.

Where a box shows a suggestion such as "e.g. Get milk.", pressing its
button with the box empty uses the suggestion as your entry.

## Add text

Paste, type or drop text: notes, a transcript, an exported chat.
**Ideaify** sends it to the AI, which pulls out the ideas, links them, and
notices goals and loose ends. Every idea must point at the words it came
from, and its quote is built from those words, not from anything the AI
wrote. Ideas that point at nothing are dropped and counted. After each pass
the app asks at most one question; your answer is treated like any other
text.

## Loose Ends, Timeline and Evidence

**Loose Ends** is the list of things the app noticed and will not decide
for you: a word that looks mis-transcribed, a question never answered, two
ideas that echo each other, a contradiction. Each has one or two buttons.
**Later** leaves a loose end open and moves it down the list.

**Timeline** shows the ideas that came from text, pass by pass: arriving,
settling, fading.

**Evidence** counts what became of the AI's claims in the stream you have
open. Every time you keep or discard a reading, confirm or refuse a goal
the AI read in your text, settle a loose end, or give your word on a
suggestion, that is a step, and Evidence adds them up: how many readings
you kept, how many goals you confirmed, how many items the AI proposed
that pointed at nothing and were dropped. It also splits the counts by
which model made each claim. It counts the machine, not you. Move the
**Step** slider and it shows the counts as they stood then.

## Script and the stepper

A **script** is a list of actions, one per line, in plain words. It can do
anything the buttons can do, and nothing they cannot.

```
stream: Bobby, scripted
fact home: Bobby is at home.
goal milk: Get milk.
move milk closer: Bobby is at the store.
reach milk: Bobby has milk.
```

Open a script in the **stepper** and it docks under the page. **Step** runs
one line. **Play** runs them in turn at the pace you choose. Each action
opens the view where it lands, so you can watch the world being put
together. A line that cannot run stops the stepper and says why. The Script
tab lists every word a script can use.

A line can also check something, so a script is a test as well:

```
expect goal milk reached
expect fact "Bobby has milk"
expect no goal "walk the dog"
```

A check changes nothing and does not stop the run. The stepper marks each
one as held or not, and counts how many held.

## The AI

Two things call the AI: **Ideaify** and **Help analysis** (and the script
lines `text` and `help`, which press those buttons).

- The AI is for registered users. A guest who presses an AI button is told
  so, and offered an account.
- Before every call, what you are sending and what is already in the
  stream is checked. Text that is not really text (empty, enormous, a file
  that is not plain text, one thing repeated) is refused. So is text that
  reads as orders aimed at the AI instead of something to be read. The
  message says what was found, and the AI is not called.
- A line already in your stream that reads as an order to an AI is left
  out of what the AI is shown. You are told which line. Nothing is removed
  from your stream.
- **Stop** stops the call. Nothing is added.
- Each user has a daily number of calls, and there is a daily total for
  everyone.
- Whatever the AI returns is checked again before it reaches your map.

## What is saved, and who can see it

- A user's streams are saved on the server, in that user's own area. If a
  change cannot be saved, a note at the top right says so and stays there;
  nothing new is taken until it is saved. Click the note to try again.
- A guest's work is not saved anywhere.
- Nobody sees another person's streams. The one exception is a stream an
  admin has chosen to share with everyone, which others can read and copy
  but not change.
- Your password is stored only as a scrambled value that cannot be turned
  back into the password.

## For admins: the Admin tab

The **Admin** tab is at the right-hand end of the tabs. Only an admin sees
it. It lists everyone with an account: their level, whether
they signed up or were added, how many streams they have, and how many AI
calls they made in the last day. From there you can add someone, change a
level, set a new password, and disable or enable an account. Disabling
stops someone signing in at once; their streams are kept.

Under **Who may sign up** you choose who can create an account: anyone who
can reach the page, anyone who has the invite code you choose, or nobody.
With an invite code, give the code to the people you want in; the app does
not send it for you. What you set here takes the place of the setting in
the server's own files, and **Use the server's setting** puts that back.

To share a stream with everyone, open it, go to **Add text**, and press
**Share with everyone** under *This stream*.

## Where this is going

The app today models one small world at a time, for one person at a time.
That is the first step toward something larger. In Phil's words:

> The goal of the end result app is to promote human understanding by
> allowing exploration and documentation of ideas and motivation and
> meaning for oneself and others.

> We are modelling a world, in this case its bobby's world. It consists of
> facts about his environment, his mental furniture, and his motivations.

> I imagine a future for this app, where we have maps that represent other
> people in Bobby's world. The store clerk, his wife or girl friend, his
> mechanic. And each adds to and fills out their own interior and exterior
> representations. Eventually, they use this software to coordinate their
> actions.

> I also imagine a world where this app has a centralized coordination
> routine, and thousands of people use their version of the software. I
> even imagine AI filling out lots of things that nobody wants to take the
> trouble to do. Like attributes for common objects, and actions.

Put plainly, the ultimate vision has four parts:

1. **A person's world, well drawn.** The better the maps present a
   situation, a mind and its assumptions, the more the engine underneath
   can do with them. The diagrams are the defining feature.
2. **Many worlds that meet.** Each person keeps maps of their own. The
   people in one person's environment are people with maps too.
3. **Coordination.** People who can see where their worlds touch can act
   together, with a shared routine to help thousands of them do it.
4. **The AI does the tedious part.** It fills in what nobody wants to
   write out, and what it fills in stays marked as a guess until a person
   confirms it.

What exists today is the first part, for one world at a time, plus accounts
so that each person has an area of their own. The other three are not built
yet.

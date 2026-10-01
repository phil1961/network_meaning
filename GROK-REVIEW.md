# Dual-Lens Review: network-meaning (app 0.7.0)

Read-only snapshot taken 2026-09-30 while another session was editing this tree. No source file was changed, and the tests were not run. Line numbers are from that snapshot. Re-check them before editing. Findings are hypotheses for triage. Several things already written down in `VISION.md` §9 and `HANDOFF.md` are not repeated here except where the code makes the open question sharper.

`HANDOFF.md` says nothing is failing. The items below are failing, or they will fail on the first real stream that is larger than the Bobby samples.

## Lens A — Human fault-localization

**HIGH** | `src/client/40-streams.js:15-17` and `:118-125` | A failed save is forgotten as soon as a later save works, and the failed step stays in the page. | `queueSave` clears `saveProblem` on the next success. `recordAction` appends the step locally first and does not roll it back. The server never receives the failed step, then accepts the later ones. Reload shows a different stream from the one just used: the missing step is gone and the later steps remain. The stepper is safer, because `src/client/85-script.js:114-115` waits and throws. Ordinary buttons are not. A phone on a bad connection is the case the vision is built for. | Downgrade if a failed step is removed from the local stream, or further steps are refused, until that step has been saved. A warning that survives the next click would also drop this below HIGH.

**HIGH** | `src/shared/replay.js:100` and `:135`; `src/client/65-statelayer.js:9-10`; `src/server/analyze.js:38` | A move the model read in the text is stored as `closer`, and confirming the goal erases the mark that says so. | `65-statelayer.js` says nothing is computed that the person did not report. `VISION.md` E11 says no distance is invented. The reducer assigns `effect: "closer"` to every read-in move. The beads and the "N closer" count show that. `acceptgoal` then sets `read` false on those moves, so the "(read in your text)" note disappears and they look like the person's own report. Help analysis is shown the same effect and will suggest from it. | Downgrade if read-in moves kept a distinct effect (or no effect) through acceptance, and the help prompt stopped describing them as closer.

**MEDIUM** | `src/client/60-map.js:117-124` and `:171`; `src/client/30-state.js:20-22`; `src/shared/replay.js:275-276` and `:207` | A world map whose every item has been ruled out draws as an empty map. | `pickFocusIn` returning null in that case is deliberate (`tests/replay.test.js:236`). Ruling out also sets `replaced`. The page treats "no middle" as "Nothing on this map yet" and offers to add the first item. `rebuild` then leaves that map, because a map with no middle is not allowed to stay selected. The selector still counts the ruled-out items. The test comment on `replay.js` says a ruled-out item is kept and drawn struck through. Search can still find it. The diagram does not, once it is the only item left. | Downgrade if the empty-state copy is replaced by the ruled-out items themselves whenever the selector count is greater than zero.

**MEDIUM** | `src/client/80-add.js:46-57` | A multi-pass paste that fails partway through reports success. | The catch writes the real error, then `if (ok) setStatus("Done…")` replaces it whenever any earlier pass succeeded. Stop after the first chunk does the same. The box is kept when a pasted chunk failed, so the text is still there under a Done line. | Downgrade if the Done line is skipped whenever the loop stopped on an error.

**MEDIUM** | `src/server/analyze.js:31-40` | Help analysis drops standing facts and open goals once the stream is past a small window, and it drops the oldest ones first. | `playListing` takes the last 40 goals by creation order before it separates dropped from open. A run of recent dropped or proposed goals pushes an older open goal out of the prompt. Standing facts use the same end-slice (`slice(-cap)` on insertion order). The model is then asked where things stand, and it cannot see the facts that have been true the longest. Ideaify's `stateListing` (`src/shared/replay.js:359-362`) filters to live goals first, so the two calls already disagree. | Downgrade if live facts and open goals are selected before the cap, and dropped goals are capped on their own. It stays mild while every stream is Bobby-sized.

**MEDIUM** | `src/client/70-loose.js:13`; `src/shared/replay.js:257-261` | "Later" on a gap closes the loose end. | Every flag choice writes `st.outcomes`, and open flags are those without an outcome. Help analysis uses that same test. There is no way to put a gap back. The done list still shows it, with a check mark, which reads as resolved. | Downgrade if "later" stored a different outcome that `openFlags` still treats as open, or a button put it back.

**MEDIUM** | `src/client/85-script.js:93-96`; `src/client/40-streams.js:59` | A guest's script line `branch` reports failure after the branch has succeeded. | A guest stream has `id: null`. `branchHere` builds another local stream, also with `id: null`. The stepper then sees the id unchanged and throws "Couldn't branch." The button path only toasts success. `HANDOFF.md` says a guest can run a whole script. The built-in scripts do not contain `branch`, so that smoke run would not catch this. | Downgrade if the check compares something a guest stream actually changes (name, or a generation counter), or `branchHere` reports whether it worked.

**LOW** | `src/server/auth.js:32-37` | The session cookie is marked Secure only when the request already says it is HTTPS. | The process listens on 127.0.0.1 and IIS terminates TLS in front. `makeCookie` looks at `x-forwarded-proto` or `socket.encrypted`. HttpPlatformHandler does not set that header. A browser that reached the site over HTTPS stores a cookie that is also allowed on HTTP. | Downgrade if the IIS site has no HTTP binding, or the platform config sets the forwarded proto and a login over HTTPS shows `Secure` on `nm_session`.

## Lens B — AI maintainability

**HIGH** | `HANDOFF.md:669-728` | The handoff's closing status contradicts the session it just described. | "Known failing: nothing" sits under a list of work through 0.7.0. The next-session list still starts from "walk the State view" and "one real ideaify," which earlier paragraphs say already happened, and it does not mention the bugs in this review. A future session that follows the handoff will re-do finished work and will not look for a save-queue or a movement bug. The project's own rule is that this file is how the next session starts. | Downgrade if the closing list is regenerated from the code and from this review, and "known failing" is either empty because the items above were fixed or it names them.

**HIGH** | `src/client/60-map.js:16`; `METHOD-Deriving-the-Maps.md:149-165`; `src/shared/replay.js:32` | Three different link languages. | The method, written so it can be replicated, allows a fixed set of cross-map labels (`gives rise to`, `makes it worth doing`, `presses`, and the rest) and a different set inside a map (`lacks`, `within reach of`, `rests on`, …). The panel offers `leads to`, `rests on`, `part of`, and `blocks`. `LINK_LABELS` is a fourth list, used for model links and for traceback. A script can store any words (`src/shared/script.js:245`), which is how Bobby's world was built, so the sample and the panel do not speak the same language. An agent asked to "use the method" will edit one list and leave the others. A person asked to improve a map from the panel cannot choose the method's labels. | Downgrade if one exported list feeds the method doc, the panel, the script help, and `LINK_LABELS`, with the method's cross-map labels actually present in the panel.

**MEDIUM** | `src/server/screen.js:83-90`; `src/client/60-map.js:189-202`; `src/shared/replay.js:369` | A phrase aimed at the AI, once it is a stuck idea, blocks every later model call on that stream, and the page cannot remove a stuck idea. | Actions are not screened. Ideaify and help analysis then screen the replayed titles, facts, and goals. A "what was said" item is `stuck` and has no Discard. Release clears a fact. Drop clears a goal. Nothing clears that item. The refusal names the phrase and does not name the step to branch before. Admins skip the aimed check (`screen.js:86`), which is why Phil's own transcripts work. A second person, or a branch of a stream an admin filled, does not. E16 already says the patterns are narrow. It does not say the failure is sticky. | Downgrade if the error names the item and the recovery (release, drop, or branch before that step), and a stuck item can be struck through the way a supposition can. It drops further if only the admin account ever calls the model.

**MEDIUM** | `VISION.md:210` | A present-tense "against the build" paragraph is now false, and the file's own rule says not to rewrite it. | The other-people statement still says one person signs in. E15 is accounts, levels, and shared streams. An agent that reads the statement and stops will "fix" the app back toward a single user, or will refuse to build sharing because the vision says it is absent. The rule in `VISION.md` §9 is to revise by a note. | Downgrade if that paragraph, and any sibling that says "against the build as it stands," gains a one-line note pointing at the experiment that changed it.

**MEDIUM** | `server.js:180-184` versus `:209` | The rule "only the server writes an analysis" is enforced on one route. | `POST /streams/:id/steps` rejects `action.type === "analysis"`. `POST /streams` accepts any ingest or action steps, which is also how a guest's tab is saved on sign-in (`src/client/97-app.js`). A client can store an analysis, or an ingest result that never passed `normalize.js`. Replay will believe it. Sharing is admin-only, so this poisons the author's own stream and, if they are an admin, a stream other people read. | Downgrade if `createStream` runs the same action checks as `appendStep`, and ingest steps that did not come from a branch copy are rejected or re-validated.

**LOW** | `src/server/server.js` file header `0.4.0` while `package.json` is `0.7.0` | File-version headers and the app version are easy to confuse, and several headers lag the behavior in the file. | `server.js` is the multi-user, screening entry point and still says file version 0.4.0. The IIS rule for this project is to bump a file's own version on every edit. An agent that trusts the header will treat the file as older than the signup work. This is a hypothesis about process, not a traced missed bump. | Downgrade if `git log -p` shows a version bump on each edit of that file. The app version in `package.json` and `src/client/00-build.js` is the one the page shows.

**LOW** | `src/server/normalize.js:116`; `src/client/65-statelayer.js:26` | `ideaId` is rendered and never set. | The goal card links to the map when `ideaId` points at a node. Normalize always stores `null`. The model schema has no such field. The button is dead code that looks like a feature. | Downgrade if the field is removed until a goal is actually tied to an idea, or the model is given a way to cite an existing idea id and normalize checks it.

## Synthesis

### Agree (do these)

Ordered by impact.

1. **Save queue.** On failure, keep the error, stop accepting later steps, and drop or retry the local step so a reload matches the server. Both lenses want the stream the person is looking at to be the stream that will be there tomorrow.
2. **Read-in moves.** Store them with no effect until the person says closer, same, or farther. Leave `read` set after `acceptgoal`. Stop telling help analysis that those moves were closer. This is the written rule in E11 and in the State view's own header comment.
3. **Ruled-out maps.** Keep `pickFocusIn` as tested. When it returns null and the map still has items, draw those items struck through instead of the empty-map sentence, and do not let `rebuild` switch the selector away.
4. **Partial paste.** Leave the error on the status line when a later pass fails.
5. **Help-analysis window.** Choose open goals and standing facts first, then cap. Cap dropped goals separately. Match the filter-then-slice order already used in `stateListing`.
6. **One link vocabulary.** Feed the panel from the method's lists. Keep `LINK_LABELS` for what-was-said model links, and say in the method that those are a different set.
7. **"Later" stays open.** Or call the button something that means finished.
8. **Guest `branch` in a script.** Treat a successful local branch as success.
9. **Sticky screen.** Name the offending item in the refusal and give a recovery that does not require Discard on stuck words. Do not widen what an admin skips.
10. **Stale "against the build" lines.** Add a note. Do not rewrite Phil's words.
11. **Analysis steps on create.** Use the same rejection `POST …/steps` already has.
12. **Cookie Secure.** Set it when the site is served over HTTPS, including behind HttpPlatformHandler.

### Conflict (decide these)

**Optimistic buttons versus a single stream of record.** The page applies a step before the server has it, which is why the stepper can show each line at once. The server is the source of truth after a reload. Recommended resolution: keep the local apply for speed, and make the queue refuse new steps while one is unsaved or failed. The human is the one who has to understand a stream after a refresh. The fact that would flip this: if every action waited on the server and the waits were still short enough on a phone, the local-first copy can go.

**Show the whole state of play versus a bounded prompt.** Help analysis claims to read the state of play. The cap hides the oldest standing facts, which are the ones a long stream most needs. Recommended resolution: change who gets cut (dropped goals, old map titles) before cutting standing facts and open goals. The fact that would flip this: a measured prompt cost, on a real stream, that makes an uncapped state listing the expensive part of the call.

**Ideaify sees only what was said. Help analysis sees the world maps.** `tests/replay.test.js:237` locks the first half. E14 leaves open whether the model may propose world items. Recommended resolution: leave `mapListing` as tested until that question is answered, and do not "fix" it by adding world items. The fact that would flip this: Phil says a pasted paragraph should land as supposed items on the environment, mental-state, and assumptions maps.

**Open sign-up.** `src/server/auth.js:164` defaults to open. E15 already names the failure (strangers spend the key) and `HANDOFF.md` question 11 asks Phil whether open sign-up is wanted before the app is reachable from outside. The code has answered "yes" in the meantime. `web.config` is an IIS site with a path on this machine. Recommended resolution: default `SIGNUP` to closed until that question is answered. Both lenses want this. It is listed as a conflict only because Phil has not answered. The fact that would flip this: Phil says open sign-up is intended on this host, with `DAILY_CALL_LIMIT` as the bound.

### One-sided (judge these)

**Password change leaves old cookies valid for 30 days.** Already written in E15 as an open point. Keep. There is no session table, so a fix is a password generation counter inside the signed cookie, checked in `userById`. Lens A only, because it is a troubleshooting dead end ("I set a new password and the other browser still works") more than an editing hazard.

**Daily-limit check then call, with no lock** (`server.js` `underDailyLimit`). Two overlapping calls can both pass. Lens B only. Discard as a fix-now. The window is a couple of calls, and screened refusals already count. Revisit if one account is shared.

**`ideaId` is dead.** Lens B. Keep, as a small deletion or a real link. Low.

**File-version headers.** Lens B. Keep as a process check, not as a code change, until `git log` shows a real miss.

**Google fonts on the page** (`src/client/page.html` stylesheet link to `fonts.googleapis.com`). Lens A only, from the privacy line in `VISION.md` §4.6. Keep as a later pass. Every open of the app tells Google that this browser loaded it. It does not affect correctness.

**Dates are "Sep 28" with no year** (`server.js` `today`, and the same in `src/client/10-util.js`). Already E6. Discard as new work. Do not invent a second date format beside that experiment.

**Reconcile sees titles only, capped at 160. Activity counts passes, not days. Speakers are unlabeled.** Already `HANDOFF.md` §14 and E6. Discard here. They are still true.

## Top 3 actions

1. Make a failed save sticky: no later step is sent, and the local step is retried or removed, until the server and the page match. `src/client/40-streams.js`.
2. Stop inventing `closer` for moves read in the text, and stop clearing `read` when the goal is accepted. `src/shared/replay.js` `applyResult` and `acceptgoal`. Adjust the help prompt so it does not repeat the invention.
3. Draw ruled-out items when they are all that a map holds, and put the method's link labels in the panel so "select on and improve" can do what `METHOD-Deriving-the-Maps.md` says.

After those, the screen refusal needs a recovery path before anyone who is not the admin ideaifies a stream that already contains one of those phrases.

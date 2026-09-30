# Notes for AI assistants working on this project

## Files live in two places

- `D:\Projects\network-meaning` — the working copy and git repo. **Source of truth.** Remote: github.com/phil1961/network_meaning.
- Google Drive folder `network_meaning-docs`, ID `11CaUhG1NRAqDuU-WSw5Qmc0LUfhPGwdt` — the shared copy of the root `.md` files, readable by Claude in the browser. Created 2026-09-30 through the connector. The earlier folder `network_meaning` (ID `1X_IfrXISMQryjtvK4NrzBQ6mkRYwfUab`) is no longer visible to the connector ("Requested entity was not found"), most likely because the connector was reauthorized after it was created; Phil's mounted copy at `H:\My Drive\network_meaning` still holds the files for him.

End-of-session sync (Phil's rule): copy the root `.md` files to `H:\My Drive\network_meaning` for Phil, and upload the same files through the connector into the folder above for browser Claude. Both, every time. Since `update_file` only changes metadata, re-uploading means trashing the old copy and creating a new one.

## The Google Drive connector has per-file scope — read this before debugging it

The Drive connector operates under Google's `drive.file` scope: **it can see only files that Claude itself created through the API.** It cannot see anything else in the Drive account, no matter who owns it.

Symptoms this produces, all of them expected and none of them bugs:

- `search_files` returns empty for *every* query — titles, `fullText`, `mimeType`, even `parentId` values the API just returned itself.
- `list_recent_files` returns only the handful of Claude-created files, making a full Drive look nearly empty.
- A file you can plainly see in the browser, or on the mounted `H:` drive, is invisible to the connector.

Established 2026-09-28 by enumeration. Two likelier-sounding explanations were investigated and **ruled out** — don't spend time re-deriving them:

- *Not a second/wrong account,* despite two accounts being signed into Drive for Desktop. A file created via the connector appeared at `H:\My Drive\` within the same minute, proving one shared account.
- *Not a failed upload or stale index.* The files were confirmed present in Drive in the browser the entire time. Reading `%LOCALAPPDATA%\Google\DriveFS\Logs` was a dead end.

### Working rules

1. **Discover with `list_recent_files`, never `search_files`.** Tested again 2026-09-30: `search_files` by `mimeType` (folder, text/markdown, text/plain) and by `title` all return empty pages, sometimes with a continuation token and still nothing on later pages. Mime-type search is not a workaround. Then work by file or folder ID. If you need a file the listing doesn't reach, ask the user to paste its browser URL — the ID is in it.
2. **To make a local file readable by browser Claude, upload it with `create_file`.** Copying it to `H:` will *never* work: mount-written files stay invisible to the connector permanently, even inside a Claude-created folder. This asymmetry is the single most important fact here.
3. **Pass `disableConversionToGoogleType: true`** when creating text files, or `text/plain` is silently converted into a Google Doc and stops being markdown.
4. **Use `download_file_content` for `.md` and `.txt`.** `read_file_content` doesn't support `text/plain`, and failing on it looks like a missing file when the file is fine.
5. **IDs are identity; titles are not.** Drive permits duplicate sibling names — creating a second folder titled `network_meaning` succeeded, and the mount showed it as `network_meaning (1)`.

The scope is set by how the connector was authorized. It cannot be widened from inside a conversation; that is a reconnection/permissions matter in Claude settings, and may not be offered at all.

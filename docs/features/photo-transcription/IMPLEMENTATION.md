# photo-transcription — implementation

Discovery is closed. The reasoning behind each choice is in `DECISIONS.md` next door.

**Photo in, markdown out.** Pick photos → process in the client → upload to Blob → press transcribe → one call → split on `---` → edit.

Each phase has a **Done when** list and a **Checks** block. The checks are prompts to look, not boxes to tick: a check that clearly doesn't apply to the phase in front of you isn't a finding.

---

## Phase 0 — Account setup

No code. Blocks everything else.

1. Create the OpenRouter account and **restrict routing to providers that don't train on the data**. This goes before the first call, not after.
2. Run three real pages, one written in a hurry, through the candidates on the same prompt. Count words that needed correcting. Pick by the number.

**Done when**

- [ ] Privacy routing is on, and the setting is written down in the README
- [ ] A model is chosen and set in `OPENROUTER_MODEL`
- [ ] The candidate scores are recorded in `DECISIONS.md`

**Checks**

- **Security** — the API key is in an env var, never in client code. Anything under `NEXT_PUBLIC_` ships to the browser.

---

## Phase 1 — Schema

`Letter` and `Page`. What this feature touches:

| Field | Note |
| --- | --- |
| `Letter.mdContent` | Edited transcription, whole letter, pages split by `---` |
| `Page.index` | Order |
| `Page.blobUrl` | The processed photo |
| `Page.width` / `height` | Written after the client resize, to prevent layout shift |
| `Page.alt` | Required, not optional |
| `Page.rawTranscription` | Model output, untouched, per page |
| `Page.transcriptionProvider` | Which model produced that raw |

`transcriptionProvider` wasn't in the original model. Without it, comparing transcriptions after a model switch is guesswork.

There is no `userId` on `Letter`. The app is single-user and Clerk owns identity, so a column that would always hold the same value buys nothing.

**Done when**

- [x] Migration runs clean on an empty database — verified against a throwaway Postgres 16
- [x] `Page` has a unique constraint on `(letterId, index)` — a duplicate index is rejected
- [x] Deleting a letter deletes its pages — `on delete cascade`, verified
- [x] `slug` is unique, so a collision fails at insert time rather than being assumed away

**Watch out:** `drizzle-kit migrate` uses the `@neondatabase/serverless` driver, which only speaks websockets to a hosted Neon instance. Pointed at a plain Postgres it **exits 0 without applying anything**. Verify tables exist after migrating; don't trust the exit code.

**Checks**

- **Bugs** — timestamps are stored as UTC. A date built from a bare `YYYY-MM-DD` string shifts by timezone.
- **Performance** — `Page` is queried by `letterId` and ordered by `index`. Index it.

---

## Phase 2 — Upload and image processing

All client-side.

- `<input type="file" multiple accept="image/*">`, capped at 5
- Page order comes from selection order
- Per file: draw to a `canvas`, resize the longest side to 1500px, export with `toBlob` as JPEG 0.8, **keeping colour**
- If canvas can't decode it (a `.heic` dropped into desktop Chrome), that file shows "convert to JPEG" and the rest carry on
- Thumbnails with the order visible, so a blurry photo can be retaken before a call is spent
- Record `width`/`height` **after** the resize

**Done when**

- [x] Five photos process without freezing the tab — sequential, awaiting between files so the event loop yields
- [x] Going over the cap is refused with a message, in the form *and* in the route. A client-side limit is a convenience; a server-side one is a rule
- [x] An undecodable file fails alone, leaving the others intact
- [x] Stored dimensions are the post-resize ones, unit tested in `lib/images/process.test.ts`
- [ ] Verified against a real Vercel Blob store — needs `BLOB_READ_WRITE_TOKEN`

**Checks**

- **Accessibility** — the file input is reachable and labelled; drag-and-drop, if added, is not the only way in. Progress is announced through a live region, not colour alone. Every page needs `alt` before it can be published, so the field is required in the form, not optional.
- **Responsive** — the thumbnail grid works at 375px. Reason about 375px, don't guess from a desktop window.
- **Bugs** — processing runs off the main thread or in sequence; five full-resolution photos decoded at once will freeze the tab on a phone.
- **Performance** — object URLs are revoked after use, or five previews leak the originals into memory.
- **Loading and error states** — every file shows its own state. One global spinner hides which photo failed.

---

## Phase 3 — The transcription call

Explicit button. Never automatic on upload completion.

One request to `/api/v1/chat/completions` with every page in the same message: the prompt text first, then the `image_url` entries in `index` order.

The images go as **base64 data URLs**, not Blob URLs: the store is private, so OpenRouter cannot fetch them itself. Base64 inflates by about a third, so five pages is roughly 2MB of request body — inside a Function's limit, and the reason the five-page cap is not negotiable.

Required in the body:

- `provider: { allow_fallbacks: false }` — transcription has to be reproducible
- `reasoning: { effort: 'none' }` — transcribing needs no reasoning, and that is where cost runs away. **Not** `enabled: false`: that is documented only as a way to switch reasoning *on*, and on a model that mandates reasoning it does nothing, so the request would quietly be billed for thinking

The prompt is short and restrictive:

- return plain markdown
- preserve paragraph breaks
- mark illegible passages as `[?]`
- **do not invent words**
- separate each page with `---` on its own line

That last line is what makes one call and per-page storage coexist.

**Done when**

- [x] The call runs server-side and the key never reaches the browser (`server-only`)
- [x] `allow_fallbacks: false` is set
- [x] Failures are told apart by code, and nothing retries on its own
- [x] `no endpoints found that support image input` is handled with a message naming the model
- [ ] Actually run against OpenRouter — blocked on phase 0

**Note:** the context doc suggested `max_tokens: 1200`. That was sized for one page and truncates a three-sheet letter, so the ceiling scales with page count in `lib/transcription/prompt.ts`.

**Checks**

- **Security** — the route is authenticated: an open transcription endpoint spends my credit for anyone who finds it. The provider's error body is never forwarded raw to the client.
- **Bugs** — a serverless function has a time limit; five images in one call can exceed it. Know the ceiling before shipping.
- **Loading and error states** — the button disables while in flight, and the failure message tells a network error apart from a model refusal.

---

## Phase 4 — Split and store

Split the response on `---` and write one block per `Page`, in order. Store `transcriptionProvider` alongside.

If the block count doesn't match the page count: write the whole response into page 1's raw and show a warning. Losing the split is recoverable; losing the transcription is not.

Reprocessing overwrites the raw.

**Done when**

- [x] Three pages produce three raws in the right order
- [x] A mismatched count keeps the text and warns
- [x] Reprocessing replaces the raw and updates the provider
- [x] A `---` written inside the letter itself over-splits, and is caught by the mismatch path rather than silently mangling pages

All of it is unit tested in `lib/transcription/split.test.ts`, including Windows line endings and a model that ignores the separator entirely.

**Checks**

- **Bugs** — a `---` written inside the letter itself will over-split. Decide the behaviour rather than discovering it.
- **Security** — model output is untrusted text. It reaches the page through the sanitize schema in `markdown-hightlight`, never through raw HTML.

---

## Phase 5 — Editor

Textarea holding `mdContent`, seeded the first time from the raws joined with `---`.

`[?]` is visually highlighted. It marks what the model said it couldn't read, which is exactly what has to be checked against the photo.

The side-by-side preview and the highlight shortcut belong to the other feature — see `markdown-hightlight/IMPLEMENTATION.md`.

**Done when**

- [x] Seeding happens once and never overwrites edited content — `seedMdContent` refuses a letter that already has text, and `saveMdContent` is the only path allowed to replace it
- [x] Every `[?]` is findable without reading the whole letter — a count plus a "go to next" that selects the mark in the textarea and wraps
- [x] Edits survive a reload, and leaving with unsaved changes warns first
- [x] Saving validates on the server, not only in the form

`[?]` cannot be styled inside a textarea, so the marks are surfaced as a count and a jump rather than a colour — which is also the accessible answer, since colour alone would not have carried it.

**Checks**

- **Accessibility** — the textarea has a real label; `[?]` highlighting isn't colour-only.
- **Bugs** — reseeding after an edit is the data-loss bug in this phase. There should be no path that silently overwrites `mdContent`.
- **Responsive** — the editor is a desktop surface, but it must not be unusable on a phone.

---

## Notes on this Next version

Next 16.3.4. The docs that count are in `node_modules/next/dist/docs/`. Confirmed:

- `params` is a `Promise` and has to be awaited, in pages, layouts and `generateMetadata`.

Check the local docs before writing a route. Don't write it from memory.

## Out of scope

- A public `Transcriber` interface or a formal `manual` implementation. Transcribing by hand still works: type it into the editor.
- Transcription history or versioning.
- Automatic retry.

# photo-transcription — decisions

Decision log. X because Y. Closed on 2026-09-09.

---

**Max 5 pages per letter** — because the real case is 2 or 3 sheets, and 5 is headroom rather than an expectation.

**Multi-select upload, order comes from selection order** — because iPhone filenames don't sort reliably, and selection order is explicit.

**Image processing runs in the client: 2400px longest side, JPEG quality 80** — because the photo then arrives small, which cuts upload time and keeps image work out of a serverless function.

Was 1500px. It was first raised for a reading view that zoomed into the photograph, and that zoom has since been removed. What kept the number is the decision above it: **only one version is stored and the original is thrown away**, so the one that is kept is the archive copy of a handwritten letter. A reader who wants to look closely — browser zoom, pinch on a phone — gets a sheet worth looking at.

That is a weaker argument than the measured one it replaced, and 1500px would also have been defensible. See `design/DECISIONS.md`.

**A second, smaller output is stored alongside it, at 1200px** — because a phone has no use for the archive copy and `srcset` cannot choose between sizes that do not exist. Nullable in the schema: pages uploaded before this existed fall back to the one file they have.

**Colour is kept, no grayscale conversion** — because only one version is stored, so that version is the one people see on the published page. Ink on paper is half the point, and JPEG already compresses chroma hard, so grayscale saved little and made the page look like a photocopy.

**Only the processed photo is stored** — because the 4MB original has no consumer.

**The Blob store is private, not public** — because the letter's photo *is* its content, and a public blob URL would outlive both unpublishing and `expiresAt`. The letter page would 404 while the photograph stayed reachable forever, which makes two decisions in `share/DECISIONS.md` half-true. Private means every read goes through a Function that checks the letter's status.

The access mode cannot be changed after a store is created, which is itself an argument for the stricter option.

Two consequences, both accepted: OpenRouter cannot fetch a private URL, so the images travel as base64 data URLs in the request body (~400KB per page, which is what the five-page cap is sized against); and photos are served by a route rather than a CDN URL.

**HEIC is accepted and converted in the client via canvas** — because Safari on iPhone already hands over JPEG from a file input, so the case is rare. If canvas can't decode it, the file shows an error asking for JPEG. No conversion library in v1.

**Transcription runs from a button, not automatically after upload** — because it leaves room to look at the photos and retake a bad one before spending a call on a blurry image.

**One call with every page in it** — because it's fewer round trips and the model sees the whole letter, which helps with words broken across a page turn.

**The prompt requires `---` between pages, and the response is split on it** — because `rawTranscription` is stored per page, so a single response has to stay separable. Same separator the reading view uses to paginate.

**If the block count doesn't match the page count, everything goes to page 1's raw with a warning** — because losing the split is recoverable and losing the transcription is not.

**No automatic retry** — because a hidden retry spends a call without me seeing it. Failure shows the error and a try-again button.

**Reprocessing overwrites the raw** — because a wrong transcription has no historical value, and reprocessing will happen often while the model isn't settled.

**Illegible passages come back as `[?]` and are highlighted in the editor** — because OCR hallucination reads as plausible text. What the model flagged as unread is exactly what has to be checked against the photo.

**No `userId` on `Letter`** — because the app is single-user and Clerk owns identity, so the column would always hold the same value.

**`slug` is unique in the database, not just in the generator** — because a collision has to fail at insert time. A generator that "won't collide" is an assumption, and a unique index is a guarantee.

**Transcription stays app code, with no public `Transcriber` interface** — because it's a fetch and a prompt. The reusable piece of this repo is the highlight layer, decided in `markdown-hightlight/DECISIONS.md`.

---

## Open

**Which model.** No OpenRouter account yet. The choice comes from running three real pages, one written in a hurry, through the candidates on the same prompt and counting corrected words.

**OpenRouter privacy setting.** Routing has to be restricted to providers that don't train on the data before the first call. This blocks the start of the feature.

# design — implementation

Discovery is closed. What was decided and why is in `DECISIONS.md` next door.

Each phase has a **Done when** list and a **Checks** block. The checks are prompts to look, not boxes to tick.

Phase 2 was the one worth building first: it carried most of the gain and depended on none of the region work. That judgement held for as long as the spread did, and phase 4 is the one that came back out first.

**Five of the six were built. Phase 4 was reversed, and phase 2 has since been replaced** by the envelope refactor in `REFACTOR.md`, which is where the reading view is described now. This file is the history of how it got there, and phases 1, 3, 5 and 6 are still live. What each phase actually cost is in `DECISIONS.md`, under *Decided while building it*, *Reversed after building it* and *The envelope*.

A seventh piece was added afterwards and is not a phase, because it was not planned: the 404, the error page, the skeletons and the typed loading line. It is in `DECISIONS.md` under *Waiting, and going wrong*.

---

## Phase 1 — Chrome and hero

A fixed top bar: wordmark left, letter name centred, legend chips right. An asymmetric hero with the photograph rotated `-1.6deg` and bleeding off the right edge, a vertical `writing-mode: vertical-rl` caption up its left side, and a `READ ↓` cue.

The letter is named by the three words of its slug, without the token: `AUTUMN · BUREAU · COVE`.

**Done when**

- [x] Nothing in the `<head>` or the bar reveals any of the letter's content
- [x] The chips read `--hl-important` / `--hl-note` / `--hl-ask` from the tokens, never a repeated hex
- [x] The fixed bar does not cover content when an anchor is jumped to
- [x] At 390px the wordmark does not wrap and the letter name does not truncate

**Checks**

- **Accessibility** — the vertical caption is decorative and needs `aria-hidden`, or a screen reader spells it out sideways. Anything the bar can cover needs `scroll-margin-top`.
- **Responsive** — the bar has three regions and one width. Decide out loud what drops first at 390px rather than discovering it.
- **Performance** — the rotation is a `transform`, never an animated negative margin.

---

## Phase 2 — The sticky spread · **replaced**

Built as specified, deployed, read on a real letter, and replaced by the envelope
refactor. **`REFACTOR.md` is what the reading view is now**; what follows is what
it was, kept because phases 3, 5 and 6 still refer to it.

It answered a layout question correctly and the wrong question: two columns
moving past each other shows a document well, and a letter is not a document.
The reasoning is in `DECISIONS.md` under *The envelope*.

The passage reveal survives it. So does the rule that a passage is found in the
DOM rather than constructed, and so does the whole of phase 3.

---

The photograph goes `position: sticky` while the transcription scrolls past it. Passages enter with a small `translateY` and settle.

Each photographed sheet is its own sticky section, stacked down the scroll. `mdContent` still splits on `---` for sheets; a passage is a paragraph within a sheet.

**This removes page-turn navigation on desktop.** The previous/next buttons and the dots go; on mobile they stay, because the toggle is what governs there.

**Done when**

- [x] Every sheet's text is in the server HTML, as it already is
- [x] With no JavaScript everything is legible — a `@media (scripting: none)` block, same as the highlights
- [x] Under `prefers-reduced-motion` the settled state is the default and nothing translates
- [x] No passage drops below AA contrast at any point in the transition
- [x] A three-line letter does not leave the sticky sheet alone on an empty screen

**Checks**

- **Accessibility** — 12% opacity is unreadable. Either the starting state clears AA on its own, or the transition moves only `translateY` and leaves opacity alone. **Measure it, don't estimate it.**
- **Bugs** — `position: sticky` dies silently if any ancestor has `overflow` other than `visible`. It is the classic failure of this technique and it produces no error.
- **Performance** — the observer watches the passages, not the scroll. A `scroll` handler recomputing positions every frame is what makes sticky stutter.
- **Responsive** — below the breakpoint sticky is switched off, not shrunk.

---

## Phase 3 — Legend filtering

Clicking a chip dims the highlights that are not that tag. A custom-property swap, momentary, not in the URL.

**Done when**

- [x] The chips are `<button>` with `aria-pressed`, not a `<div>` with a click handler
- [x] Clicking the active chip again clears the filter
- [x] A dimmed highlight keeps its text readable — what leaves is the colour, never the word
- [x] With no JavaScript the chips do not render, rather than rendering broken

**Checks**

- **Accessibility** — dimming by colour removes exactly the channel WCAG 1.4.1 already said cannot be the only one. The per-tag underline is what holds this interaction up.
- **Reuse** — the dimmed value is a token, not the `rgba(63,48,33,0.05)` the comp hardcodes.

---

## Phase 4 — Follow the line · **removed**

Built as specified, looked at, and taken out again. The photograph zoomed and
panned to the band of the sheet the current passage was written on; `at`
regions, the region picker and the region maths all existed to feed it.

It did not read as intended. Two columns already say *these words, that page*;
a photograph that moves on its own while you read makes the half of the screen
you are not looking at the half that is moving.

`:::passage` survives as a grouping — one block of the transcription, one
number in the gutter — which was the useful half. The reasoning is in
`DECISIONS.md` under *Reversed after building it*.

---

## Phase 5 — The coda

The blush band, the closing lines, `WRITE BACK →` and `READ IT AGAIN`, and the privacy line.

`WRITE BACK` is a `mailto:` whose address comes from an env var, not the repository.

The line *read to the end · counted once · nothing else is stored* is literal and has to stay true.

**Done when**

- [x] The privacy sentence matches exactly what the `View` table stores
- [x] The end-of-letter event fires in this section, and is still fired once
- [x] `READ IT AGAIN` returns to the top without reloading and without counting a new open
- [x] The `mailto:` arrives with a subject already filled in

**Checks**

- **Privacy** — it is the one sentence in the product that promises anything. It is the check.
- **Accessibility** — the blush band changes the background, so the text and buttons are a different contrast pair. Measure against the blush, not the paper.

---

## Phase 6 — Mobile

**Its premise moved.** Mobile is no longer the width where the letter is read differently: the deck and the two-faced sheet are the same at every width, so there is far less to switch off. The 390px checks below are the part that outlives it, and they are repeated in `REFACTOR.md` phase 7.

Not a port. It shrank a lot once mobile kept what already works: photo first, one tap to the transcription, no sticky and no zoom.

So the phase is: do not break what exists, and switch off what does not apply.

**Done when**

- [x] Sticky, zoom and the vertical caption are switched off below the breakpoint, not shrunk
- [x] The photo/transcription toggle still works, including on a single-sheet letter
- [ ] The handwriting is still legible at 390px — checked in a device viewport, not yet on a real phone
- [x] Nothing scrolls sideways
- [x] Sheet navigation still exists, since sticky is not there to replace it

**Checks**

- **Responsive** — reason about 390px properly. Chrome will not resize below about 550px; use the device toolbar.
- **Performance** — do not ship a 2400px photo to a 390px screen. `sizes` on the image, or a second output.

---

## What already exists and should not be rebuilt

- `remark-scanned-page` renders the transcription server-side, with `<mark data-c>` and themed `<aside>` blocks. The comp's markup matches that output.
- The highlight sweep, the `rise` / `draw` / `sweep` keyframes, the paper ground, the grain and the palette are in `app/globals.css`. The comp reuses them rather than replacing them.
- The end-of-letter event, the bot filter and the per-session dedup already work. Phase 5 changes where the event fires, not how it works.

## What changes in decisions already recorded

- **`photo-transcription/DECISIONS.md`** — the 1500px cap becomes 2400px, with a second 1200px output. The reason changed after phase 4 came out: it is now the archive copy of the photograph, not the source for a zoom.
- **`share/DECISIONS.md`** — page-turn navigation stops existing on desktop, replaced by the stacked sticky sections. On mobile it stays.
- **`markdown-hightlight/DECISIONS.md`** — the package gains a second directive, `:::passage`. It was specified with an `at` region and shipped without one.

---

## What is still open

- **390px was checked in a device viewport, not on a phone.** That is the assumption the whole reading view rests on and it is the one check that cannot be automated.
- **Nothing multi-sheet has been read end to end.** The stacked sticky sections and the sheet navigation are built and neither has had two real sheets through it.
- **`WRITE_BACK_EMAIL` is unset.** Until it is, the coda renders without the button rather than with a broken `mailto:`.

## Phase 7 — Tactile envelope and paper deck

Refine the envelope refactor so opening it feels like handling paper: a sealed tear strip,
a folded insert that rises before the envelope leaves, and a readable paper
surface that settles into the same scene. Home and published letters share the
opening controller and drawing. The reading deck gets directional page turns,
a close/reopen control, and a photograph toggle on the paper.

**Done when**

- [x] Opening, closing, reopening and rapid input settle reliably; reduced motion skips the choreography.
- [x] The envelope has a tear strip, postal details, paper grain and token-based shadows; the open letter retains a physical sheet and stack.
- [x] Page turns animate in the navigation direction; the photograph stays accessible on each sheet.
- [x] Home and letter use the same opening and sound implementation.
- [x] Tear and page sounds are generated once with ElevenLabs, stored in `public/sounds`, played only on user interaction, and have a persistent mute control.
- [x] Server HTML and no-script reading remain complete; inactive sheets and the unreached coda remain out of layout.
- [x] Desktop and 375px, reduced motion, keyboard navigation, no-script fallback, lint, typecheck and the existing tests are checked.


**Validation (September 2026)**

Local Chromium at 1440px and 375px: open, original-photo view, next/previous,
arrow keys, close/reopen, persistent mute, one and three sheets, long content,
long recipient, failed audio, and changing reduced-motion preferences while
opening. No-script checks confirmed every sheet, transcription and image stays
visible. Reached-end requests were intercepted: none before the last sheet,
one on reaching the coda, none on reopening. Sample letters were temporary and
removed after the checks; no production analytics or letters were written.

The animation was captured and inspected frame by frame. A real phone and the
legibility of actual handwriting remain manual checks; the photo-view tests
used sample artwork. Lint, TypeScript and the 194 existing tests pass.

## Phase 8 — The writing desk

Make creating and updating a letter one workspace: photographs, text and marks,
then sharing. Keep each step mounted so changing steps cannot discard edits or
prepared photographs. Bring the reference photograph beside the editor, and
allow highlights to be applied to selected rendered words through source
positions supplied by the existing package. Keep explicit saving because edits
to published letters become public on save.

**Done when**

- [x] The desk makes starting and reopening a letter obvious; analytics are secondary.
- [x] Creation asks for a title and recipient, with a custom link optional.
- [x] Photos can be removed or reordered before upload; processing and upload states prevent overlapping batches.
- [x] The editor offers text editing and visual marking, reference photos, undo, named theme grouping and a persistent save control.
- [x] Existing highlights can be recoloured or removed without losing words; ambiguous visual selections fail safely.
- [x] Switching steps and refreshing metadata preserve unsaved text; leaving warns, and publishing points back to unsaved changes.
- [x] Sharing has preview, copy link, clear draft/published/expired states, editable details, and secondary expiry/delete settings.
- [x] Rendering and sanitizing stay in the package; auth checks and noindex remain intact.
- [ ] Desktop, 375px, keyboard, failed saves, refreshes, upload recovery and package editing tests pass alongside lint and typecheck.


Typography: two families. Newsreader carries the letter, every heading and,
in its italic, the envelope and the wordmark; JetBrains Mono carries labels and
controls. Caveat and Inter were removed from `app/layout.tsx`.

Validation: lint, typecheck and 202 unit tests pass, including exact source
positions, highlight removal/recolouring, nested selection rejection and details
validation. The PATCH route refuses a body that mixes the text, the details and
the status, and refuses to publish a letter with no photograph or no saved
text. Still open, because the desk sits behind sign-in: /admin and
/admin/letters/[id] at 1440px and 375px — step switching with unsaved edits,
photo reorder/remove and failed upload recovery, selection/recolour/remove,
keyboard undo/save, metadata refresh, sharing, and heading wrapping.

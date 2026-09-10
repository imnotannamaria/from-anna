# design — implementation

Discovery is closed. What was decided and why is in `DECISIONS.md` next door.

Each phase has a **Done when** list and a **Checks** block. The checks are prompts to look, not boxes to tick.

Phase 2 was the one worth building first: it carried most of the gain and depended on none of the region work. That judgement held — it is the phase the reading view is made of, and phase 4 is the one that came back out.

**Five of the six are built and phase 4 was reversed.** What each phase actually cost is in `DECISIONS.md`, under *Decided while building it* and *Reversed after building it*.

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

## Phase 2 — The sticky spread

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

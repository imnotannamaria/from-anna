# design — decisions

Decision log. X because Y. Closed on 2026-09-09, from a design comp reviewed against what already existed. The last section is what building it changed.

---

**The photograph goes sticky beside a scrolling transcription, on desktop** — because a portrait photo and its transcription were fighting for the same screen, and pinning one while the other moves reads like sitting with the letter instead of paging through a document.

**Page-turn navigation is removed on desktop and kept on mobile** — because the sticky sections replace it where they exist, and nothing replaces it where they don't.

**Each photographed sheet becomes its own sticky section, stacked down the scroll** — because a letter is read in the order it was written, and stacking preserves that without asking anyone to find a control.

**Mobile keeps the toggle that already exists: photo first, one tap to the transcription** — because neither half survives being half a phone wide, and the handwriting is what someone opened the link to see.

~~**Crop regions, and a photograph that zooms to follow the passage being read.**~~ **Built, looked at, removed.** See *Reversed after building it* at the end.

**The stored image cap is 2400px, with a second 1200px output served through `srcset`** — because only one version of a photograph is kept and the original is thrown away, so the one that is kept is the archive copy of a handwritten letter and had better not be regretted. A reader who wants to look closely at the handwriting — browser zoom, pinch on a phone — gets a sheet worth looking at, and `srcset` keeps the default download small.

The cap was originally raised for the passage zoom, which is gone. This is the reason that survived it, and it is a different and weaker one: 1500px would also have been defensible.

**Existing photos are re-uploaded rather than migrated** — because there is exactly one test letter, and reprocessing would need the original, which is deliberately not kept.

**The passage reveal degrades to fully visible with no JavaScript and under `prefers-reduced-motion`** — because the comp starts unread passages at 12% opacity, which is unreadable by any measure, and a reader whose observer never fires would be left with a letter that looks blank. The highlight sweep already solves this shape of problem: the finished state is the default and JavaScript adds the animation.

**The letter is named by the three words of its slug, with no number** — `AUTUMN · BUREAU · COVE`. Numbering tells a reader how many letters exist and where theirs sits in the sequence. The slug words are already the letter's identity, they are not sequential, and they tie the URL to the page for free.

**The reader is shown their own reading progress** — because the coda says *counted once, nothing else is stored* out loud, and showing the progress makes that disclosure concrete rather than a claim. It turns the measurement from something hidden into something admitted.

**The privacy line is literal and has to stay true** — one row per open, deduplicated per session, no IP. If the measurement ever changes, that sentence changes with it.

**`WRITE BACK` is a `mailto:` for now, with the address in an env var** — because a form is more work than the first version needs. The address is not in the repository, and an address on a public page gets harvested; if that becomes a problem the swap is to a form.

**The legend filter is momentary and does not go in the URL** — because it is a way of looking at a letter, not a way of arriving at one.

**The legend chips read the highlight colours from the tokens** — because `lib/theme/palette.test.ts` measures those tokens against the ink in both modes, and a repeated hex, which is what the comp does, is a value that test no longer protects.

---

## Decided while building it

**The passage reveal moves `translateY` and leaves opacity alone** — because the alternative was picking a starting opacity that clears AA, and there isn't a good one: anything faint enough to read as an entrance is too faint to read as text. Moving only the position means contrast never changes, so it cannot drop, and there is nothing left to measure.

**A passage is a top-level block of the transcription, found in the DOM rather than constructed** — because the markdown decides a letter's shape, and enumerating passages in React would mean a second opinion about it. `data-passage` is added to text that is already painted.

**Passage numbers come from a CSS counter, not from JavaScript** — because they are then correct before any script runs, and they stay decorative: a pseudo-element is never in the accessibility tree, and "04" read aloud in the middle of a sentence is noise.

**The legend filter is three `:not()` rules, one per tag, rather than "dim everything then put one back"** — because the two-rule version gives both rules identical specificity and leaves source order to decide. It was wrong the first time: filtering to `important` dimmed `important` too. Rules that cannot overlap have nothing to settle.

**A second, smaller output of every photo is stored, and the sheet is served through `srcset`** — because raising the cap to 2400px for the zoom would otherwise have made every phone download a sheet it can never zoom into. `sizes` alone cannot help when there is only one file to choose between.

**`--fg-muted` is darker than entrepta's** — because paper is not white. The inherited `#8a7f72` measures 3.54:1 against this canvas, and every `.meta` label in the project is 11px, which WCAG counts as normal text. The new value clears AA on the paper and on the coda's blush, which are the only two grounds it sits on.

**The privacy line uses `--fg-secondary`, not `--fg-muted`** — because the blush band is a darker ground than the paper and muted does not reach AA on it. Measured against the blush, as the phase said to.

**The display face is Fraunces; the letter stays in Newsreader** — because a headline can afford an irregular old-style serif and four hundred words of transcription cannot. Fraunces' `SOFT` and `WONK` axes are the warm, hand-cut feel that was wanted; the same irregularities are friction at reading size.

**WindsorEF and Ano were considered and not used** — because both are commercial licences, and a public repository cannot ship the font files. Buying a webfont licence and gitignoring the files would mean `npm install && npm run dev` no longer renders the project as designed for anyone who clones it.

**The `:::passage` directive emits a `<div>`, which widens the sanitize schema by one tag** — because it needs an element to carry the region and every allowed tag already means something else. The argument for it: `remark-rehype` drops raw HTML from the source, so the only `div` reaching the schema is the one the plugin emits; it carries no URL, no handler and no text of its own; and the single attribute allowed on it is parsed and clamped by `parseRegion` before it reaches a `transform`.

**A region is drawn on the photograph by hand, never derived** — because a derived region can be quietly wrong and there is nothing honest to derive it from. The picker writes `:::passage{at="…"}` into the markdown, which stays the one source of truth, exactly as highlights do.

---

## Reversed after building it

**Following the line is gone.** The photograph no longer zooms and pans to the band of the sheet the current passage was written on, and there is no `at` region, no region picker and no `parseRegion`.

It was built, and it did not read as intended. Two columns already say "these words, that page"; adding a photograph that moves on its own while you read makes the half of the screen you are not looking at the half that is moving. A reader following a line of text does not want the picture beside it to be doing something.

What went with it, and why the whole chain went rather than just the animation:

- **`at` on `:::passage`.** A region is a number that only ever existed to aim a zoom. With nothing to aim, it is an attribute nobody can see the effect of.
- **The region picker, `parseRegion`, `bandFor`, `regionFor`, `sheetIndexAt`.** All of it was there to produce or consume `at`.
- **`div` in the sanitize schema now allows no attributes at all**, which is a smaller thing to defend than one attribute with a clamp behind it.

**`:::passage` stays**, as a grouping. It is one block of the transcription: one entry in the reveal, one number in the gutter, one thing a reader arrives at. That was the useful half all along, and it does not need a region to work.

**The maximum zoom, at 1.5, is gone with it.** The measurement that produced it stands and is recorded above; there is simply nothing left to apply it to.

---

## Waiting, and going wrong

**The 404, the error page and the skeletons are on the same paper as everything else** — because a page that changes visual language the moment something goes wrong reads as a different site having a different problem.

**The 404 reads identically for a wrong link, an unpublished letter, an expired one, and someone else's** — because anything that distinguishes them hands back the one fact the unguessable slug exists to withhold. It is the same reasoning that made the letter route answer 404 rather than 403.

**The error page never prints the error** — a stack trace on a public page is a map of the code, and a message can carry a path, a query or a token. The digest is shown instead: it is the server's own reference and useless to anyone else.

**Skeletons are shaped like the thing they stand in for, and every one is `aria-hidden`** — a dozen grey rectangles read out one at a time is worse than silence, so one live line does the announcing.

**The typed line is CSS, not JavaScript** — because it has to work inside a `loading.tsx`, which is a file that sometimes exists for four hundred milliseconds and cannot wait for hydration to say anything. The text is clipped rather than built up, so a screen reader gets the sentence and not the performance.

**The favicon is drawn shapes, no letterform** — a favicon is 16px before it is anything else, and a glyph there would depend on a font the browser has no reason to have.

---

## The opening

**The hero photograph sits on two blank sheets, fanned out behind it** — because a letter is two or three pages and this is the only place on the site that can say so without writing it down. Drawn in CSS, not loaded: it is the same paper as the rest of the page and costs no request.

They fan to the left because the photograph runs off the right edge of the viewport, and a sheet peeking into a clipped margin is a sheet nobody sees.

**The photograph is wiped in from its bottom edge, and the blank sheets arrive first** — a sheet being laid down on a stack, rather than a card fading in. The wipe is on the photograph alone: `clip-path` on the wrapper cut the sheets behind it back to the photograph's own box, which is the shape they exist to escape.

**The opening photograph drifts slower than the words beside it on scroll** — the difference between a picture on a page and an object on a desk. Capped, and only ever a transform.

**"by hand" is underlined by a `text-decoration` that inks in after the words** — not a positioned pseudo-element, because the phrase wraps at narrow widths and only a decoration wraps with it.

---

## The front door

**The home page is the documentation** — because a personal instance of an open-source thing has to answer two questions at once, and the second one is the useful one. It says what this is in a screen, and then hands over the syntax, the package, the clone command and the environment it needs.

**The demonstration is rendered by the package, not screenshotted** — the same plugin, the same sanitize schema, the same stylesheet a published letter goes through. A screenshot drifts from the code the first time either changes; this cannot.

**The opening carries a stack of sheets with a real render on top** — the thing the page is describing rather than a picture of it. It is `aria-hidden`: a fragment of a made-up letter with no context, whose accessible version is the same output further down under a heading that explains it. Same call the letter pages make about their opening photograph.

**There is a note about cost, and it is specific** — every letter is a model call and some storage, so this instance stays personal and there is no sign-up. Saying *no accounts* without saying *why* reads like a moat. The code is MIT and the clone command is directly above it.

**`remark-scanned-page` is linked to the repository, not to npm** — because it is not published yet, and a link that 404s is worse than an honest sentence saying so.

---

## Controls

**Every button in the project is the same pill** — because there were three visual languages for a button (the reading view's pill, raw Tailwind borders in the admin, and the state pages) and only one of them was designed.

**A button that started something says so twice: a spinner and the word** — `Save` becomes `Saving…`, with `aria-busy` carrying it to assistive tech. A spinner alone says *something* is happening and the word says *what*, and only one of those survives being read out. Under `prefers-reduced-motion` the ring stops turning and stays: still an indicator, just not a moving one.

**A disabled solid button drops back to the outline treatment rather than fading** — the brand colour at 35% reads as a broken button, not an unavailable one.

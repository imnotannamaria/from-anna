# design — decisions

Decision log. X because Y. Closed on 2026-09-09, from a design comp reviewed against what already existed. The last section is what building it changed.

---

~~**The photograph goes sticky beside a scrolling transcription, on desktop.**~~ **Replaced by the envelope refactor.** See *The envelope* at the end.

~~**Page-turn navigation is removed on desktop and kept on mobile.**~~ **Reversed by the envelope refactor.** It is back, at every width. See *The envelope*.

~~**Each photographed sheet becomes its own sticky section, stacked down the scroll.**~~ **Replaced by the deck.** The order it argues for survives; the stacking does not. See *The envelope*.

~~**Mobile keeps the toggle that already exists: photo first, one tap to the transcription.**~~ **Replaced by the two-faced sheet**, which is the same toggle at every width and attached to the sheet rather than the bar. The order was already reversed once, below, under *After the first deploy*. See *The envelope*.

~~**Crop regions, and a photograph that zooms to follow the passage being read.**~~ **Built, looked at, removed.** See *Reversed after building it* at the end.

**The stored image cap is 2400px, with a second 1200px output served through `srcset`** — because only one version of a photograph is kept and the original is thrown away, so the one that is kept is the archive copy of a handwritten letter and had better not be regretted. A reader who wants to look closely at the handwriting — browser zoom, pinch on a phone — gets a sheet worth looking at, and `srcset` keeps the default download small.

The cap was originally raised for the passage zoom, which is gone. This is the reason that survived it, and it is a different and weaker one: 1500px would also have been defensible.

**Existing photos are re-uploaded rather than migrated** — because there is exactly one test letter, and reprocessing would need the original, which is deliberately not kept.

**The passage reveal degrades to fully visible with no JavaScript and under `prefers-reduced-motion`** — because the comp starts unread passages at 12% opacity, which is unreadable by any measure, and a reader whose observer never fires would be left with a letter that looks blank. The highlight sweep already solves this shape of problem: the finished state is the default and JavaScript adds the animation.

~~**The letter is named by the three words of its slug.**~~ **Replaced after the first deploy.** Read on a real letter, `thirsty · gate · pier` meant nothing to anyone, including me. See *After the first deploy*.

**The reader is shown their own reading progress** — it says how far through the letter you are, which is useful on its own. It was a thin bar measuring scroll; with the deck it is *sheet n of m*, which is the same fact stated exactly instead of approximately. See *The envelope*.

~~**The privacy line in the coda.**~~ **Removed after the first deploy.** See *After the first deploy*. The measurement it described has not changed: one row per open, deduplicated per session, no IP.

**`WRITE BACK` is a `mailto:` for now, with the address in an env var** — because a form is more work than the first version needs. The address is not in the repository, and an address on a public page gets harvested; if that becomes a problem the swap is to a form.

**The legend filter is momentary and does not go in the URL** — because it is a way of looking at a letter, not a way of arriving at one.

**The legend chips read the highlight colours from the tokens** — because `lib/theme/palette.test.ts` measures those tokens against the ink in both modes, and a repeated hex, which is what the comp does, is a value that test no longer protects.

---

## Decided while building it

**The passage reveal moves `translateY` and leaves opacity alone** — because the alternative was picking a starting opacity that clears AA, and there isn't a good one: anything faint enough to read as an entrance is too faint to read as text. Moving only the position means contrast never changes, so it cannot drop, and there is nothing left to measure.

**A passage is a top-level block of the transcription, found in the DOM rather than constructed** — because the markdown decides a letter's shape, and enumerating passages in React would mean a second opinion about it. `data-passage` is added to text that is already painted.

~~**Passage numbers in the margin, from a CSS counter.**~~ **Removed after the first deploy**, from the package as well as the app. See *After the first deploy*.

**The legend filter is three `:not()` rules, one per tag, rather than "dim everything then put one back"** — because the two-rule version gives both rules identical specificity and leaves source order to decide. It was wrong the first time: filtering to `important` dimmed `important` too. Rules that cannot overlap have nothing to settle.

**A second, smaller output of every photo is stored, and the sheet is served through `srcset`** — because raising the cap to 2400px for the zoom would otherwise have made every phone download a sheet it can never zoom into. `sizes` alone cannot help when there is only one file to choose between.

**`--fg-muted` is darker than entrepta's** — because paper is not white. The inherited `#8a7f72` measures 3.54:1 against this canvas, and every `.meta` label in the project is 11px, which WCAG counts as normal text. The new value clears AA on the paper and on the coda's blush, which are the only two grounds it sits on.

**The privacy line uses `--fg-secondary`, not `--fg-muted`** — because the blush band is a darker ground than the paper and muted does not reach AA on it. Measured against the blush, as the phase said to.

~~**The display face is Fraunces**~~; **the letter stays in Newsreader.** The second half holds and is the durable part: a headline can afford a face that four hundred words of transcription cannot. Fraunces itself was replaced, twice. See *The face on the front*.

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

**A photograph shows a skeleton until it arrives, and says so when it does not** — the photos come through a Function reading a private store, so a slow one left a blank frame that looked like a broken page. The state is set on mount, never in the server HTML, so with no script the photograph is exactly what was sent.

**The sheet that is open fetches its photograph while it is read** — the back of a sheet is `display: none` and a lazy image that is not laid out is never requested, so the download used to start at the tap on "View original photo". Only the sheet on top is warmed; each photograph is large enough to zoom into, which is still a reason not to fetch them all.

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

**The opening carries a stack of sheets with a real render on top, and what it says is the actual answer** — a note from me about why this exists, laid out as a letter and rendered by the same package a real one goes through. A specimen would have demonstrated the mechanism and answered nothing.

It is **not** `aria-hidden`, unlike the opening photograph on a letter page: those words appear nowhere else, so hiding them would hide content rather than remove a duplicate.

**The card is addressed — *from anna to you*** — because it is a letter, and a letter is addressed. It carries a link to my own site at the bottom, signed, which is where a signature goes.

**There is a note about cost, and it is specific** — every letter is a model call and some storage, so this instance stays personal and there is no sign-up. Saying *no accounts* without saying *why* reads like a moat. The code is MIT and the clone command is directly above it.

**`remark-scanned-page` links to npm, with the source beside it** — the install line is what someone reading that section wants; the repository is what they want after deciding. It linked to the repository alone while the package was unpublished, because a link that 404s is worse than an honest sentence saying so.

---

## Controls

**Every button in the project is the same pill** — because there were three visual languages for a button (the reading view's pill, raw Tailwind borders in the admin, and the state pages) and only one of them was designed.

**A button that started something says so twice: a spinner and the word** — `Save` becomes `Saving…`, with `aria-busy` carrying it to assistive tech. A spinner alone says *something* is happening and the word says *what*, and only one of those survives being read out. Under `prefers-reduced-motion` the ring stops turning and stays: still an indicator, just not a moving one.

**A disabled solid button drops back to the outline treatment rather than fading** — the brand colour at 35% reads as a broken button, not an unavailable one.

---

## After the first deploy

Read on a real letter, on a real phone, at `from-anna.vercel.app`.

**The bar says *from anna to you*, or *to* whoever the letter is for** — because a letter is addressed, and the three words of a generated slug were not an address, they were noise. That line is the whole centre of the bar and nothing else goes there. It reverses the rule that `recipient` never reaches the published page: the reader is the recipient, so their own name at the top tells them nothing they did not know, and it is the one detail that makes the page read as written *to* someone.

**No privacy line in the coda** — it described the analytics accurately, and on the page it read as a disclaimer at the end of a letter. The measurement is unchanged and still documented in `share/DECISIONS.md`.

**No passage numbers** — a letter read as running text reads better than a letter read as a numbered list, and a number beside every paragraph made it look like the second. They came out of `remark-scanned-page` too, in 0.2.0: they were this app's choice leaking into a package default.

**The photograph is scaled, never cropped** — `object-fit: cover` under a max-height cut the bottom off the sheet, and the bottom of a letter is where it is signed.

**The opening sits higher and centred** — it filled the whole first screen with the photo pushed to the right edge and past it, so the letter started below the fold and off to one side.

**A refused `/admin` renders the real 404 page** — the proxy answered with the right status and an empty body, which a browser paints as a blank white page. It now rewrites to a path that does not exist, so Next renders `not-found.tsx` with the 404 it already carries.

**The opening photograph drifts 48px at most, and the opening clips on both axes** — at 96px, with the two drawn sheets fanned behind it, it slid over the first line of the transcription. The words are the point of the page; a decoration never gets to cover them. Below 900px it does not drift at all, because in one column the photograph sits directly on top of the letter.

**The fonts are self-hosted through `next/font`** — the Google Fonts `@import` at the top of `globals.css` never reached the browser: the build dropped it, and every page had been set in Times New Roman, Georgia and Menlo since the first deploy. `next/font` downloads them at build time, serves them from this domain and does not depend on where a line sits in a stylesheet.

**No enlarged first letter** — the letterpress nod on the first letter read as a mistake rather than a flourish, most of all on a letter that opens with a date.

**No "unlisted link" in the opening** — the line under the heading says how many sheets and when; how the link was shared is not something the reader needs told on the page they are already reading.

**The editor preview draws the brackets and the highlight sweep** — it is `.letter-prose` and `data-revealed` on the same element, which the descendant selectors never matched, so a theme drew its label and no bracket there.

**On a phone the transcription shows first, the photograph one tap away** — the opening has just shown the photograph at full size, so starting the sheets on it again read as photo, photo, then the words. With no JavaScript there is no toggle, and the half that shows has to be the one you can read.

---

## The envelope

The second reversal, and a larger one than the first. The order of work is in
`REFACTOR.md` next door; what follows is why.

**The letter is opened, not scrolled** — because the sticky spread answered a
layout question correctly and the wrong question. Two columns moving past each
other is a good way to show a document; a letter is not a document, it is an
object somebody sent you. Everything below follows from that one sentence, and
each piece of it was built and deployed before it was replaced.

**Page-turn navigation comes back at every width** — because the deck is the
reading model now, not a fallback for the widths where sticky did not fit. It was
removed on desktop for a good reason that no longer applies.

**An inactive sheet is `display: none`, never a transform or an opacity** —
because an element that is merely moved or faded is still laid out, still
intersecting, and `reachedEnd` is an `IntersectionObserver`. Left laid out, every
open would record a full read, the table would fill with plausible rows and
nothing would error. The measurement is the reason the `View` table exists; a
quietly wrong one is worse than none.

**The photograph is the back of the sheet** — because it is the back of the
sheet. The front is what you can read and the back is what was written, and it is
one object either way. It also ends a split that had been managed rather than
solved: the photo/transcription toggle existed only below 900px, so the two
widths had been showing the same letter two different ways.

**The transcription stays the face that shows first, and stays in the server
HTML** — unchanged, and the one rule none of this gets to bend. An image of text
is invisible to a screen reader, so the transcription is the content. A toggle is
fine; a toggle whose readable half only exists after hydration is not.

**The deck's controls are round, which needs `.pill--icon`** — because an arrow
is not a word and the pill was built around a word. Every other button in the
project stays a pill. The arrows keep a real accessible name and the sheet change
is announced, because a control with no text is exactly the one that needs both.

**Opening the envelope is not measured** — because it would need a column and a
write, and `View` has five fields on purpose. *Opened the link* against *reached
the end* is the distinction that was missing, and it already exists.

**No sound (superseded by Tactile refinement below)** — because audio needs files in the repository, a control that
persists, nothing playing before an interaction, and `prefers-reduced-motion`
says nothing about it. It is a decision of its own and this is not it.

**The opening is CSS keyframes, and `motion` was removed from the project** —
because it was about 40KB of bundle for one sequence that three `@keyframes`
do perfectly well, on a page whose whole argument is that the words arrive
fast. The plan named it as the reason to finally use a dependency that had sat
unused since it was added; measured against what it would buy, the honest
answer was to take the dependency out instead. The lockfile was regenerated on
Linux and the change is four packages removed and nothing else moved.

CSS also gets the `prefers-reduced-motion` reset for free. The **handover** is
still asked in JavaScript — `openLetter()` checks the media query itself and
opens the letter with no sequence at all — because zeroing an animation would
otherwise leave the letter waiting on an `animationend` that never fires. That
is the shape of the rule: the reset covers how it looks, never when something
happens.

**The first opening animated a blank stand-in (superseded by Tactile refinement below)** — the real
sheet is a transcription of whatever height it turned out to be, and animating
it would mean compositing a few hundred words and a photograph while the
reader waits for exactly those words. The folded sheet that comes out of the
envelope is a drawn rectangle with two creases across it.

**The envelope is drawn, not loaded** — same as the fanned sheets it replaces and
the favicon: shapes in CSS and inline SVG, from the paper and ink tokens, costing
no request and theming with everything else. The stamp and the postmark are
generic. A real postal authority's stamp is somebody's artwork.

**Nothing from the letter goes on the envelope** — not a line, not the title. The
recipient's name is already on the published page and tells the reader nothing
they did not know; that is the whole of what it may say.

---

## The face on the front

> **Superseded (September 2026).** The site now ships two families: Newsreader
> for everything that is read, the envelope's address in its italic, and
> JetBrains Mono for every label and control. Caveat and Inter are gone. See
> *The writing desk* below. What follows is kept as the history of how it got
> there.

**The display face is Caveat, the same hand that writes the envelope** — because
a site about letters written by hand sets its headings in one. The address is at
400 and every heading at 700, and Caveat is variable, so that is one file.

It took two goes to get here, and both are worth keeping written down.

~~**Fraunces**~~ was chosen for `SOFT` and `WONK`, the axes that make it
irregular, and on warm paper at headline size it read as fussy rather than
hand-cut.

~~**Instrument Serif**~~ replaced it on an argument that was sound and produced
the wrong thing: `.display em` needs a real italic, and of the serif candidates
only Instrument Serif had one. It was correct and cold. **A defensible reason is
not the same as a good result** — a display face decides how a site sounds, and
that is not settled by a constraint check.

**The italic went with it, and colour carries the emphasis alone** — a hand has
no italic, so `font-style: italic` synthesises a slant on something already
slanted, which reads as a rendering fault rather than as emphasis. Those `em`
elements were already brand-coloured and are now only that. Colour is not
carrying meaning here, only emphasis a sighted reader gets as a bonus: the
sentences read the same without it, which is the test WCAG 1.4.1 asks.

**The weight fell at every step, and the last step dropped a whole family** —
Fraunces served 270KB of preloaded woff2 on every page. Instrument Serif plus
Caveat was 105KB. Caveat alone is 74.5KB, which is 30KB less than the step
before it: the envelope needed the hand anyway, so the second family was the
part that was optional. 196KB less than where this started. All measured from
clean builds, because a stale `.next` will happily report any of these numbers.

**`--font-hand` and `--font-display` stay separate names** — they resolve to the
same face today and mean different things: one is *written by a person*, the
other is *this is a heading*. They need not always agree.

**It comes from Google Fonts through `next/font`** — because the repository is
public and a commercial webfont cannot ship in it, which is the same constraint
that ruled out WindsorEF and Ano. And through `next/font` specifically, never an
`@import url(...)`: the build drops a remote import without a warning, which is
how every page on this site was set in Times New Roman for a full deploy.

## Tactile refinement

- The envelope starts sealed and tears open along a strip across the top because the opening needs a visible cause before the paper moves.
- The insert and envelope move independently because fading their shared parent made the paper disappear before it became the reading surface.
- The real sheet settles with transforms at full text opacity because continuity should not cost readable contrast.
- Home and letter share the opening controller because interruption, focus and reduced motion must behave identically.
- Closing returns the letter to its envelope without navigation because handling paper should be reversible and must not record another view.
- Short tear and paper-turn sounds are generated offline with ElevenLabs because tactile feedback needs no runtime API, SDK or exposed key.
- The sounds start on, and the reader can mute them persistently, because the tear is part of opening the letter; they only ever play after the reader's own click.
- Stack edges skew rather than rotate because a rotated decoration on a very long sheet creates horizontal overflow on phones.
- The envelope's focus ring is on "Open the letter", not around the whole invitation, because a ring as wide as the screen ran into the viewport edge on a phone and framed the drawing instead of the control.
- Focus returned to the envelope after a tap draws no ring, because focus moved by a script matches `:focus-visible` in some browsers whatever the last input was, and a phone showed a keyboard ring after every close.
- A pill's focus indicator is one paper halo and a brand edge, for `<a>` and `<button>` alike, because link pills drew the global outline and the pill ring together, with a gap between them.

## The writing desk

- Photos, writing and sharing are steps in one mounted workspace because changing tasks must not discard unsaved text or prepared images.
- The reference photograph sits beside the editor because correcting handwriting should not require scrolling between two sections.
- Visual marking uses numeric source positions added by the package after sanitizing because repeated words must map to their exact markdown occurrence without a second renderer or a looser sanitize schema.
- Saving remains explicit because saving a published letter changes what its recipient can read.
- Publishing waits for saved text and uploaded photos because the recipient should receive the version the author just reviewed.
- Analytics and destructive settings are secondary because the desk's primary task is making and finding letters.
- Newsreader replaces Caveat in editorial and admin headings because longer titles need a calmer, more legible shape.
- Two families, Newsreader and JetBrains Mono, and no third, because four faces on one page (a hand, a sans, a serif and a mono) read as four voices; the envelope and the wordmark use Newsreader's italic, and the admin's controls are the same mono pills as the public site.
- A disclosure's summary is a `.meta` label with a drawn chevron because the browser's triangle is a glyph from outside this design.
- The save bar and the mark toolbar are one sticky block whose height is measured, because two bars stuck at guessed offsets let the text show through between them and hid the top of the reference photograph behind the toolbar.
- On a phone the save bar is one line and the mark toolbar scrolls sideways, because the two sticky bars took about 40% of a 667px screen; the save bar's warning appears only when there is something unsaved.
- Choosing a reference sheet is a row of numbered pills, not a native `<select>`, because a letter has two or three sheets and a menu hides a three-way choice behind a click in the browser's style.

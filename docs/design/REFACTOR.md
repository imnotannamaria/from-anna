# design — the envelope refactor

The reading view becomes a letter you open. An envelope, addressed, that opens
into one sheet at a time; the photograph of the handwriting is the back of each
sheet. The typeface for headings changes with it.

This is a **reversal of phase 2** of `IMPLEMENTATION.md`, not an addition to it.
The sticky spread was built, deployed and read on a real letter, and it is being
replaced on purpose. `DECISIONS.md` next door is where the reversal gets written
down; this file is the order of work.

Each phase has a **Done when** list and a **Checks** block, the same shape as
`IMPLEMENTATION.md`. The checks are prompts to look, not boxes to tick.

**Phase 0 comes first and is not optional.** Half the comments in
`components/letter/letter-view.tsx` argue for the thing being removed. Code that
contradicts its own documentation is worse than either one alone.

---

## What this is replacing

| Now | After |
| --- | --- |
| Opening hero: a photograph tilted on two drawn sheets | A closed envelope, addressed |
| Every sheet stacked down one scroll | One sheet at a time, in a deck |
| Photograph `position: sticky` beside scrolling text | The photograph is the back of the sheet |
| Photo/transcription toggle in the bar, below 900px only | A tab on the sheet itself, at every width |
| `Sheet 1` `Sheet 2` `Sheet 3` jump buttons | Previous and next, with the count announced |
| Progress as a percentage of scroll | Progress as sheet *n* of *m* |
| Fraunces for every heading | Caveat, the same hand as the envelope |

---

## The four things that must survive it

These are load-bearing and each one breaks quietly.

**1. The whole transcription is in the server HTML.** Every sheet is in the DOM
at all times. Which one shows is a CSS decision, never a mount decision. This is
already how the current mobile toggle works and the rule does not change: an
image of text is invisible to a screen reader, so the transcription is the
content and it cannot wait for hydration to exist.

**2. With no JavaScript the letter still reads.** The envelope hides itself under
`@media (scripting: none)` and every sheet is visible, in order, with its
photograph. There is no control to reach, so there must be nothing to reach for.

**3. `reachedEnd` must not fire on arrival.** Today it is an
`IntersectionObserver` on the coda. If the inactive sheets stay laid out — moved
off with a transform, faded, or clipped — they are still intersecting, the
observer fires on mount, and every open is recorded as a full read. The
measurement that the `View` table exists for would be silently worthless. An
inactive sheet is `display: none`, and the coda is only in the tree once the last
sheet is reached.

**4. Nothing decorative paints over the letter.** The envelope, the stack edges
and the fold creases are behind or beside the words, never on them.

---

## Phase 0 — Write the decisions before the code

The reversal goes in `DECISIONS.md` in the shape the file already uses, one line
each, X because Y. Then phase 2 of `IMPLEMENTATION.md` is rewritten to describe
what the reading view actually is, with a note that it was replaced and why.

What gets a line:

- The sticky spread is gone, and page-turn navigation comes back at every width
- The letter opens from a closed envelope, on the letter route and on the home page
- The photograph is the back of the sheet, not a column beside it
- `.pill--icon`, a round variant, because the deck's controls are arrows
- Whatever phase 1 settles about the display face

**Done when**

- [x] `DECISIONS.md` carries the reversal and the new decisions, in its own format
- [x] Phase 2 of `IMPLEMENTATION.md` says it was replaced, and points here
- [x] `share/DECISIONS.md` no longer claims page-turn navigation is desktop-only
- [x] `CLAUDE.md` and `AGENTS.md` still match byte for byte

The comments inside `letter-view.tsx` that argue for the sticky spread are left
alone here. They describe code that still exists and is still true. They come out
in phase 3, with the code, which is the only way the two stay honest at once.

**Checks**

- **Reuse and duplication** — this file and `IMPLEMENTATION.md` must not both
  claim to describe the reading view. One of them is history and says so.

---

## Phase 1 — The display face

Fraunces is not working. It was chosen for `SOFT` and `WONK`, the axes that make
it irregular and hand-cut, and at headline size on paper it reads as fussy rather
than warm. It is also doing two different jobs badly: the home page headings,
which are documentation and want authority, and the letter's own voice, which
wants a hand.

The change is contained. Fraunces appears in exactly three places: the import in
`app/layout.tsx`, the `--font-display` token, and the `font-variation-settings`
block on `.display` that sets `SOFT` and `WONK`. Nothing else names it, and the
`.display` class is what every heading already uses.

**The split worth making:** documentation headings and letter chrome are not the
same voice. A display serif for the first, and a handwritten face for the
envelope's address and the sheet titles — which is what a real letter does, and
what the project is literally about.

Candidates, all on Google Fonts so `next/font` serves them from this domain, and
all open-licensed because the repository is public and a commercial webfont
cannot ship in it. That constraint already ruled out WindsorEF and Ano once.

> **Later reversed.** Caveat did not last either: the site now ships Newsreader
> and JetBrains Mono only, with Newsreader's italic on the envelope. See
> `DECISIONS.md`, *The writing desk*. The rest of this phase is kept as written.

**It took two goes, and the first one is the useful part of this phase.**

Instrument Serif was picked first, on a constraint: `.display em` is used in the
home title and the coda line, so the display face needs a real italic, and of
the serif candidates only Instrument Serif had one. That argument was correct and
the result was wrong — cold, and nothing to do with a site about handwriting.
**A defensible reason is not the same as a good result.** A display face decides
how a site sounds, and a constraint check does not settle that.

The answer was already in the project: **Caveat, the hand that writes the
envelope.** Headings at 700, the address at 400, and Caveat is variable, so both
are one file. Nothing else needed loading, and dropping the second family took
30KB off every page.

Five hands were rendered side by side at real heading size, on the real paper
colour, with the real headings — not judged from a specimen page:

| Face | Why not |
| --- | --- |
| **Caveat 700** | **Chosen.** Already loaded, variable, legible at display size |
| Caveat 400 | Too light to carry a heading |
| Kalam | Legible but wide; long headings wrap more |
| Satisfy | Connected script. The `f` descender collides with the line below |
| Caveat Brush | Good presence, but a second family for no gain |
| Shadows Into Light | Too thin on paper at heading size |

**No hand has an italic**, so `.display em` is brand colour alone now. A
synthesised oblique on something already slanted reads as a rendering fault.

**Done when**

- [x] Fraunces is gone from `app/layout.tsx`, `--font-display` and `.display`.
      So is Instrument Serif, which briefly replaced it
- [x] The chosen faces are `next/font`, never an `@import url(...)` — the build
      drops a remote import with no warning, which is how the whole site ran in
      Times New Roman for a deploy. Verified in the built stylesheet
- [x] Each face is a variable on `<html>` that the token names first, and
      everything outside the stylesheet uses the token, because `next/font`
      serves each face under a generated family name
- [x] Every fallback in the stack is a face that exists on the machine. `next/font` also generated a metric-matched `Instrument Serif Fallback` over Times New Roman
- [x] Exactly one face ships for display, and it is one the site already
      needed. `--font-hand` and `--font-display` stay separate names because
      they mean different things
- [x] The weight actually served went **down** at every step, measured from
      clean builds: Fraunces 270KB preloaded, Instrument Serif + Caveat 105KB,
      Caveat alone 74.5KB. 196KB less than where this started, and 30KB less
      than the middle step, because the last one dropped a whole family
- [x] `opengraph-image.tsx` still renders. It never named a family and uses
      numeric sizes already, so satori had nothing to resolve and nothing changed

**Checks**

- **Accessibility** — a display face is not a reading face. Nothing that only
  appears once, and no fact that appears nowhere else, may depend on it being
  easy to read.
- **Responsive** — every heading changes width, and the tracking and leading
  were measured for faces this is not. A hand needs no negative tracking and
  swings its ascenders and descenders further than a serif, so `-0.022em` and
  a 1.04 line-height both had to go. Re-look, do not re-use.
- **Performance** — a variable font is one file; a three-weight static family is
  three. Count what is actually served, not what is imported.
- **What review cannot see** — this phase changes rendered size, spacing and
  wrapping everywhere and nothing else. `lint` and `tsc` say nothing about it.
  The list to look at: home hero, every `home-h2`, the coda line, the 404 and
  error titles, the admin list title, and the sign-in page.

---

## Phase 2 — The envelope

A closed envelope, centred, addressed `to {recipient}` or `to you`, with the date
it was sent. Drawn in CSS and inline SVG with the paper and ink tokens, not
loaded as an image: it is the same reasoning as the fanned sheets behind the
current hero and the favicon, which is drawn shapes and no letterform.

It replaces `components/letter/letter-hero.tsx` entirely, and `HERO_DRIFT`, the
`--hero-drift` token and the scroll handler that feeds it go with it.

**Nothing from the letter goes on the envelope.** Not a line, not the title. The
recipient's name is already on the published page and tells the reader nothing
they did not know. A postmark and a stamp are drawn, generic, and not a copy of
anyone's actual stamp design.

**Done when**

- [x] The envelope is in the server HTML and the letter is complete underneath it. Checked against the served HTML: both sheets, both transcriptions, every photo and the coda, with no `data-enhanced` on the root
- [x] **Done differently, and better.** `@media (scripting: none)` only covers
      a reader who turned JavaScript off; it says nothing about a bundle that
      404s or one still parsing. Every rule that hides anything is instead
      behind `data-enhanced`, set on mount, so all three of those paths get the
      envelope as a header with the whole letter below it. Verified in a real
      browser with scripting disabled
- [x] There is no flash of the open letter before hydration: the envelope stage is `100svh`, so the sheets start below the fold either way
- [x] `LetterHero`, `HERO_DRIFT`, `--hero-drift` and the drift scroll handler
      are deleted, not left unused. `.hero--loading` went too — it turned out
      to be dead CSS that nothing had referenced for some time
- [x] Opening the envelope is a real control with a real accessible name. It ended up a link rather than a button, so that it works on the no-script path too
- [x] No text of the letter appears on the envelope, in the metadata, or in the
      OG image. The `<head>` does not even carry the recipient
- [x] The letter route is still `noindex` and still records one view per session. Confirmed against the database that this phase's testing recorded nothing

**Checks**

- **Privacy** — a link preview caches whatever the head and the OG image carry.
  Neither changes in this phase and neither may start carrying the letter.
- **Accessibility** — the stamps and the postmark are decoration and need
  `aria-hidden`, or a screen reader reads out a picture of a stamp. The address
  is real text, not an image of text.
- **Responsive** — reason about 375px specifically. A landscape envelope at 375px
  leaves roughly 343px of width; the stamps shrink or they go.
- **Loading and error states** — the route reads Postgres. An envelope drawn over
  a letter that failed to load is a lie, so the error state stays the error page.

---

## Phase 3 — The deck

One sheet at a time. Previous and next as round `.pill--icon` buttons, disabled
at the ends rather than hidden, so the control does not move. Arrow keys work.
The sheet that leaves translates and rotates slightly, the way a sheet is pulled
off the top of a pile; the edges of the sheets underneath stay visible.

`.sheet-nav` and its `Sheet 1 / Sheet 2` buttons come out. The `showing` state
and the toggle in `ReaderBar` come out with phase 4. The progress bar stops being
a percentage of scroll and becomes the position in the deck.

A transcription longer than the screen makes the sheet taller and the page
scrolls. The sheet does not scroll inside itself: that hides text below a fold
with no affordance, and it creates a scroll container, which is the thing that
kills `position: sticky` silently everywhere else in this project.

**Done when**

- [x] Opening a letter and not paging records **no** `reached_end` row. Verified
      against the database in both directions: open and sit still counts the
      open and leaves `reached_end` alone; open, turn to the last sheet and
      scroll to the coda sets it. **It was wrong first**, and the wrong version
      wrote a row saying a reader who never left sheet one had read to the end.
      That is the whole reason this check is worded as *verified*
- [x] An inactive sheet is `display: none`. Not opacity, not a transform, not
      `visibility`
- [x] The passage reveal observer and the highlight sweep run for the sheet being
      read, and do not all fire at once on mount. Both are keyed on the active
      sheet, because a sheet still in the deck measures as zeros
- [x] `IntersectionObserver` is never asked to watch a zero-size element
- [x] The sheet change is announced: an `aria-live="polite"` region saying which
      sheet of how many
- [x] Focus is not lost on a turn. When an arrow disables itself the focus moves
      to the other one. **This was wrong first too**: moving the focus inside
      the click handler runs before React has disabled the button, so the
      browser took it back and then dropped it to `<body>`. The catch belongs
      in an effect, after the render
- [x] Both buttons are keyboard reachable and arrow keys do the same thing. Verified: right, left, and left again at the start, which stays put
- [x] `prefers-reduced-motion` removes the turn and leaves the change instant.
      Nothing in this phase animates, so there is nothing yet to ask — the turn
      gets its motion in phase 5, and that is where the question becomes real
- [x] A one-sheet letter shows no controls and no empty deck
- [x] The coda is reachable only from the last sheet
- [x] No comment left in the codebase argues for the sticky spread as the
      design. Done in phase 4 with the code it described

**Checks**

- **Bugs** — this is where the `reachedEnd` failure lives. It produces no error,
  no warning and a full table of plausible rows. Check it first and check it in
  the database.
- **Accessibility** — a page change with no announcement is a screen reader
  reading the same heading twice and nothing else. Real buttons, real names.
- **Performance** — the moving sheet holds real text. Animate a transform, put
  `will-change` on the one sheet that is moving, and take it off after.
- **Responsive** — at 375px a portrait sheet leaves about 343px of prose. Check
  where the highlights wrap, because that is where the `box-decoration-break`
  padding bug shows.
- **SEO** — the content is in the server HTML and stays there. Nothing grows a
  sliced string or mounts on a timer.

---

## Phase 4 — The back of the sheet

The sheet has two faces. The front is the transcription on paper. The back is the
photograph of that same sheet. One object: the front is what you can read, the
back is what was written. A tab on the sheet turns it over.

Both faces are in the DOM. The transcription is the default and is what the
server renders; the photograph is the same `ScannedPhoto` that exists today, with
its real required `alt`, appearing once. With no JavaScript both are visible, the
transcription first.

This replaces the `showing` state and the `reader-toggle` in `ReaderBar`, which
existed only below 900px. Now it is per sheet and at every width.

**A bug this phase surfaced.** With the envelope gone from the top of the
document, the sheet became the first thing on the page — and it ran under the
fixed bar. `scroll-margin-top` covers being jumped to, not being landed on, so
the sheet now clears the bar itself.

**Done when**

- [x] The transcription is in the server HTML and is the face that shows by
      default, at every width. Both faces are in the served HTML, front before
      back, with no `data-enhanced` on the root
- [x] `alt` on every photograph is real and required, and no photograph is
      described twice on one page. There is one `<img>` per sheet now — the
      decorative duplicate went with the hero
- [x] The photograph is served through `srcset`. Measured from `currentSrc`:
      a 375px viewport takes the 1200px screen copy, a 1280px one takes the
      2400px archive copy. This needed a change in the package — `sizes` was
      hardcoded to `(min-width: 900px) 50vw`, which described the two-column
      spread that no longer exists. It is a prop now, defaulting to the old
      string, and the app states its real layout (0.4.0)
- [x] Photographs below the first sheet stay lazy, inside a fixed aspect
      container, so turning a sheet shifts no layout
- [x] The turn is an instant swap in this phase, which is also what
      `prefers-reduced-motion` will get. The motion is phase 5's
- [x] The hidden face is properly hidden from assistive tech, and the shown
      face is properly in it. `display: none` on both sides, which is the same
      rule everything else on this page follows and for the same reason
- [x] The photograph is scaled, never cropped. The bottom of a letter is where
      it is signed

**Checks**

- **Accessibility** — the rule that cannot bend: the transcription may never be
  the half of a toggle that only exists after hydration.
- **Responsive** — a portrait photograph at 343px wide is the most expensive
  assumption in this project. If the handwriting is not legible there, the back
  of the sheet is decoration and the zoom is the real answer.
- **Performance** — a flip forces a compositing layer on an element holding a
  full-size photograph and four hundred words. Measure it on a phone.
- **Loading** — the blob is private and the photograph comes through an
  authenticated route. A face that turns to a blank rectangle while the image
  loads is worse than no turn. Preload the active sheet's photograph.

---

## Phase 5 — The opening

**The first implementation below is superseded by `IMPLEMENTATION.md` phase 7:**
the shared timeline now tears, extracts and unfolds, supports closing, and plays
optional static paper sounds.

Everything above works before this phase. This is the phase that makes it move,
and the whole of it is removable without breaking anything.

Three beats, about 800ms end to end: the sheet slides up out of the envelope,
still folded; the envelope drops away; the sheet unfolds to portrait, and the
fold creases stay on the paper afterwards. Closing is the same in reverse.

~~`motion` is already a dependency and is used nowhere. This is what it is for.~~
**It went the other way.** Weighed against three `@keyframes`, it was about 40KB
of bundle for one sequence, so the sequence is CSS and the dependency came out
of the project. The handover is still asked in JavaScript, because a zeroed
animation never fires `animationend`. See `DECISIONS.md`.

No sound. Audio needs files in the repository, a persistent control, nothing
playing before an interaction, and `prefers-reduced-motion` does not cover it.
That is its own decision and it is not this one.

**Two bugs this phase surfaced, both in the drawing rather than the motion.**
The folded sheet had no positioned ancestor, so it spread across the page and
swallowed the click meant for the button underneath it — decoration now takes
no pointer events at all. And giving the drawing a `z-index` without giving the
address one put the SVG over the writing: the envelope went out addressed to
nobody.

**Done when**

- [x] Under `prefers-reduced-motion` the envelope opens with no motion at all
      and the letter is simply there. Measured: open in ~50ms, `data-opening`
      never set
- [x] Nothing to interrupt: there is no close control, so the sequence runs
      once and hands over. **If a close is ever added this comes back**, and it
      is the thing to test first
- [x] Nothing in the sequence animates opacity on anything carrying words. What
      fades is the envelope and the caption; what moves is a blank stand-in
- [x] Nothing the animation draws can reach the text. The stage clips on both
      axes, with `clip` rather than `hidden`
- [x] Only transforms and one opacity. No animated width, height or margin
- [x] The sequence is 700ms and the letter is readable at the end of it, which
      is the second answer. Measured rather than assumed

**Checks**

- **Accessibility** — an entrance that fades text in from faint is below AA for
  the whole transition. That is why the passage reveal moves `translateY` and
  never opacity, and the same applies here.
- **Performance** — the unfold scales an element containing real text. Check it
  on a phone, not on a laptop.
- **Bugs** — a sequence that owns the mounted state of the letter will eventually
  get out of step with it. The animation follows the state; it does not hold it.

---

## Phase 6 — The front door

The home page gets the same envelope, with the existing `OPENING` note inside it
as the letter. Everything below stays what it is: documentation that scrolls,
rendered by the package.

The home page is the documentation and that decision stands. The envelope is the
opening, not a new shape for the whole page.

**A bug this phase surfaced.** The note's own entrance — `lay-down`, with a
620ms delay — was written as a page-load animation, back when the card was
simply there. Now it arrives because somebody opened an envelope, and the
opening *is* the entrance: left alone, the delay read as a click that did
nothing. It is switched off wherever the envelope exists.

**Done when**

- [x] The note inside is the same markdown, rendered by the same package, the
      same sanitize schema and the same stylesheet a real letter goes through
- [x] It is not `aria-hidden`: those words appear nowhere else on the site
- [x] Everything below the opening is unchanged and still scrolls
- [x] Nothing on the home page implies an account, a sign-in or a sign-up
- [x] The home page is the only page on the site that is indexable, and still is
- [x] One envelope component, imported twice. Not a second copy with different
      paper

**Checks**

- **Reuse and duplication** — the second copy is a warning and the third is a
  bug. If the home envelope and the letter envelope drift apart, say so here.
- **SEO** — the home page is indexed. Its content stays in the server HTML,
  behind an envelope or not.

---

## Phase 7 — The pass that only a person can do

**Most of it turned out to be checkable, and that was not the plan.** The list
below was written as things only eyes could check. Rendering the pages in a real
browser turned most of them into assertions — and two of the bugs in this refactor were
found that way and would not have been found by reading the diff: the
`reached_end` that fired on arrival, and the focus that dropped to `<body>`.

What was checked in a real browser, on two letters, at 1280px and 375px: no sideways scroll
closed, open, and on the photograph; a turn moves the sheet and returns it to
the words; a one-sheet letter renders no deck controls; reduced motion opens
with no sequence; and with JavaScript off, both sheets, every transcription,
every photograph and the coda are all present with no turn control rendered.

**What is still yours.** Whether any of it looks right. A script can say the
handwriting is on screen at 375px and cannot say it is legible, and legibility
at 375px is the most expensive assumption in this project.

`lint` and `tsc` are green through all of this and say almost nothing, because
what changed is rendered size, spacing, wrapping and motion.

The list, concretely:

- **375px, in the device toolbar.** Chrome will not resize below about 550px by
  dragging, so a window drag is not this check. Envelope, deck controls, a
  portrait sheet, a turned sheet showing the photograph, and a highlight that
  wraps.
- **Every heading, after the font change.** Home hero, each `home-h2`, the coda
  line, the 404 title, the error title, the admin list, the sign-in page.
- **`prefers-reduced-motion` on**, through the whole flow: open, turn, turn back,
  see the photograph, close.
- **JavaScript off**, through the whole letter: envelope gone, every sheet
  present, every photograph present, transcription first.
- **A three-sheet letter and a one-sheet letter.** The second is where an empty
  deck and a stranded control show up.
- **A long transcription.** Longer than one screen at 375px, which is where the
  decision that the sheet grows gets tested.

Then `npm run lint` and `npx tsc --noEmit`, from a clean tree, because a local
typecheck passes on a stale `.next` long after it would fail in CI.

---

## Open

- **Sound.** Added in `IMPLEMENTATION.md` phase 7, with static assets and a
  persistent mute control.
- **Whether opening the envelope is worth measuring.** It would tell *opened the
  link* apart from *opened the letter*, which is a real distinction. It is also a
  new column and a new write, and `View` has stayed small on purpose. Not in this
  refactor.

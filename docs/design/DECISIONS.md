# design — decisions

Decision log. X because Y. Closed on 2026-09-09, from a design comp reviewed against what already existed.

---

**The photograph goes sticky beside a scrolling transcription, on desktop** — because a portrait photo and its transcription were fighting for the same screen, and pinning one while the other moves reads like sitting with the letter instead of paging through a document.

**Page-turn navigation is removed on desktop and kept on mobile** — because the sticky sections replace it where they exist, and nothing replaces it where they don't.

**Each photographed sheet becomes its own sticky section, stacked down the scroll** — because a letter is read in the order it was written, and stacking preserves that without asking anyone to find a control.

**Mobile keeps the toggle that already exists: photo first, one tap to the transcription** — because neither half survives being half a phone wide, and the handwriting is what someone opened the link to see.

**The passage-following zoom is desktop only** — because it needs two columns to make sense, and a phone has one.

**Crop regions are optional, and a passage without one falls back to a proportional band** — because that makes the cheap version the default and hand-authoring an upgrade per page, rather than a tax on every letter. Cost per letter is the complaint this project started from, so a feature that adds work to every single one is a feature that will stop being used.

It also removes a whole failure mode: a derived region can be wrong, and there is no derivation.

**Regions live in the markdown as `:::passage{at="0.19 0.31"}`, not in a table** — because a table of offsets into mutable text breaks the first time a comma moves, which is the same reasoning that kept highlights out of the database. The `.md` file keeps carrying everything.

**The `:::passage` directive belongs to `remark-scanned-page`, not the app** — because the package is described as "a scanned page with a synchronised transcription", and a region per passage *is* the synchronisation.

**The stored image cap goes from 1500px to 2400px, and the maximum zoom from 1.75 to 1.5** — because measurement said so, not taste. The sticky photo occupies 616px at 1440 and 728px at 1920, so on a retina screen the old 1125px source covered **91% at zoom 1** — already slightly soft before any zoom at all — and 52% at the comp's 1.75×. At 2400px and 1.5× it lands at 97% on 1440 retina.

Choosing the crop by hand decides *where* to zoom. It does not add detail. The two problems are independent and both had to be answered.

This partly reverses the decision in `photo-transcription/DECISIONS.md` that capped images at 1500px. That reasoning still holds — one stored version, and it is the one people see — but the zoom is a second consumer of the same file, and it did not exist when the cap was chosen.

**Existing photos are re-uploaded rather than migrated** — because there is exactly one test letter, and reprocessing would need the original, which is deliberately not kept.

**The passage reveal degrades to fully visible with no JavaScript and under `prefers-reduced-motion`** — because the comp starts unread passages at 12% opacity, which is unreadable by any measure, and a reader whose observer never fires would be left with a letter that looks blank. The highlight sweep already solves this shape of problem: the finished state is the default and JavaScript adds the animation.

**The letter is named by the three words of its slug, with no number** — `AUTUMN · BUREAU · COVE`. Numbering tells a reader how many letters exist and where theirs sits in the sequence. The slug words are already the letter's identity, they are not sequential, and they tie the URL to the page for free.

**The reader is shown their own reading progress** — because the coda says *counted once, nothing else is stored* out loud, and showing the progress makes that disclosure concrete rather than a claim. It turns the measurement from something hidden into something admitted.

**The privacy line is literal and has to stay true** — one row per open, deduplicated per session, no IP. If the measurement ever changes, that sentence changes with it.

**`WRITE BACK` is a `mailto:` for now, with the address in an env var** — because a form is more work than the first version needs. The address is not in the repository, and an address on a public page gets harvested; if that becomes a problem the swap is to a form.

**The legend filter is momentary and does not go in the URL** — because it is a way of looking at a letter, not a way of arriving at one.

**The legend chips read the highlight colours from the tokens** — because `lib/theme/palette.test.ts` measures those tokens against the ink in both modes, and a repeated hex, which is what the comp does, is a value that test no longer protects.

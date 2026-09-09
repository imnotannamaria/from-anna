# markdown-hightlight — decisions

Decision log. X because Y. Closed on 2026-09-09.

---

**Highlights live inside the markdown as directives** — because storing plain text plus offsets (`start: 142, end: 168`) breaks every later offset the moment a comma is fixed, and a transcription of handwriting exists to be corrected. Inside the markdown, the file carries everything: no join, no sync, still readable and diffable.

**Syntax is `:mark[text]{c=important}` inline and `:::theme{label="..."}` for blocks** — because `:hl` was too cryptic for a public API.

**This feature is the npm package; the other two are app code** — because a highlight layer with an accessible fallback is the part that generalizes. Anyone publishing a journal, a sketchbook, class notes or a zine has the same problem. Photographing a page and calling a vision model does not generalize into a library.

**The package ships the plugin, the CSS and the React component** — because the plugin alone emits `<mark data-c>` with no colour, so every consumer rewrites the same stylesheet, including the two rules that break silently (`box-decoration-break`, `color: inherit`).

**The package defines no tag vocabulary, only the mechanism and three colour slots** — because tag names belong to whoever installs it.

**The app uses `important`, `note`, `ask`** — because they're generic and describe the reading, not the subject.

**Three colours, tuned against the entrepta julia theme** — because past three, coloured highlighting stops separating anything.

The fills are not entrepta tokens: entrepta's julia preset only overrides the brand tokens, and nothing in it is meant to sit *behind* body text. The palette is defined in `app/globals.css` and every value is measured against `--fg-primary`, in both modes, by a test that parses the stylesheet.

**Light-mode fills are more saturated than the first attempt** — because a pale wash that passes text contrast can still be invisible against a near-white page. `#fbe7b6` on `#fafafa` was 1.17:1, so the highlight simply did not read as one. The test now checks the fill against the canvas as well as the text against the fill.

**An unknown tag renders in a neutral default colour and warns in the dev console** — because a typo mid-letter should not be a build failure.

**Every tag carries a colour *and* its own underline style: solid, wavy, dotted** — because colour alone carrying meaning fails WCAG 1.4.1, and a legend on the page was rejected as clutter. The underline restores the distinction without adding a word.

**Dark mode is in v1** — because retrofitting a dark theme onto a colour-highlight palette means rebuilding the palette.

**AA contrast is an automated test** — because there are few pairs, they change with the tokens, and a broken pair is invisible until someone looks. Text is measured against the highlight colour, not the page background.

**`color: inherit` on `mark`** — because the user agent applies `color: black`, which puts black text on a light fill in dark mode.

**`box-decoration-break: clone`** — because without it a highlight crossing a line break is padded only at the start and end, and most highlights wrap.

**On narrow screens the side bracket becomes a label above the block** — because there is no side margin at 375px.

**`:mark` nests inside `:::theme`; `:::theme` does not nest inside itself** — because a highlight inside a themed block is the normal case, and a bracket inside a bracket can't be drawn cleanly.

**The sanitize schema allows `mark`, `aside`, links, images, headings, lists, code, emphasis, paragraphs and horizontal rules, and blocks scripts, styles, iframes and `on*` handlers** — because the schema is what holds when the package runs on content its author didn't write.

**The editor is a textarea with a live preview beside it, plus a shortcut that wraps the selection** — because typing the directive by hand every time is the friction that stops people highlighting at all.

**`hProperties` keys are camelCase (`dataC`), not `data-c`** — because `rehype-sanitize` matches its schema against hast property names. A dashed key matches nothing and the attribute is stripped, and the stringifier renders both spellings identically, so the bug is invisible until sanitizing runs. Cost an hour; it is now a test.

**A `:mark` with no label renders as the literal text `:mark`** — because `:mark` alone is valid directive syntax and would otherwise emit an empty `<mark>`: present in the DOM, invisible on screen, and a typo nobody would ever catch. The preview exists to show mistakes.

**A malformed directive is left as text by `remark-directive`** — because the side-by-side preview already shows it, so no custom validation is needed.

**Without entrepta, the colour tokens ship empty** — because baking in defaults drags one project's palette into someone else's.

---

**The package is an npm workspace in this repo, not a separate one** — because the app importing it by name is what makes a duplicate pipeline impossible. Two repos would mean publishing and bumping a dependency every time the plugin changes, just to test it against the only real consumer.

**In the workspace, `exports` points at the TypeScript source** — because a build step between editing the package and seeing it in the app is friction that gets skipped. `publishConfig` swaps to `dist/` at publish time, so the tarball still ships compiled JS.

**The name is `remark-scanned-page`** — because the package is plugin *and* CSS *and* component, and `remark-mark-directive` would have described only the first. `scanned page` is also what the second plausible user is searching for.

**`styles/palette.css` is one neutral grey for every tag** — because the underline styles already separate them, so the accessible baseline works on install and colour stays an explicit choice rather than an inherited one.

---

## Open

**Installing into a blank Next app.** The one check that would catch a wrong `exports` map, still unverified.

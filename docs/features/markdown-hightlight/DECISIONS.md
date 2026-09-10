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

**The package gained a second container directive, `:::passage`** — because a transcription needs a unit bigger than a paragraph and smaller than a sheet: one entry in the reveal, one thing a reader arrives at.

**0.2.0 removed the passage numbers and the gutter they sat in** — they shipped in 0.1.0 as a CSS counter, and they were one app's design decision leaking into a package default. A letter read as running text reads better than one read as a numbered list.

It shipped with an `at` attribute naming the band of the sheet the words were written on, which drove a photograph that zoomed to follow the reading. That came back out — see `design/DECISIONS.md` — and with it went `parseRegion`, `bandFor` and the region picker. **The grouping was the half worth keeping.**

**`:::passage` emits a bare `<div>`, and `div` is in the sanitize schema with no attributes allowed on it at all** — because it needs an element and every other allowed tag already means something. `remark-rehype` drops raw HTML from the source, so the only `div` that reaches the schema is the one this plugin emits, and there is nothing on it to get wrong.

**`:::passage` nests inside neither itself nor `:::theme`** — the inner one unwraps and its words are kept, same as a nested theme. Two gutter numbers on one run of text is not a layout anyone designed.

**`:mark` nests inside `:::theme`; `:::theme` does not nest inside itself** — because a highlight inside a themed block is the normal case, and a bracket inside a bracket can't be drawn cleanly.

**The sanitize schema allows `mark`, `aside`, links, images, headings, lists, code, emphasis, paragraphs and horizontal rules, and blocks scripts, styles, iframes and `on*` handlers** — because the schema is what holds when the package runs on content its author didn't write.

**The editor is a textarea with a live preview beside it, plus a shortcut that wraps the selection** — because typing the directive by hand every time is the friction that stops people highlighting at all.

**`hProperties` keys are camelCase (`dataC`), not `data-c`** — because `rehype-sanitize` matches its schema against hast property names. A dashed key matches nothing and the attribute is stripped, and the stringifier renders both spellings identically, so the bug is invisible until sanitizing runs. Cost an hour; it is now a test.

**A `:mark` with no label renders as the literal text `:mark`** — because `:mark` alone is valid directive syntax and would otherwise emit an empty `<mark>`: present in the DOM, invisible on screen, and a typo nobody would ever catch. The preview exists to show mistakes.

**A malformed directive is left as text by `remark-directive`** — because the side-by-side preview already shows it, so no custom validation is needed.

**Without entrepta, the colour tokens ship empty** — because baking in defaults drags one project's palette into someone else's.

---

**The package is an npm workspace in this repo, not a separate one** — because the app importing it by name is what makes a duplicate pipeline impossible. Two repos would mean publishing and bumping a dependency every time the plugin changes, just to test it against the only real consumer.

~~**In the workspace, `exports` points at the TypeScript source, and `publishConfig` swaps to `dist/` at publish time.**~~ **That was never true.** npm treats `publishConfig` as a bag of *config options* — registry, access, tag. It does not rewrite `main` or `exports`, and npm 11 warns about them as unknown keys. So the tarball shipped `dist/` with its entry pointing at `src/index.ts`, which `files` deliberately excluded: **every install would have failed with `ERR_MODULE_NOT_FOUND`.**

**`exports` points at `dist/`, and `predev` / `prebuild` / `pretest` build the package first** — the friction the original decision was avoiding, paid in a second of `tsc` rather than in a broken package. A fresh clone runs `npm run dev` and it builds on the way.

**The name is `remark-scanned-page`** — because the package is plugin *and* CSS *and* component, and `remark-mark-directive` would have described only the first. `scanned page` is also what the second plausible user is searching for.

**`styles/palette.css` is one neutral grey for every tag** — because the underline styles already separate them, so the accessible baseline works on install and colour stays an explicit choice rather than an inherited one.

---

**Relative imports inside the package carry a `.js` extension, and the build resolves as `NodeNext`** — because the package is ESM and Node ESM refuses an extensionless specifier. TypeScript emitted `from './render'` verbatim, which every bundler resolves and no Node consumer can. `moduleResolution: "bundler"` had been letting it through; `NodeNext` is what a published ESM package is actually resolved by, so it is what should be checking.

Two bugs, one of them invisible from inside this repo: Next, Turbopack and vitest all resolve extensionless specifiers, so nothing here could ever have failed on it.

---

## Closed

**Installed from a tarball into a clean project and exercised.** `npm pack`, `npm i ./remark-scanned-page-0.1.0.tgz` in an empty directory, then import it and run it. It failed twice before it passed, which is exactly why the check was on the list.

**Releasing is driven by the version in `package.json`, not by changesets** — because changesets exists to coordinate versions across many packages and a "Version Packages" pull request, and there is one package here. Bumping a number and pushing is the whole ceremony this repo needs; a release bot would be more machinery than the thing it releases.

**The release workflow installs the tarball into an empty project before it publishes** — because that is the only check that catches a broken package, and it caught two. Everything inside this repository resolves specifiers that Node refuses, so nothing here can fail the way a consumer does.

**Trusted publishing rather than an `NPM_TOKEN` secret** — a long-lived credential in repository settings is a credential that outlives the reason it was created. OIDC mints one for the job and it expires with it.

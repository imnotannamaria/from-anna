# markdown-hightlight — implementation

Discovery is closed. The reasoning behind each choice is in `DECISIONS.md` next door.

This is the feature that becomes an **npm package**. The other two are app code.

Each phase has a **Done when** list and a **Checks** block. The checks are prompts to look, not boxes to tick.

---

## The syntax

Inline, marks a passage:

```md
This has :mark[honestly been one of the best weeks]{c=important} I've had.
```

Block, groups paragraphs under a theme:

```md
:::theme{label="what I actually built"}
Text of the block, which can hold :mark[a highlight]{c=note} inside it.
:::
```

`:mark` nests inside `:::theme`. `:::theme` does not nest inside itself.

---

## Phase 1 — The plugin

```ts
unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(remarkMarkDirective)      // :mark → <mark data-c>, :::theme → <aside>
  .use(remarkRehype)
  .use(rehypeSanitize, schema)
  .use(rehypeStringify)
```

Visit `textDirective` nodes named `mark`, set `data.hName = 'mark'` and `data.hProperties = { 'data-c': node.attributes.c }`. For `containerDirective` nodes named `theme`, emit an `aside` carrying the label.

A malformed directive is already left as text by `remark-directive`. No custom validation.

**Done when**

- [x] `:mark[x]{c=important}` renders `<mark data-c="important">`
- [x] `:::theme{label="..."}` renders an `aside` with the label, and an `aria-label` so the grouping reaches assistive tech
- [x] A highlight inside a themed block works
- [x] A nested `:::theme` is unwrapped — the second bracket goes, the words stay
- [x] A labelless `:mark` comes out as visible text rather than an empty `<mark>`
- [x] An attribute-less `:mark[x]` falls back to a default tag

**Watch out:** `hProperties` keys must be camelCase (`dataC`), because that is what `rehype-sanitize` matches its schema against. `'data-c'` is stripped, and the HTML looks identical until you sanitize.

**Checks**

- **Bugs** — an attribute-less `:mark[x]` is a real input, not an edge case. Decide what `data-c` becomes.
- **Performance** — one tree walk, not one per tag.

---

## Phase 2 — The sanitize schema

Allow: `mark` with `data-c`, `aside`, links, images, headings, lists, code, emphasis, paragraphs, horizontal rules.

Block: scripts, styles, iframes, every `on*` handler.

**Done when**

- [x] `<script>` in the source never reaches the output
- [x] `onclick` and `onerror` are stripped
- [x] `data-c` survives sanitizing
- [x] A `javascript:` href is stripped, and the link text is kept
- [x] `href` is limited to `https:` and `mailto:`, `src` to `https:`
- [x] There is a test per line above

**Checks**

- **Security** — this is the phase where a mistake is exploitable. The markdown is mine today, but the package will run on content its author didn't write, and the transcription itself is model output. Restrict image and link protocols to `https:`, not just the tag names.

---

## Phase 3 — CSS and tokens

```css
mark[data-c] {
  background: var(--hl);
  padding: 0.15em 0.2em;
  border-radius: 2px;
  color: inherit;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}
```

`color: inherit` and `box-decoration-break: clone` are not taste. Without the first, the user agent's `color: black` puts black text on a light fill in dark mode. Without the second, a highlight crossing a line break is padded only at the start and the end, and most highlights wrap.

Every tag gets a colour **and** its own underline style — solid, wavy, dotted.

Three tags, from the entrepta julia tokens. An unknown tag falls back to a neutral colour and warns in the dev console. It never breaks the build.

Without entrepta, the tokens ship empty and whoever installs the package fills them in.

Colours, measured not guessed. Text is `--fg-primary`, which is `#fafafa` in dark and `#09090b` in light — so the two sets are genuinely different colours, not one hue at two opacities.

| tag | dark | light | underline |
| --- | --- | --- | --- |
| `important` | `#7d2947` | `#f9bfd4` | solid |
| `note` | `#6b4a12` | `#f8dc95` | dotted |
| `ask` | `#3d3a7a` | `#cdc7f8` | wavy |
| unknown | `#3f3f46` | `#dcdce0` | — |

**Done when**

- [x] AA contrast passes for every tag in both modes, measured against the **highlight fill** rather than the canvas — automated, and it parses `globals.css` rather than a copy of the values
- [x] `box-decoration-break: clone` and `color: inherit` are asserted, not just written
- [x] Each tag has its own underline style, asserted as three distinct values
- [x] Every fill is visible against the canvas
- [x] An unknown tag renders neutral and warns

`important` and `ask` land within 0.01 of each other in relative luminance, so in greyscale they are the same swatch. The underline style is what actually separates them, and the test is what stops someone collapsing it back to colour alone.

**Checks**

- **Accessibility** — WCAG 1.4.1: colour alone must not carry the meaning, which is what the underline styles are for. Verify in greyscale, not by intention.
- **Theme reactivity** — no hardcoded hex. Every colour comes from a token, so a theme switch moves all three.
- **Responsive** — highlights wrap differently at 375px than on a desktop. That is where the padding bug shows.

---

## Phase 4 — The scanned-page component

The photo and the rendered transcription. The image is the visual layer; the text is the actual content. Screen readers read the transcription.

**Done when**

- [x] The image has real `alt`, and the transcription is in the DOM regardless of whether the image loads
- [x] Nothing depends on JavaScript to render the text — it is a server component, and the markdown is rendered before the HTML ships
- [x] The image reserves its space from known dimensions, via `width`/`height` plus `aspect-ratio`
- [x] Both halves are always in the DOM; CSS decides which is on screen, never hydration
- [x] Only the first page loads eagerly

`dangerouslySetInnerHTML` is used, and it is safe here for one reason only: the HTML came out of the sanitize schema in phase 2. If that schema is ever loosened, this is the call site that becomes a hole.

**Checks**

- **Accessibility** — an image of text is invisible to a screen reader. The transcription is not a nicety here, it is the content. It must not be hidden behind a tab that only exists after hydration.
- **SEO** — the text ships in the server HTML. Anything that gates mount on a timer, or grows a sliced string, ships an empty element.
- **Performance** — the image is lazy below the fold and has a fixed aspect container, so there is no layout shift.

---

## Phase 5 — Editor with preview

Textarea plus a live preview beside it.

A shortcut wraps the selection in `:mark[...]{c=}` and leaves the cursor inside `c=`. Typing the directive by hand every time is the friction that stops people highlighting at all.

**Done when**

- [x] Selecting text and pressing a tag button wraps it, keeping the words selected inside the brackets
- [x] With nothing selected, an empty directive is inserted and the caret lands between the brackets — decided, not discovered
- [x] The preview parses behind a 250ms delay, not on every keystroke
- [x] A malformed directive is visible in the preview, which is why there is no separate validation
- [x] Wrapping a selection that already contains a highlight is refused with a message, rather than producing markdown that does not parse
- [x] The shortcut is ⌘⇧H, and the three tag buttons do the same thing, so it is never the only route

The wrapping logic is in `lib/markdown/wrap-selection.ts` with tests, because every interesting case is about text offsets and none of them need a DOM: backwards selections, selections running past the end, wrapping at index 0, and the nesting refusal.

**Checks**

- **Accessibility** — the shortcut is not the only route; there is a visible control doing the same thing. It must not shadow a browser or screen-reader binding.
- **Performance** — parsing is debounced. A full unified pipeline per keystroke on a long letter is a stutter.
- **Bugs** — wrapping a selection that already contains a directive is the case that produces broken markdown.

---

## Phase 6 — Extracting the package

Plugin, CSS and React component ship together. The plugin alone emits colourless `<mark data-c>` and every consumer rewrites the same stylesheet, including the two rules above that fail silently.

The package defines no tag vocabulary — only the mechanism and three colour slots. The app fills them with `important`, `note`, `ask`.

**Done when**

- [ ] It installs into a blank Next app and renders with no entrepta present
- [ ] Types are exported and the build emits declarations
- [ ] The README documents the syntax, the tokens to fill in, and the sanitize schema
- [ ] The package name is confirmed free on npm
- [ ] Licence is MIT, matching the rest of the stack

**Checks**

- **Security** — the sanitize schema is part of the public contract. Document that consumers should not loosen it for untrusted content.
- **Standardization** — the app imports the package rather than keeping a parallel copy. A second implementation of the pipeline is the thing this phase exists to prevent.

---

## Before publishing

- Install entrepta and read the julia colour tokens. It isn't in `package.json` yet.
- Check `remark-mark-directive` is free on npm.

## Out of scope

- A visual highlight editor. Highlights are written in the syntax.
- Automatic tagging by sentiment analysis. The highlighting is editorial: I choose what gets read first.
- More than three colours.

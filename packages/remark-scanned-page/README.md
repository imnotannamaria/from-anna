# remark-scanned-page

Publish a scanned page with a synchronised transcription and an accessible fallback.

Photograph a page, put the transcription beside it, and mark the passages worth reading first. The highlights live inside the markdown as directives, so the `.md` file carries everything by itself.

```md
This has :mark[honestly been one of the best weeks]{c=important} I've had.

:::theme{label="what I actually built"}
A block grouped under a theme, with :mark[a highlight]{c=note} inside it.
:::

:::passage{at="0.19 0.31"}
A passage, and which band of the sheet it was written on.
:::
```

Built for handwritten letters, but the shape fits anything scanned: a journal, a sketchbook, class notes, a zine.

## Why the highlights are in the markdown

The obvious alternative is plain text in a database with the annotations stored as offsets — `{ start: 142, end: 168, tag: "note" }`. It breaks the first time you fix a comma, because every later offset shifts by one. A transcription of handwriting exists to be corrected, so that is not an edge case, it is Tuesday.

Inside the markdown there is nothing to keep in sync. The file is still readable, still diffable, and still means the same thing on its own.

## Install

```bash
npm install remark-scanned-page
```

```ts
import 'remark-scanned-page/styles/scanned-page.css'
// Optional: neutral greys so highlights work before you pick colours.
import 'remark-scanned-page/styles/palette.css'
```

## Rendering markdown

```ts
import { renderMarkdown } from 'remark-scanned-page'

const html = renderMarkdown(source, {
  knownTags: ['important', 'note', 'ask'],
  onUnknownTag: (tag) => console.warn(`Unknown highlight tag: ${tag}`),
})
```

`knownTags` is only used to report typos. An unrecognised tag still renders, in the neutral fill — a mistake mid-document should not be a build failure.

### The pipeline

```ts
unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(remarkMarkDirective)
  .use(remarkRehype)
  .use(rehypeSanitize, schema)
  .use(rehypeStringify)
```

`remarkMarkDirective` and `schema` are exported if you would rather assemble it yourself.

## The component

```tsx
import { ScannedPage } from 'remark-scanned-page'

<ScannedPage
  imageSrc="/pages/1.jpg"
  alt="A notebook page in blue ink"
  width={1125}
  height={1500}
  markdown={transcription}
  pageNumber={1}
  totalPages={3}
  priority
/>
```

It is a server component and renders the markdown before the HTML ships, on purpose. **The transcription is the content.** An image of text is invisible to a screen reader, unreadable to a crawler, and gone entirely for anyone whose images failed to load. The photograph is the visual layer on top of it.

Which is also why both halves are always in the DOM. Let CSS decide which is on screen at a given width — never hydration.

`alt` describes the photograph and is required. It is not the transcription and not decorative.

## Choosing your colours

The package ships no palette. Baking one in would drag another project's design into yours, so four variables are yours to define:

```css
:root {
  --hl-important: #7d2947;
  --hl-note: #6b4a12;
  --hl-ask: #3d3a7a;
  --hl-unknown: #3f3f46;
}
```

Tag names are yours too. `important` / `note` / `ask` are what the CSS ships selectors for; add your own the same way.

Two things are easy to get wrong, and both are quiet:

**Measure against the fill, not the page.** A `<mark>` paints over the canvas, so canvas contrast says nothing about whether the highlighted words can be read.

```ts
import { meetsAA } from 'remark-scanned-page'

meetsAA('#fafafa', '#7d2947') // text colour, highlight fill
```

**A fill that passes text contrast can still be invisible.** Pale yellow on a near-white page reads 16:1 against the text and 1.17:1 against the canvas. Perfectly legible, and it does not look like a highlight.

If your theme has a dark and a light mode, the two palettes are genuinely different colours, not one hue at two opacities. A fill legible under white text is unreadable under black text.

### Colour is never the only signal

Two fills chosen for different hues can land within 0.01 of each other in relative luminance. In greyscale, and to anyone who does not separate those hues, they are the same swatch.

So each tag also carries its own underline style — solid, dotted, wavy — and that is what survives. It is why `styles/palette.css` can be one neutral grey for every tag and the three still read as different. WCAG 1.4.1.

## Regions: the synchronised half

A `:::passage` says which horizontal band of the sheet its words came from, as fractions of the sheet's height:

```md
:::passage{at="0.19 0.31"}
Roughly a fifth to a third of the way down the page.
:::
```

That is what lets a reading view follow the line: as a passage comes into view, the photograph can pan and zoom to the part of the sheet it was written on.

**`at` is optional, and that is the point.** A passage without one falls back to a proportional band — divide the sheet by the number of passages and give this one its share. So the cheap version is the default and marking a region by hand is an upgrade for the pages that deserve it, rather than a tax on every page you publish.

The package does the arithmetic and refuses anything it cannot use:

```ts
import { regionFor, parseRegion, bandFor } from 'remark-scanned-page/passage'

regionFor(el.dataset.passageAt, index, total) // → { top, bottom }
```

`parseRegion` returns `null` — never throws — for a value that is not two finite numbers between 0 and 1 in order, and `regionFor` falls back to `bandFor`. If your transcription came from a vision model, that is not a nicety: the attribute is model output like everything else, and it ends up inside a `transform`.

`:::passage` does not nest inside itself or inside `:::theme`; the inner one unwraps and its words are kept.

## Authoring helpers

```ts
import { wrapSelection } from 'remark-scanned-page'

const result = wrapSelection(value, selectionStart, selectionEnd, 'important')
if (result.status === 'ok') {
  setValue(result.value)
  textarea.setSelectionRange(result.selectionStart, result.selectionEnd)
}
```

Wraps a selection in the directive and tells you where the caret goes. With nothing selected it inserts an empty highlight and puts the caret between the brackets. A selection that already contains a highlight is refused, because nesting does not parse into anything sensible and silently emitting broken markdown is worse than saying no.

`wrapPassage(value, start, end, at?)` is the same shape for `:::passage`. A container directive has to sit on its own lines, so the selection is expanded outwards to whole ones rather than cutting a paragraph in half and producing markdown that means something else.

## Security

Output goes through `rehype-sanitize`. The schema allows `mark`, `aside`, links, images, headings, lists, code, emphasis, paragraphs and rules; it blocks scripts, styles, iframes and every `on*` handler, and restricts `href` to `https:` and `mailto:` and `src` to `https:`.

`div` is allowed, with `data-passage-at` and nothing else on it. `remark-rehype` drops raw HTML from the source, so the only `div` that reaches the schema is the one `:::passage` emits — and its one attribute is parsed and clamped by `parseRegion` before anything uses it.

Protocols matter as much as tag names — allowing `<a>` while allowing `javascript:` in its href is allowing script execution with extra steps.

If your transcription comes from an OCR or vision model, it is untrusted input. Do not loosen the schema for it.

## Notes

Passage structure ships in `styles/scanned-page.css`: a gutter, a CSS counter for the numbers, and a `translateY` reveal driven by `data-seen` on each block. The reveal deliberately does not touch opacity — a passage faded in from something readable is not much of an entrance, and one faded in from something unreadable spends the whole transition below AA on the half of the page that exists to be read. With no `data-seen` attribute at all, which is the no-JavaScript state, nothing moves and everything is legible.

`:mark` nests inside `:::theme`. `:::theme` does not nest inside itself: a bracket inside a bracket cannot be drawn cleanly, so the inner one is unwrapped and its words are kept.

A `:mark` with no label renders as the literal text `:mark` rather than an empty `<mark>`, which would sit in the DOM invisibly and hide the typo.

## Licence

MIT.

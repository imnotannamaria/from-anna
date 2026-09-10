# remark-scanned-page

[![npm](https://img.shields.io/npm/v/remark-scanned-page.svg)](https://www.npmjs.com/package/remark-scanned-page)

Publish a scanned page with a synchronised transcription and an accessible fallback.

Photograph a page, put the transcription beside it, and mark the passages worth reading first. The highlights live inside the markdown as directives, so the `.md` file carries everything by itself.

```md
This has :mark[honestly been one of the best weeks]{c=important} I've had.

:::theme{label="what I actually built"}
A block grouped under a theme, with :mark[a highlight]{c=note} inside it.
:::

:::passage
A run of paragraphs as one block of the transcription.
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

## Passages

A `:::passage` groups a run of paragraphs into one block of the transcription — one entry in the reveal, one thing a reader arrives at. It emits a bare `<div>`.

```md
:::passage
Two paragraphs that belong together.

They arrive as one thing.
:::
```

It carried an `at` attribute once — `:::passage{at="0.19 0.31"}` — naming the band of the sheet the words were written on, which drove a photograph that zoomed to follow the reading. That was built and then removed: two columns already say *these words, that page*, and a photograph that moves on its own while you read makes the half of the screen you are not looking at the half that is moving. The grouping was the half worth keeping.

The schema allows **no attribute at all** on the div, which is a smaller thing to defend than one attribute with a clamp behind it.

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

`wrapTheme(value, start, end, label?)` is the same shape for `:::theme`: the bracket with a name beside it. A container directive has to sit on its own lines, so the selection is expanded outwards to whole paragraphs: a paragraph, and a highlight inside one, can run over several lines, and a fence between two of them breaks both. The label comes back selected, or as a caret between the quotes when there is none, because the name is the next thing to type. A theme inside a theme is refused (the renderer would unwrap it and the bracket would silently not appear), and so is a selection that takes half of another block with it.

`wrapPassage(value, start, end)` does the same for `:::passage`.

## Security

Output goes through `rehype-sanitize`. The schema allows `mark`, `aside`, links, images, headings, lists, code, emphasis, paragraphs and rules; it blocks scripts, styles, iframes and every `on*` handler, and restricts `href` to `https:` and `mailto:` and `src` to `https:`.

`div` is allowed and no attribute is allowed on it. `remark-rehype` drops raw HTML from the source, so the only `div` that reaches the schema is the bare one `:::passage` emits.

Protocols matter as much as tag names — allowing `<a>` while allowing `javascript:` in its href is allowing script execution with extra steps.

If your transcription comes from an OCR or vision model, it is untrusted input. Do not loosen the schema for it.

## Notes

Passage structure ships in `styles/scanned-page.css`: a `translateY` reveal driven by `data-seen` on each block, and nothing else. 0.1.0 also numbered passages in a gutter; 0.2.0 removed that, because a transcription reads better as running text. The reveal deliberately does not touch opacity — a passage faded in from something readable is not much of an entrance, and one faded in from something unreadable spends the whole transition below AA on the half of the page that exists to be read. With no `data-seen` attribute at all, which is the no-JavaScript state, nothing moves and everything is legible.

`:mark` nests inside `:::theme`. `:::theme` does not nest inside itself: a bracket inside a bracket cannot be drawn cleanly, so the inner one is unwrapped and its words are kept.

A `:mark` with no label renders as the literal text `:mark` rather than an empty `<mark>`, which would sit in the DOM invisibly and hide the typo.

## Licence

MIT.

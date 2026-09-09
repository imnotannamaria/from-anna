# remark-scanned-page

Publish a scanned page with a synchronised transcription and an accessible fallback.

Photograph a page, put the transcription beside it, and mark the passages worth reading first. The highlights live inside the markdown as directives, so the `.md` file carries everything by itself.

```md
This has :mark[honestly been one of the best weeks]{c=important} I've had.

:::theme{label="what I actually built"}
A block grouped under a theme, with :mark[a highlight]{c=note} inside it.
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

## Authoring helper

```ts
import { wrapSelection } from 'remark-scanned-page'

const result = wrapSelection(value, selectionStart, selectionEnd, 'important')
if (result.status === 'ok') {
  setValue(result.value)
  textarea.setSelectionRange(result.selectionStart, result.selectionEnd)
}
```

Wraps a selection in the directive and tells you where the caret goes. With nothing selected it inserts an empty highlight and puts the caret between the brackets. A selection that already contains a highlight is refused, because nesting does not parse into anything sensible and silently emitting broken markdown is worse than saying no.

## Security

Output goes through `rehype-sanitize`. The schema allows `mark`, `aside`, links, images, headings, lists, code, emphasis, paragraphs and rules; it blocks scripts, styles, iframes and every `on*` handler, and restricts `href` to `https:` and `mailto:` and `src` to `https:`.

Protocols matter as much as tag names — allowing `<a>` while allowing `javascript:` in its href is allowing script execution with extra steps.

If your transcription comes from an OCR or vision model, it is untrusted input. Do not loosen the schema for it.

## Notes

`:mark` nests inside `:::theme`. `:::theme` does not nest inside itself: a bracket inside a bracket cannot be drawn cleanly, so the inner one is unwrapped and its words are kept.

A `:mark` with no label renders as the literal text `:mark` rather than an empty `<mark>`, which would sit in the DOM invisibly and hide the typo.

## Licence

MIT.

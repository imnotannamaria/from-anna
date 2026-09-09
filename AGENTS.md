<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# from anna

Handwritten letters, photographed and published. The photo is the visual layer, the transcription is the content.
Stack: Next.js 16, unified/remark, Neon, Vercel Blob, OpenRouter, Clerk, entrepta. Light, on paper.

For setup and env vars, see [README.md](README.md). For why any of it is the way it is, see [docs/](docs/). This file covers conventions to follow when writing code here.

---

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + entrepta tokens |
| Design system | entrepta (julia), run in light mode |
| Markdown | unified, remark-parse, remark-directive, remark-rehype, rehype-sanitize, rehype-stringify |
| Database | Postgres (Neon) via Drizzle ORM |
| File storage | Vercel Blob |
| Transcription | OpenRouter, vision model |
| Auth | Clerk |
| OG images | `next/og` |
| Deploy | Vercel |

## This is Next 16

The block at the top of this file is not decoration. The docs that count are in `node_modules/next/dist/docs/`, and this version has breaking changes against what's in most training data. Read the relevant guide before writing a route.

**`CLAUDE.md` and `AGENTS.md` are the same file, byte for byte.** Edit one and copy it over the other in the same commit. Both keep the managed `nextjs-agent-rules` block verbatim, which is what stops `next dev` from rewriting either of them and pulling the two out of sync.

Two already confirmed and relied on in the plans:

- **`params` is a `Promise`** and has to be awaited — in pages, layouts and `generateMetadata`.
- **OG images** use the `opengraph-image.tsx` file convention with `ImageResponse` from `next/og`.

---

## The shape of the project

Three features, each with its own folder under `docs/features/`:

| Feature | What it is | Where it lives |
| --- | --- | --- |
| photo-transcription | Photo in, markdown out | App code |
| markdown-hightlight | The directive syntax, CSS and renderer | **The npm package** |
| share | Publishing, the reading page, analytics | App code |

Only the highlight layer is meant to be reusable. A highlight system with an accessible fallback generalizes — anyone publishing a journal, a sketchbook, class notes or a zine has the same problem. Photographing a page and calling a vision model does not. Keep that boundary: the app imports the package, and never grows a second copy of the pipeline.

*(The folder really is spelled `markdown-hightlight`. Leave it, or rename it everywhere in one commit — don't half-fix it.)*

---

## Data model

```
Letter    id, slug, title (internal), recipient (internal), mdContent,
          status (draft | published), expiresAt, publishedAt, createdAt, updatedAt

Page      id, letterId, index, blobUrl, width, height, alt,
          rawTranscription, transcriptionProvider

View      id, letterId, source, referrer, country, device, reachedEnd, viewedAt
```

Four rules that are load-bearing:

- **`Page` is a table, not an `image` column on `Letter`.** A real handwritten letter is two or three sheets.
- **`rawTranscription` is separate from `mdContent`.** Raw fact on one side, interpretation on the other. Over-edit a letter and you can reprocess from the raw without having lost anything.
- **There is no highlight table, no tag table and no colour table.** Highlights live in the markdown; colours are CSS tokens. A tag CRUD nobody uses would take contrast control away from the stylesheet.
- **`mdContent` stays on `Letter` and is paginated by splitting on `---`.** It's the same separator the transcription produces. Moving markdown onto `Page` would scatter one letter across rows and kill the idea of a `.md` file that stands alone.

**No IP is ever stored, in a column or a log line.** `country` comes from the Vercel geo header and `device` from the user agent, and those answer everything the project needs.

---

## The highlight syntax

```md
Inline: :mark[text worth reading first]{c=important}

:::theme{label="a name for the block"}
A group of paragraphs under one theme.
:::
```

`:mark` nests inside `:::theme`. `:::theme` does not nest inside itself.

Three tags in the app — `important`, `note`, `ask`. The **package** defines no vocabulary at all, only the mechanism and three colour slots. An unknown tag renders neutral and warns in the dev console; it never breaks a build.

### Four rules that break silently

- **`color: inherit` on `mark`.** The user agent sets `color: black`. In dark mode that is black text on a light fill.
- **`box-decoration-break: clone`.** Without it, a highlight crossing a line break is padded only at the start and the end. Most highlights wrap.
- **Contrast is measured against the highlight colour, not the page background.** It's an automated test, in both themes, because a broken pair is invisible until someone looks.
- **Colour never carries meaning alone.** Every tag has its own underline style — solid, wavy, dotted — so the distinction survives in greyscale. WCAG 1.4.1. A legend on the page was rejected as clutter; the underline is what replaced it.

---

## Conventions

- **The app runs in light mode, and that is a decision, not a default.** entrepta ships dark-first with an IDE metaphor; here every page frames a photograph of ink on paper, and dark editor chrome frames the wrong thing. `data-mode="light"` is set on `<html>` and the surfaces are overridden to paper rather than white in `globals.css`.
- **Accents derive from tokens, never a hardcoded hex,** so a theme switch moves everything at once.
- **entrepta components are owned code.** Edit them directly rather than wrapping or overriding from the outside.
- **Everything under `/admin` checks authorization in the route handler and the page**, not only in a middleware matcher. A matcher can be edited wrong. Unauthorized gets a 404, never a 403 — a 403 confirms the thing exists.
- **Pages that read Postgres are dynamic, not ISR.** A view recorded inside a cached render either double-counts or never runs at all.
- **Model output is untrusted text.** It reaches the page through the sanitize schema, never as raw HTML. The schema allows `mark`, `aside`, links, images, headings, lists, code, emphasis, paragraphs and rules, restricts href and src to `https:`, and blocks scripts, styles, iframes and every `on*` handler. Loosening it needs an argument in the diff.
- **The transcription is content, not a nicety.** An image of text is invisible to a screen reader. The transcription can never be the hidden half of a toggle that only exists after hydration, and it ships in the server HTML.
- **`alt` on a page photo is required, not optional.** It's a column on `Page` and a required field in the form.
- **Anything animated in JS asks `useReducedMotion()` itself.** The global `prefers-reduced-motion` reset only zeroes CSS.
- **`IntersectionObserver` never fires on a zero-size element.** Put the trigger on something with a real box.
- **satori doesn't resolve CSS custom properties.** OG images use numeric font sizes; a `var(--...)` there renders at size zero.
- **Chrome won't resize below about 550px.** For a real 375px check, use the device toolbar, not a window drag.
- **Before committing, run `npm run lint` and `npx tsc --noEmit`.** A green commit is the baseline; don't commit a red one without saying so.

---

## Working on this repo

- **The plan comes before the code.** Every feature has an `IMPLEMENTATION.md` split into phases, each with a done-when list. If a change doesn't fit a phase, the doc is wrong and should be updated in the same commit — not ignored.
- **A decision goes in `DECISIONS.md` as one line: X because Y.** Not an essay, not a survey of options nobody seriously considered.
- **`DISCOVERY.md` is Portuguese. `DECISIONS.md` and `IMPLEMENTATION.md` are English.** A discovery doc asks Anna questions and waits for answers on the `→` lines, and questions someone has to answer are written in the language they think in. A plan is read while writing code, so it matches the code. When a discovery closes it does not get translated — it stays as the Portuguese record of how the decisions were reached, and the plan is written beside it in English.
- **`docs/board.png` is the original sketch and stays as it is.** It disagrees with the docs in places — Railway instead of Neon, `:hl` instead of `:mark` — and that distance is the point. Don't "fix" it.
- **When you write anything that lands in this repo, ask whether it reads well to someone outside it.** A stranger reading the docs should find a project about publishing handwritten letters, and nothing about my private reasons for building it. That context belongs in `CLAUDE.local.md`, which is gitignored.

---

## Code review

When asked to review a branch or PR, review the full diff against `main`.

These are the checks this project's decisions were built around. Read them as prompts to look, not a list to tick — a diff that touches none of them still deserves a read, and a rule that clearly doesn't apply isn't a finding.

- **Security** — auth on every admin surface, in the route and the page, never just the matcher. Server-side validation on every mutation. The sanitize schema unchanged, or changed with an argument. URL fields restricted to `https:` before becoming an `href`. No API key reachable from the client, and nothing secret behind a `NEXT_PUBLIC_` prefix. The transcription endpoint authenticated — an open one spends my credit for whoever finds it.
- **Privacy** — no IP in a column, a log or an analytics payload. No letter text in an OG image, in metadata, or anywhere else a link preview will cache it. A draft is a 404 to everyone else.
- **Accessibility** — the transcription in the server HTML and never hidden behind a JS-only toggle; real `alt` on every page photo; contrast measured against the highlight colour in both themes; colour never the only signal; page-turn controls as real buttons, keyboard reachable, with the page change announced; `prefers-reduced-motion` respected by anything animated in JS.
- **Responsive** — reason about 375px specifically. The photo has to stay legible there, which is the most expensive assumption in the project. Wide tables scroll rather than reflow. Highlights wrap differently at narrow widths, which is where the padding bug shows.
- **SEO** — `noindex` on letter routes and `/admin`, and neither in a sitemap. Content in the server HTML: anything that gates mount on a timer, or grows a sliced string, ships an empty element.
- **Bugs** — dates compared in UTC on the server, never against a client clock; timezone traps around a bare `YYYY-MM-DD`; a `---` inside a letter's own text over-splitting the pagination; reseeding that silently overwrites edited `mdContent`; a serverless time limit exceeded by several images in one call.
- **Loading and error states** — a page that hits the database needs a loading state, and an error state where the data *is* the page. An empty state while the database is down is a lie. Per-file states on upload, because one global spinner hides which photo failed. A network failure told apart from a rejection.
- **Performance** — images lazy below the fold with a fixed aspect container, so there's no layout shift. Analytics writes that don't block the response. Markdown parsing debounced in the editor. Transforms animated rather than full-surface repaints. Queries indexed on the columns they actually filter by.
- **Reuse and duplication** — a second markdown pipeline, a second card surface, a second way to render a page. The app imports the package; it doesn't keep a parallel copy. The second copy is a warning, the third is a bug — say so in the review even when extracting is out of scope.

**What review cannot see.** If a diff changes rendered size, spacing or wrapping and nothing else, a green `lint` and `tsc` say almost nothing. Say so, and hand back a concrete list: which page, which element, which breakpoint, what changed. "Do a visual pass" is not that list.

Also run `npm run lint` and `npx tsc --noEmit` and report the result.

Deliver findings as an uncommitted Markdown doc at the repo root (`CODE-REVIEW-<branch>.md`). Open with a production-readiness verdict, cite findings as `file:line` links, close with a prioritized table (fix before merge / follow-up / future), and state explicitly which checks are left for a visual pass.

# from anna

Handwritten letters, photographed and published. The photo is the visual layer, the transcription is the content.
Stack: Next.js 16, unified/remark, Neon, Vercel Blob, OpenRouter, Clerk, entrepta. Light, on paper.

For setup and env vars, see [README.md](README.md). For why any of it is the way it is, see [docs/](docs/). This file covers conventions to follow when writing code here.

---

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + entrepta tokens |
| Design system | entrepta (julia), run in light mode |
| Markdown | unified, remark-parse, remark-directive, remark-rehype, rehype-sanitize, rehype-stringify |
| Database | Postgres (Neon) via Drizzle ORM |
| File storage | Vercel Blob |
| Transcription | OpenRouter, vision model |
| Auth | Clerk |
| OG images | `next/og` |
| Deploy | Vercel |

## This is Next 16

The block at the top of this file is not decoration. The docs that count are in `node_modules/next/dist/docs/`, and this version has breaking changes against what's in most training data. Read the relevant guide before writing a route.

**`CLAUDE.md` and `AGENTS.md` are the same file, byte for byte.** Edit one and copy it over the other in the same commit. Both keep the managed `nextjs-agent-rules` block verbatim, which is what stops `next dev` from rewriting either of them and pulling the two out of sync.

Two already confirmed and relied on in the plans:

- **`params` is a `Promise`** and has to be awaited — in pages, layouts and `generateMetadata`.
- **OG images** use the `opengraph-image.tsx` file convention with `ImageResponse` from `next/og`.

---

## The shape of the project

Three features, each with its own folder under `docs/features/`:

| Feature | What it is | Where it lives |
| --- | --- | --- |
| photo-transcription | Photo in, markdown out | App code |
| markdown-hightlight | The directive syntax, CSS and renderer | **The npm package** |
| share | Publishing, the reading page, analytics | App code |

Only the highlight layer is meant to be reusable. A highlight system with an accessible fallback generalizes — anyone publishing a journal, a sketchbook, class notes or a zine has the same problem. Photographing a page and calling a vision model does not. Keep that boundary: the app imports the package, and never grows a second copy of the pipeline.

*(The folder really is spelled `markdown-hightlight`. Leave it, or rename it everywhere in one commit — don't half-fix it.)*

---

## Data model

```
Letter    id, slug, title (internal), recipient (internal), mdContent,
          status (draft | published), expiresAt, publishedAt, createdAt, updatedAt

Page      id, letterId, index, blobUrl, width, height, alt,
          rawTranscription, transcriptionProvider

View      id, letterId, source, referrer, country, device, reachedEnd, viewedAt
```

Four rules that are load-bearing:

- **`Page` is a table, not an `image` column on `Letter`.** A real handwritten letter is two or three sheets.
- **`rawTranscription` is separate from `mdContent`.** Raw fact on one side, interpretation on the other. Over-edit a letter and you can reprocess from the raw without having lost anything.
- **There is no highlight table, no tag table and no colour table.** Highlights live in the markdown; colours are CSS tokens. A tag CRUD nobody uses would take contrast control away from the stylesheet.
- **`mdContent` stays on `Letter` and is paginated by splitting on `---`.** It's the same separator the transcription produces. Moving markdown onto `Page` would scatter one letter across rows and kill the idea of a `.md` file that stands alone.

**No IP is ever stored, in a column or a log line.** `country` comes from the Vercel geo header and `device` from the user agent, and those answer everything the project needs.

---

## The highlight syntax

```md
Inline: :mark[text worth reading first]{c=important}

:::theme{label="a name for the block"}
A group of paragraphs under one theme.
:::
```

`:mark` nests inside `:::theme`. `:::theme` does not nest inside itself.

Three tags in the app — `important`, `note`, `ask`. The **package** defines no vocabulary at all, only the mechanism and three colour slots. An unknown tag renders neutral and warns in the dev console; it never breaks a build.

### Four rules that break silently

- **`color: inherit` on `mark`.** The user agent sets `color: black`. In dark mode that is black text on a light fill.
- **`box-decoration-break: clone`.** Without it, a highlight crossing a line break is padded only at the start and the end. Most highlights wrap.
- **Contrast is measured against the highlight colour, not the page background.** It's an automated test, in both themes, because a broken pair is invisible until someone looks.
- **Colour never carries meaning alone.** Every tag has its own underline style — solid, wavy, dotted — so the distinction survives in greyscale. WCAG 1.4.1. A legend on the page was rejected as clutter; the underline is what replaced it.

---

## Conventions

- **The app runs in light mode, and that is a decision, not a default.** entrepta ships dark-first with an IDE metaphor; here every page frames a photograph of ink on paper, and dark editor chrome frames the wrong thing. `data-mode="light"` is set on `<html>` and the surfaces are overridden to paper rather than white in `globals.css`.
- **Accents derive from tokens, never a hardcoded hex,** so a theme switch moves everything at once.
- **entrepta components are owned code.** Edit them directly rather than wrapping or overriding from the outside.
- **Everything under `/admin` checks authorization in the route handler and the page**, not only in a middleware matcher. A matcher can be edited wrong. Unauthorized gets a 404, never a 403 — a 403 confirms the thing exists.
- **Pages that read Postgres are dynamic, not ISR.** A view recorded inside a cached render either double-counts or never runs at all.
- **Model output is untrusted text.** It reaches the page through the sanitize schema, never as raw HTML. The schema allows `mark`, `aside`, links, images, headings, lists, code, emphasis, paragraphs and rules, restricts href and src to `https:`, and blocks scripts, styles, iframes and every `on*` handler. Loosening it needs an argument in the diff.
- **The transcription is content, not a nicety.** An image of text is invisible to a screen reader. The transcription can never be the hidden half of a toggle that only exists after hydration, and it ships in the server HTML.
- **`alt` on a page photo is required, not optional.** It's a column on `Page` and a required field in the form.
- **Anything animated in JS asks `useReducedMotion()` itself.** The global `prefers-reduced-motion` reset only zeroes CSS.
- **`IntersectionObserver` never fires on a zero-size element.** Put the trigger on something with a real box.
- **satori doesn't resolve CSS custom properties.** OG images use numeric font sizes; a `var(--...)` there renders at size zero.
- **Chrome won't resize below about 550px.** For a real 375px check, use the device toolbar, not a window drag.
- **Before committing, run `npm run lint` and `npx tsc --noEmit`.** A green commit is the baseline; don't commit a red one without saying so.

---

## Working on this repo

- **The plan comes before the code.** Every feature has an `IMPLEMENTATION.md` split into phases, each with a done-when list. If a change doesn't fit a phase, the doc is wrong and should be updated in the same commit — not ignored.
- **A decision goes in `DECISIONS.md` as one line: X because Y.** Not an essay, not a survey of options nobody seriously considered.
- **`DISCOVERY.md` is Portuguese. `DECISIONS.md` and `IMPLEMENTATION.md` are English.** A discovery doc asks Anna questions and waits for answers on the `→` lines, and questions someone has to answer are written in the language they think in. A plan is read while writing code, so it matches the code. When a discovery closes it does not get translated — it stays as the Portuguese record of how the decisions were reached, and the plan is written beside it in English.
- **`docs/board.png` is the original sketch and stays as it is.** It disagrees with the docs in places — Railway instead of Neon, `:hl` instead of `:mark` — and that distance is the point. Don't "fix" it.
- **When you write anything that lands in this repo, ask whether it reads well to someone outside it.** A stranger reading the docs should find a project about publishing handwritten letters, and nothing about my private reasons for building it. That context belongs in `CLAUDE.local.md`, which is gitignored.

---

## Code review

When asked to review a branch or PR, review the full diff against `main`.

These are the checks this project's decisions were built around. Read them as prompts to look, not a list to tick — a diff that touches none of them still deserves a read, and a rule that clearly doesn't apply isn't a finding.

- **Security** — auth on every admin surface, in the route and the page, never just the matcher. Server-side validation on every mutation. The sanitize schema unchanged, or changed with an argument. URL fields restricted to `https:` before becoming an `href`. No API key reachable from the client, and nothing secret behind a `NEXT_PUBLIC_` prefix. The transcription endpoint authenticated — an open one spends my credit for whoever finds it.
- **Privacy** — no IP in a column, a log or an analytics payload. No letter text in an OG image, in metadata, or anywhere else a link preview will cache it. A draft is a 404 to everyone else.
- **Accessibility** — the transcription in the server HTML and never hidden behind a JS-only toggle; real `alt` on every page photo; contrast measured against the highlight colour in both themes; colour never the only signal; page-turn controls as real buttons, keyboard reachable, with the page change announced; `prefers-reduced-motion` respected by anything animated in JS.
- **Responsive** — reason about 375px specifically. The photo has to stay legible there, which is the most expensive assumption in the project. Wide tables scroll rather than reflow. Highlights wrap differently at narrow widths, which is where the padding bug shows.
- **SEO** — `noindex` on letter routes and `/admin`, and neither in a sitemap. Content in the server HTML: anything that gates mount on a timer, or grows a sliced string, ships an empty element.
- **Bugs** — dates compared in UTC on the server, never against a client clock; timezone traps around a bare `YYYY-MM-DD`; a `---` inside a letter's own text over-splitting the pagination; reseeding that silently overwrites edited `mdContent`; a serverless time limit exceeded by several images in one call.
- **Loading and error states** — a page that hits the database needs a loading state, and an error state where the data *is* the page. An empty state while the database is down is a lie. Per-file states on upload, because one global spinner hides which photo failed. A network failure told apart from a rejection.
- **Performance** — images lazy below the fold with a fixed aspect container, so there's no layout shift. Analytics writes that don't block the response. Markdown parsing debounced in the editor. Transforms animated rather than full-surface repaints. Queries indexed on the columns they actually filter by.
- **Reuse and duplication** — a second markdown pipeline, a second card surface, a second way to render a page. The app imports the package; it doesn't keep a parallel copy. The second copy is a warning, the third is a bug — say so in the review even when extracting is out of scope.

**What review cannot see.** If a diff changes rendered size, spacing or wrapping and nothing else, a green `lint` and `tsc` say almost nothing. Say so, and hand back a concrete list: which page, which element, which breakpoint, what changed. "Do a visual pass" is not that list.

Also run `npm run lint` and `npx tsc --noEmit` and report the result.

Deliver findings as an uncommitted Markdown doc at the repo root (`CODE-REVIEW-<branch>.md`). Open with a production-readiness verdict, cite findings as `file:line` links, close with a prioritized table (fix before merge / follow-up / future), and state explicitly which checks are left for a visual pass.

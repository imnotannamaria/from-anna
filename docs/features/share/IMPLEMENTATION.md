# share — implementation

Discovery is closed. The reasoning behind each choice is in `DECISIONS.md` next door.

**Publish → generate a slug → send the link with `?from=` → record the open → read it at /admin.**

Each phase has a **Done when** list and a **Checks** block. The checks are prompts to look, not boxes to tick.

Phase order matters in one place: analytics comes before the admin UI, because data you didn't collect doesn't come back. If the first letter goes out before the table exists, that open is gone.

---

## Phase 1 — Route, slug, states

Route is `/[slug]` at the root. `/admin` keeps working because static routes resolve before dynamic ones.

The slug is three readable words plus a 6-character random token, like `autumn-bureau-cove-37a69x` — about 2^48 combinations. Words alone are only ~2^18, which is enumerable, so the token is not decoration. Built in `lib/slug.ts`, done ahead of this phase because creating a letter needed it.

States:

- `draft` — 404 for anyone unauthenticated, normal preview for me. 404 rather than 403, because 403 confirms the slug exists.
- `published` — public page
- unpublishing returns it to `draft`
- `expiresAt` is optional, set in the admin, checked in the route. Expired behaves like a draft.

**Done when**

- [ ] `/admin` still resolves to the admin, not to a slug lookup
- [ ] A draft returns 404 when signed out and renders when signed in
- [ ] An expired letter returns 404
- [ ] Slug collisions are handled at insert time, not assumed away
- [ ] `noindex` is on the letter route

**Checks**

- **Security** — the 404 for a draft is enforced in the route handler, not only in a middleware matcher. A matcher can be edited wrong.
- **SEO** — `noindex` on the letter route and `/admin`. Neither belongs in a sitemap.
- **Bugs** — the expiry comparison happens in UTC on the server. Comparing against a client clock makes expiry drift by timezone.

---

## Phase 2 — The letter page

Desktop: photo and transcription side by side, as sketched in `board.png`.

The page ends with one small, concrete ask.

**Done when**

- [ ] The transcription is in the server HTML, not injected after hydration
- [ ] Every photo has real `alt`
- [ ] The page reads correctly with images disabled
- [ ] Dimensions are reserved from the stored width/height, so nothing shifts on load

**Checks**

- **Accessibility** — the transcription is the content, the photo is the visual layer. An image of text is invisible to a screen reader, so the text can never be the hidden half of a toggle that only exists after JS runs.
- **SEO** — metadata per letter, but nothing in it that leaks the letter's text. `noindex` doesn't excuse a broken document.
- **Performance** — images lazy-load below the fold with a fixed aspect container.
- **Reuse** — the rendering comes from the `markdown-hightlight` component. A second markdown pipeline here is the duplication to catch in review.

---

## Phase 3 — Paging

Pages turn one at a time, with a page-turn animation. A three-sheet letter scrolling as one column loses the notebook.

`mdContent` is split on `---`, the same separator the transcription produces, so the text turns with the photo.

**Done when**

- [ ] Photo and transcription always show the same page index
- [ ] A one-page letter hides the paging controls instead of showing dead ones
- [ ] The controls are real buttons, reachable by keyboard
- [ ] The current page is announced, not just drawn
- [ ] A `---` count that disagrees with the page count degrades to something readable

**Checks**

- **Accessibility** — the animation respects `prefers-reduced-motion`. A CSS-only reset does not cover anything animated in JS, which has to ask for itself. Page changes are announced through a live region; keyboard focus lands somewhere sensible after a turn.
- **Bugs** — the animation must not move the control out from under the cursor, which produces a hover flicker loop.
- **Responsive** — a page-turn effect that needs width has to have a plain fallback at 375px.
- **Performance** — animate a transform, don't repaint a full-page gradient every frame.

---

## Phase 4 — Analytics

Two marks, which separate the three cases:

1. **Open** — recorded server-side when the letter renders, one row per open
2. **Reached the end** — a single event when the last block enters the viewport, via `IntersectionObserver`

No open means it was never read. An open with no end means it was abandoned partway. Both means it was read.

`View`:

| Column | Source |
| --- | --- |
| `letterId` | |
| `source` | `?from=`, null when absent |
| `referrer` | its own column, a different fact |
| `country` | Vercel geo header |
| `device` | user agent |
| `reachedEnd` | |
| `viewedAt` | |

**No IP is stored, not even in logs.**

Filters before writing a row:

- per-session dedup via a cookie, so my own refreshes aren't an audience
- bot and link-preview user agents. Messaging apps fetch the URL themselves to build a card, so without this every letter is born with a fake view

No percentage scroll depth. No analytics library.

**Done when**

- [ ] An open writes exactly one row
- [ ] A refresh in the same session writes none
- [ ] A known bot user agent writes none
- [ ] Reaching the end updates the existing row rather than inserting a second
- [ ] No IP appears in any column or any log line
- [ ] A letter still renders when the write fails

**Checks**

- **Security** — the end-of-letter endpoint takes a session and a letter, never arbitrary caller-supplied fields, or the table is writable by anyone with the link.
- **Bugs** — recording inside a cached render either double-counts or never runs. The letter route reads the database, so it is dynamic, not ISR.
- **Accessibility** — `IntersectionObserver` never fires on a zero-size element. Put it on something with a real box.
- **Performance** — the write must not block the response. A slow analytics insert becomes a slow letter.

---

## Phase 5 — Auth and admin

Clerk. Every admin surface checks authorization in the route and the page, not only in the middleware matcher.

`/admin` lists letters with their status, and per letter: opens, how many reached the end, and the breakdown by `source`.

**Done when**

- [ ] An unauthenticated request to any admin route gets 404, never 403
- [ ] The check lives in the route handler, not only the matcher
- [ ] Mutations validate on the server, not just in the form
- [ ] `/admin` is `noindex`

**Checks**

- **Security** — the phase where a mistake is worst. Signed in is not the same as authorized; decide which accounts are allowed, don't assume there will only ever be one.
- **Loading and error states** — an admin page reading the database needs a loading state, and an error state where the data *is* the page. An empty state while the database is down is a lie.
- **Responsive** — the numbers table scrolls horizontally instead of reflowing at 375px.

---

## Phase 6 — OG image, unpublish, expiry

OG image generated with `ImageResponse` from `next/og`, through the `opengraph-image` file convention on the route segment.

**None of the letter's text goes in it.** Link previews are public and cached by third parties.

Unpublish returns the letter to `draft`. `expiresAt` is set in the admin and checked in the route.

**Done when**

- [ ] The OG image renders without any letter content
- [ ] It stays under the 8MB limit, or the build fails
- [ ] Unpublishing takes the public URL to 404 immediately
- [ ] An expired letter behaves exactly like a draft

**Checks**

- **Security** — the OG route can't become a way to read a draft's content.
- **Bugs** — satori does not resolve CSS custom properties. Use numeric font sizes in the OG image; a `var(--...)` there renders at size zero.
- **Performance** — the OG image is generated and cached, not rebuilt per request.

---

## Notes on this Next version

Next 16.3.4. The docs that count are in `node_modules/next/dist/docs/`. Confirmed:

- `params` is a `Promise` and has to be awaited, in pages and in `generateMetadata`.
- OG images use the `opengraph-image.tsx` file convention with `ImageResponse` from `next/og`.
- `noindex` comes from the `robots` field in metadata.

Check the local docs before writing a route. Don't write it from memory.

## Out of scope

- Percentage scroll depth or time on page
- Vercel Analytics as the source of truth
- Multi-user

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

- [x] `/admin` still resolves to the admin, not to a slug lookup
- [x] A draft returns 404 when unauthorised and renders as a preview when not
- [x] An expired letter behaves exactly like a draft
- [x] Slug collisions fail at insert time against a unique index, and the insert retries
- [x] `noindex` on the letter route and `/admin`

**Checks**

- **Security** — the 404 for a draft is enforced in the route handler, not only in a middleware matcher. A matcher can be edited wrong.
- **SEO** — `noindex` on the letter route and `/admin`. Neither belongs in a sitemap.
- **Bugs** — the expiry comparison happens in UTC on the server. Comparing against a client clock makes expiry drift by timezone.

---

## Phase 2 — The letter page

Desktop: photo and transcription side by side, as sketched in `board.png`.

The page ends with one small, concrete ask.

**Done when**

- [x] The transcription is in the server HTML: the markdown is parsed in the server component and the finished nodes are handed to the client reader
- [x] Every photo has real `alt`, required at upload
- [x] Dimensions are reserved from the stored width/height
- [ ] Read on a real phone at 375px — the one check that cannot be automated, and the assumption the whole reading view rests on

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

- [x] Photo and transcription always show the same page index — they are one component
- [x] The controls are real buttons, disabled at the ends, reachable by keyboard
- [x] Turning a page moves focus to the page heading, so a keyboard reader is not stranded
- [x] The current page is announced through a live region
- [x] A missing `---` block still renders that page's photo instead of dropping it
- [x] `prefers-reduced-motion` drops the turn animation and keeps the state change
- [x] Off-screen pages stay in the DOM, hidden with `visibility` and `inert`, so every page's text ships in the HTML

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

- [x] An open writes exactly one row
- [x] A refresh in the same session writes none — deduplicated by a unique index rather than a read-then-write, which two tabs would both pass
- [x] A known bot or link-preview user agent writes none, and a missing user agent counts as automated
- [x] Reaching the end updates the existing row rather than inserting a second
- [x] No IP in any column — verified against the live database, not just the schema file
- [x] A letter still renders when the write fails: the insert is wrapped and swallowed
- [x] Draft previews are not counted

**The session cookie is set in `proxy.ts`, not in the page.** A Server Component can read cookies but cannot set them, so without the proxy every request would arrive with no session, the page would invent a new id each time, and per-session deduplication would count every refresh as a new reader — the exact thing it exists to prevent. The proxy is not a gate for anything; the 404s are enforced in the page and the route handlers.

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

- [x] A letter can be started from `/admin` — `POST /api/letters`, validated on the server as well as in the form
- [x] An unauthorised request to any admin route gets 404, never 403 — verified against a **production build with `DEV_ADMIN_BYPASS=1` still set**, which is the case that matters: the flag is never read on that branch
- [x] The check lives in the page and in every route handler, never only in a matcher
- [x] Mutations validate on the server: status is an enum, expiry is parsed as a date, markdown is length-capped
- [x] `/admin` is `noindex`, with loading and error states
- [x] **Clerk is wired up.** `clerkMiddleware()` is composed into `proxy.ts` alongside the reading-session cookie, `requireAdmin()` reads `auth()`, and the only sign-in surface is `/admin/sign-in`, linked from nowhere.
- [ ] **`ADMIN_USER_IDS` is empty.** Nothing is allowed in a production build until it holds a Clerk user id — sign in once at `/admin/sign-in` and the page shows you yours. A development instance and a production one issue different ids, so it has to be set twice.

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

- [x] The OG image contains no letter text and no photograph
- [x] It is identical for every letter, so it is one cached asset rather than a render per slug
- [x] Numeric font sizes only — satori does not resolve custom properties and a `var()` renders at size zero
- [x] Unpublishing takes the public URL to 404, and the photographs with it, because the Blob store is private
- [x] `publishedAt` is set once and never moved, so it stays the date the letter was sent

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

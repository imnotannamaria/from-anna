# share — decisions

Decision log. X because Y. Closed on 2026-09-09.

---

**Route is `/[slug]` at the root** — because a short link is nicer to send, and static routes win over dynamic ones, so `/admin` keeps working.

~~**The slug is three readable words plus a 6-character random token, like `autumn-bureau-cove-37a69x`.**~~ **Replaced after the first deploy** — see the end of this file. The reasoning below is kept because it is the cost of the replacement.

~~because it has to be readable out loud *and* unguessable, and words alone only deliver the first.~~

Three words from hand-written lists give about 330,000 combinations — roughly 2^18, which a script enumerates in an afternoon. That is not a thin margin, it is no margin. The words carry the readability and the token carries the entropy, which together is about 2^48. The token's alphabet drops `0`/`o` and `1`/`l` so the slug survives being dictated.

An earlier version of this file claimed a word list alone gave billions of combinations. It didn't; the unit test is what caught it.

**Domain is `from-anna.vercel.app`, no custom domain** — because a domain would be a recurring cost for a personal project.

**A draft opens as a preview for me and returns 404 for everyone else** — 404 rather than 403, because 403 confirms the slug exists.

**Unpublish and expiry both ship in v1** — an `expiresAt` field, set in the admin and checked in the route. Unpublishing covers most cases on its own, but a link that stays live forever is the kind of thing that only becomes a problem later.

**Desktop shows the photo and the transcription side by side; mobile toggles between them** — because neither fits at 375px without turning into a useless thumbnail.

**On mobile the photo opens first** — because the handwriting is the point of the project, and opening on the transcription makes it read like any other block of text. Accepted trade-off: if the photo isn't legible at 375px, this becomes the most expensive bug in the project.

**On desktop the sheets stack down the scroll, each photograph pinned while its transcription passes it; on mobile they still turn one at a time** — because the sticky section already says where you are, so previous/next was two controls doing what scrolling does. Reversed the original decision below once there was a layout that replaced it rather than removing it.

~~**Pages turn one at a time, with a page-turn animation**~~ — the reasoning still holds where it applies: a letter read as one undifferentiated column loses the sense of a notebook. Stacked sticky sections keep the sheets separate without asking anyone to find a button. See `design/DECISIONS.md`.

**`mdContent` stays on `Letter` and is split on `---` to paginate** — because the transcription has to turn with the photo, and moving the markdown onto `Page` would scatter the letter across rows and kill the idea of one `.md` file that stands alone. It's the same separator the transcription already produces.

**A generated OG image, with none of the letter's text in it** — because link previews are public and cached by third parties.

**Views are recorded server-side, one row per open, plus a single event when the last block enters the viewport** — because a letter you send either gets opened or it doesn't, and you never find out. Two marks separate the three cases: never opened, opened and abandoned, read to the end.

**Vercel Analytics alone was rejected** — because it runs in the client, misses anyone blocking JS, doesn't segment by `?from=` reliably, and doesn't show up in my own admin. The `View` table costs code, not money: Neon is already in the project.

**Deduplicated per session with a cookie** — because otherwise my own refreshes become an audience.

**Bots and link previews are filtered by user agent** — because messaging apps fetch the URL themselves to build the card, so without a filter every letter is born with a fake view, right where the number matters most.

**No IP is stored, not even in logs** — because `country` from the Vercel geo header and `device` from the user agent answer everything I need without holding personal data.

**Without `?from=`, `source` is null, and the referrer lives in its own column** — because they are different facts: `source` is who I said the link was for, the referrer is where the visit actually came from.

**The numbers are shown at `/admin`** — because data that only exists if I open a database is data I won't look at.

**Auth is Clerk** — reversing the signed-cookie plan, because hand-rolling sessions, logout and password recovery is security surface I don't want to maintain in a public repo.

**`noindex` on the letter route and on `/admin`** — because a letter written for one person has no reason to be in a search index.

---

## Clerk, once it was actually wired

**Clerk's middleware runs inside `proxy.ts`, composed with the reading-session cookie rather than replacing it** — because `auth()` has nothing to read in a Server Component or a route handler unless the middleware has already seen the request, and that file was already doing an unrelated job. Dropping a generated `middleware.ts` in its place would have silently killed the per-session deduplication and made every refresh a new reader.

**The matcher now covers `/api/*`, which it deliberately did not before** — because `requireAdmin()` runs inside the upload and transcription handlers, and `auth()` is empty there unless Clerk has seen the request. Left as it was, uploading a photo would have failed with a 404 while signed in. The reading cookie is still only issued outside `/api`, which was the original reason for the narrow matcher.

**There is no sign-in button, no sign-up and no account UI anywhere on the public site** — because there are no public accounts. The home page says there is no sign-up, and that has to keep being true.

**The only door is `/admin/sign-in`, and it is linked from nowhere** — `/admin` answers 404 to a stranger rather than redirecting to a sign-in page, because a redirect announces that there is something behind it. That is the same reasoning that made the letter route answer 404 instead of 403.

**That page shows a signed-in-but-not-allowed visitor their own Clerk user id** — because the allowlist is a list of ids and nobody can know their own until they have signed in once. It is shown to the person it belongs to, it opens nothing by itself, and it is useless to anyone who cannot also edit the environment. Without it the bootstrap is a trip to the Clerk dashboard every time an instance changes.

**Admin is refused in `proxy.ts` as well as in every page and route handler** — and the reason is the status code, not the access.

`app/admin/loading.tsx` opens a Suspense boundary, so Next sends the response headers — a 200 — before the page has decided anything, and a `notFound()` after that swaps the body without taking the status back. `/admin` was answering **200 with the 404 page inside it**, which is a worse answer than either: it says the route exists *and* that the request succeeded. Refusing before the render starts is the only place the status is still ours to choose.

This does not make the matcher the gate. `requireAdmin()` in the page and the handler still is, it is the same pure `isAdminAllowed` being called earlier, and a matcher that quietly stopped matching would change nothing about who gets in.

**`app/[slug]/loading.tsx` was deleted rather than kept** — same bug, and no proxy can fix it: whether a slug is a draft is a database question, and the proxy has no business asking it. So the choice was a skeleton or a real 404 on a letter route, and the status wins. The security property held either way — a draft and a made-up slug were identical at 200 too — but a route whose whole promise is *this does not exist* should say so in the status line.

**A letter is started from `/admin`, through `POST /api/letters`** — because `createLetter()` had existed since the first commit with nothing calling it, and the only letter in the database had been inserted by hand through Drizzle Studio. That works exactly once.

It creates a **draft with no pages and no text**, which is the honest order: a letter exists so photographs have somewhere to go. The form asks for a title and an optional recipient, neither of which is ever rendered on the published page — one is how I find it in a list, the other is who I wrote it for, and the reader gets the three words of the slug instead.

---

## After the first deploy

**The slug is made from the title and the day the letter was started — `carta-pro-joao-2026-09-10` — or typed by hand when the letter is started** — because a random slug meant nothing to the person sending it or the person opening it, and a link is something you say out loud.

**This gives up unguessability, on purpose.** A published letter can now be found by someone who knows roughly what it is called and when it was written. What still holds: a draft, an unpublished letter and an expired one are a 404 to everyone but me, whatever their slug, because that check lives in the route and not in the address.

**The date is UTC**, computed on the server so it agrees with itself. A letter started late at night in Brazil carries the next day's date.

**A generated slug that collides gets `-2`, `-3`; a slug I typed that collides is refused** — silently renaming what I chose is worse than saying it is taken.

**`recipient` is shown on the published page**, in the reading bar, as *from anna to <recipient>*. Reversed from "internal, never rendered": see `design/DECISIONS.md`. `title` is never shown, but the default slug is made from it, and the form says so.

**A letter can be published, unpublished, given an expiry and deleted from `/admin`** — the route took status and expiry from the first version and nothing called it. Deleting goes through `DELETE /api/letters/[id]`, and it deletes the photographs from the Blob store too: the database cascade cannot reach them, and a delete that keeps the photographs is not one.

**Clerk sends every sign-in back to `/admin/sign-in`, which decides** — sending it straight to `/admin` meant an account that was not allowed in landed on a 404 with no explanation. That page no longer shows a Clerk user id or the name of the allowlist variable; an account that is not allowed in gets a way to sign out and try another email, and nothing else.

**A view is recorded with `after()`, once the letter has been sent** — awaiting the insert made the database the thing a reader waited on, for a number the reader never sees.

**The reading-session cookie is issued on letter routes only** — not on the front page and not on `/admin`. Someone who only read about the project has no reason to leave with a six-month identifier.

**Nothing on the site can be framed, and only the origin leaves as a referrer** — the desk has a delete button a decoy iframe could aim at, and a letter's address now carries its title.

**The letter's markdown is split into exactly one block per sheet** — a `---` the letter uses as a rule of its own over-split it, and the blocks past the last sheet were silently never rendered. They fold into the last sheet instead.

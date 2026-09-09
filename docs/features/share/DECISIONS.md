# share — decisions

Decision log. X because Y. Closed on 2026-09-09.

---

**Route is `/[slug]` at the root** — because a short link is nicer to send, and static routes win over dynamic ones, so `/admin` keeps working.

**The slug is three readable words plus a 6-character random token, like `autumn-bureau-cove-37a69x`** — because it has to be readable out loud *and* unguessable, and words alone only deliver the first.

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

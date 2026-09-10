/**
 * What Vercel Web Analytics is allowed to see.
 *
 * It is a third party, and a raw page URL here says more than it should:
 * a letter's path carries its title, `?from=` carries the name of the
 * person it was sent to, and `/admin` is me. So before an event leaves the
 * browser the desk is dropped, the query string goes, and every letter is
 * reported as the same path.
 *
 * Nothing is lost by it. How often each letter was opened and read lives in
 * the `views` table and on the desk, which is the one place those numbers
 * are meant to be. Vercel answers the other questions: how many people read
 * the front page, from where, on what.
 */

/** The shape of an event, as `@vercel/analytics` hands it to `beforeSend`. */
type Event = { type: string; url: string }

/** Every letter is reported as this path. */
export const LETTER_PATH = '/letter'

export function scrubEvent<T extends Event>(event: T): T | null {
  const url = new URL(event.url)

  if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
    return null
  }

  url.search = ''
  url.hash = ''
  // The front page is the only public route that is not a letter.
  if (url.pathname !== '/') url.pathname = LETTER_PATH

  return { ...event, url: url.toString() }
}

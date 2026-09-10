import Link from 'next/link'

import { TypeLine } from '@/components/ui/type-line'

export const metadata = {
  title: 'Nothing here',
  robots: { index: false, follow: false },
}

/**
 * The 404.
 *
 * This is what a wrong link gets, and it is also what an unpublished letter,
 * an expired one, and someone else's letter get. **It must read the same for
 * all four.** Anything that distinguishes "never existed" from "not yours"
 * hands back the one fact the unguessable slug exists to withhold — which is
 * also why the letter route answers 404 rather than 403.
 *
 * So the page says nothing about what was asked for. It is a blank sheet,
 * which is the honest picture of the situation and happens to be the right
 * one for a site made of letters.
 */
export default function NotFound() {
  return (
    <main className="state">
      <div className="state-inner">
        <div className="state-sheet" aria-hidden="true">
          <span className="state-sheet-rules" />
        </div>

        <p className="meta state-eyebrow">
          <TypeLine duration={1400}>404 · nothing written here</TypeLine>
        </p>

        <h1 className="display state-title">
          This page is <em>blank.</em>
        </h1>

        <p className="state-lede">
          Either the link is wrong, or the letter it pointed at isn&rsquo;t
          being shared anymore. Every letter here is meant for one person, so
          there&rsquo;s no list to look through. If one was sent to you, the
          link you got is the only way in.
        </p>

        <p className="state-actions">
          <Link href="/" className="pill">
            What this is
          </Link>
        </p>
      </div>
    </main>
  )
}

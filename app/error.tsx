'use client'

import { useEffect } from 'react'

/**
 * The error boundary for everything that is not the admin.
 *
 * A reader who opened a letter and got this has no idea whether the letter is
 * gone or the server is having a minute, and those are very different things
 * to be told. It says which: **nothing has been lost**, try again.
 *
 * The error itself is never printed. A stack trace on a public page is a map
 * of the code, and the message can carry a query, a path or a token.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // The digest is the server's own reference for this failure. It is safe
    // to show and useless to anyone else, which is exactly the trade a public
    // error page wants.
    console.error('letter render failed', error.digest ?? error.message)
  }, [error])

  return (
    <main className="state">
      <div className="state-inner">
        <div className="state-sheet state-sheet--spoiled" aria-hidden="true">
          <span className="state-sheet-rules" />
          <span className="state-blot" />
        </div>

        <p className="meta state-eyebrow">Something went wrong</p>

        <h1 className="display state-title">
          The ink <em>smudged.</em>
        </h1>

        <p className="state-lede">
          This is the site failing, not the letter. Nothing has been changed
          and nothing has been lost — the same link will work once whatever
          just happened stops happening.
        </p>

        <p className="state-actions">
          <button type="button" onClick={reset} className="pill">
            Try again
          </button>
        </p>

        {error.digest && (
          <p className="meta state-digest">reference {error.digest}</p>
        )}
      </div>
    </main>
  )
}

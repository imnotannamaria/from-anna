'use client'

import { EmptyState } from '@/app/components/entrepta/empty-state'

import { ThemeToggle } from '@/components/ui/theme-toggle'

import { RetryButton } from '@/components/ui/retry-button'

import { BrandMark } from '@/components/ui/brand-mark'

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
    console.error('letter render failed', error.digest ?? 'unavailable')
  }, [error])

  return (
    <main id="main-content" className="state">
      <div className="state-inner">
        <ThemeToggle />
        <EmptyState
          size="page"
          illustration={<BrandMark size={90} />}
          eyebrow={<>Something went wrong</>}
          title={
            <>
              The ink <em>smudged.</em>
            </>
          }
          description={
            <>
              This is the site failing, not the letter. Nothing changed and
              nothing was lost. Please try opening the same link again.
            </>
          }
          action={<RetryButton retry={reset} />}
        />

        {error.digest && (
          <p className="meta state-digest">reference {error.digest}</p>
        )}
      </div>
    </main>
  )
}

'use client'

import { EmptyState } from '@/app/components/entrepta/empty-state'

import { ThemeToggle } from '@/components/ui/theme-toggle'

import { RetryButton } from '@/components/ui/retry-button'

import { BrandMark } from '@/components/ui/brand-mark'

/**
 * The data is the page here, so an empty list while the database is down
 * would read as "no letters" — a lie, and the wrong kind.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main id="main-content" className="state state--admin">
      <div className="state-inner">
        <ThemeToggle />
        <EmptyState
          size="page"
          illustration={<BrandMark size={90} />}
          eyebrow={<>The desk</>}
          title={
            <>
              Could not read <em>the letters.</em>
            </>
          }
          description={
            <>
              The database did not answer. Nothing has been changed — this is a
              failed read, not a failed write.
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

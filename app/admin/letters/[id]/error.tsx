'use client'

import { BrandMark } from '@/components/ui/brand-mark'

import { EmptyState } from '@/app/components/entrepta/empty-state'

import { ThemeToggle } from '@/components/ui/theme-toggle'

import { RetryButton } from '@/components/ui/retry-button'

/** One letter's workbench, when the read fails. Same shape as the desk. */
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
              Could not read <em>this letter.</em>
            </>
          }
          description={
            <>
              The database did not answer. Nothing has been changed — this is a
              failed read, not a failed write, so nothing you wrote is at risk.
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

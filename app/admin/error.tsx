'use client'

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
    <main className="state state--admin">
      <div className="state-inner">
        <p className="meta state-eyebrow">The desk</p>

        <h1 className="display state-title">
          Could not read <em>the letters.</em>
        </h1>

        <p className="state-lede">
          The database did not answer. Nothing has been changed — this is a
          failed read, not a failed write.
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

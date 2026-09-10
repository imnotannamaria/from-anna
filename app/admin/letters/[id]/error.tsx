'use client'

/** One letter's workbench, when the read fails. Same shape as the desk. */
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
          Could not read <em>this letter.</em>
        </h1>

        <p className="state-lede">
          The database did not answer. Nothing has been changed — this is a
          failed read, not a failed write, so nothing you wrote is at risk.
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

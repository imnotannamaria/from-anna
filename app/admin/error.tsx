'use client'

/**
 * The data is the page here, so an empty list while the database is down
 * would read as "no letters" — a lie, and the wrong kind.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-4xl flex-col items-start gap-4 p-6">
      <h1 className="text-xl font-medium">Could not load your letters</h1>
      <p className="opacity-80">
        The database did not answer. Nothing has been changed.
      </p>
      <button type="button" onClick={reset} className="rounded border px-4 py-2">
        Try again
      </button>
    </main>
  )
}

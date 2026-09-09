'use client'

/**
 * The data *is* the page here, so an empty state while the database is down
 * would be a lie. This says what actually happened instead.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-start gap-4 p-6">
      <h1 className="text-xl font-medium">This letter could not be loaded</h1>
      <p className="opacity-80">
        The database did not answer. The letter is probably fine — nothing has
        been changed.
      </p>
      <button type="button" onClick={reset} className="rounded border px-4 py-2">
        Try again
      </button>
    </main>
  )
}

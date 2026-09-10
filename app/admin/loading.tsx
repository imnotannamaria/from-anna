/**
 * The desk, on the way in.
 *
 * The numbers *are* this page, so an empty list while the query is in flight
 * would read as "no letters" — which is the wrong kind of lie, and the same
 * one the error state exists to avoid.
 */
export default function Loading() {
  return (
    <main className="admin-shell">
      <header className="admin-masthead">
        <p className="meta" role="status">
          Loading letters…
        </p>
        <h1 className="display admin-title">Letters</h1>
        <span className="rule" aria-hidden="true" />
      </header>

      <ul className="admin-list" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <li key={i} className="admin-card admin-card--skeleton">
            <span className="skeleton skeleton-line" style={{ width: '42%' }} />
            <span className="skeleton skeleton-line" style={{ width: '28%' }} />
            <div className="skeleton-figures">
              <span className="skeleton skeleton-figure" />
              <span className="skeleton skeleton-figure" />
              <span className="skeleton skeleton-figure" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}

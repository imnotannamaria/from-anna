/** One letter's workbench, on the way in. Shaped like what it becomes. */
export default function Loading() {
  return (
    <main className="admin-shell admin-shell--wide">
      <header className="admin-masthead">
        <p className="meta" role="status">
          Loading letter…
        </p>
        <h1 className="display admin-title">
          <span
            className="skeleton skeleton-title"
            style={{ width: '18rem' }}
            aria-hidden="true"
          />
        </h1>
        <span className="rule" aria-hidden="true" />
      </header>

      <div className="editor-grid" aria-hidden="true">
        <span className="skeleton skeleton-surface" />
        <span className="skeleton skeleton-surface" />
      </div>
    </main>
  )
}

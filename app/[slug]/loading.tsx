import { TypeLine } from '@/components/ui/type-line'

/**
 * What a letter looks like on the way in.
 *
 * The route is dynamic — it reads Postgres and records the opening — so there
 * is always a moment before the first byte of the letter arrives. This is
 * that moment, and it is shaped like the page it becomes: a bar, a sheet, and
 * a column of lines beside it. A centred spinner would tell the reader
 * nothing about what is coming.
 *
 * The skeleton is `aria-hidden` and one live line does the announcing. Twelve
 * grey rectangles read out one by one is worse than silence.
 */
export default function Loading() {
  return (
    <div className="reader">
      <header className="reader-bar">
        <span className="display reader-wordmark">from anna</span>
        <p className="meta reader-name" aria-hidden="true">
          <span className="skeleton skeleton-line" style={{ width: '11rem' }} />
        </p>
        <div className="reader-controls" aria-hidden="true">
          <span className="skeleton skeleton-chip" />
          <span className="skeleton skeleton-chip" />
          <span className="skeleton skeleton-chip" />
        </div>
      </header>

      <main className="reader-main">
        <section className="hero hero--loading">
          <div className="hero-copy">
            <p className="meta" role="status">
              <TypeLine duration={1800}>unfolding the letter…</TypeLine>
            </p>

            <div aria-hidden="true" className="skeleton-stack">
              <span className="skeleton skeleton-title" style={{ width: '84%' }} />
              <span className="skeleton skeleton-title" style={{ width: '62%' }} />
              <span className="rule" />
              <span className="skeleton skeleton-line" style={{ width: '96%' }} />
              <span className="skeleton skeleton-line" style={{ width: '90%' }} />
              <span className="skeleton skeleton-line" style={{ width: '71%' }} />
            </div>
          </div>

          <div className="hero-photo" aria-hidden="true">
            <div className="hero-sheet">
              <span className="skeleton skeleton-sheet" />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

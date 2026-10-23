import { Skeleton, SkeletonText } from '@/app/components/entrepta/skeleton'
import { BrandMark } from '@/components/ui/brand-mark'

/** Structural placeholders share the real desk geometry and one live announcement. */
export function DeskLoading({ workbench = false }: { workbench?: boolean }) {
  return (
    <main
      id="main-content"
      className={`admin-shell surface${workbench ? ' admin-shell--wide' : ''}`}
    >
      <header className="admin-masthead">
        <p className="desk-wordmark">
          <BrandMark size={40} />
          from anna <span>/ the writing desk</span>
        </p>
        <h1 className="display admin-title">
          {workbench ? 'Opening your letter' : 'Your letters'}
        </h1>
        <p className="editor-hint" role="status">
          {workbench ? 'Loading letter…' : 'Loading letters…'}
        </p>
        <span className="rule" aria-hidden="true" />
      </header>
      <div className="desk-loading" aria-hidden="true">
        <div className="desk-loading-controls">
          <Skeleton className="desk-loading-pill" />
          <Skeleton
            className="desk-loading-pill desk-loading-pill--wide"
            delay={0.08}
          />
          <Skeleton className="desk-loading-pill" delay={0.16} />
        </div>
        {workbench ? (
          <>
            <Skeleton className="desk-loading-toolbar" />
            <div className="desk-loading-workspace">
              <div className="desk-loading-photo">
                <Skeleton className="desk-loading-label" variant="line" />
                <Skeleton className="desk-loading-sheet" delay={0.12} />
                <SkeletonText lines={2} />
              </div>
              <div className="desk-loading-writing">
                <Skeleton className="desk-loading-label" variant="line" />
                <SkeletonText lines={5} />
                <SkeletonText lines={4} />
                <SkeletonText lines={3} />
              </div>
            </div>
          </>
        ) : (
          [0, 1, 2].map((index) => (
            <div className="desk-loading-letter" key={index}>
              <div className="desk-loading-row">
                <Skeleton className="desk-loading-title" delay={index * 0.08} />
                <Skeleton
                  className="desk-loading-badge"
                  delay={index * 0.08 + 0.06}
                />
              </div>
              <Skeleton
                variant="line"
                className="desk-loading-label"
                delay={index * 0.08 + 0.12}
              />
              <Skeleton
                className="desk-loading-pill"
                delay={index * 0.08 + 0.18}
              />
              <div className="desk-loading-activity">
                <Skeleton
                  variant="line"
                  className="desk-loading-label"
                  delay={index * 0.08 + 0.24}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  letterId: string
  /**
   * Each page, already rendered on the server.
   *
   * The markdown is parsed server-side and arrives here as finished nodes, so
   * the transcription is in the HTML before any JavaScript runs. Passing raw
   * markdown and rendering it in the client would put the accessible half of
   * the page behind hydration.
   */
  renderedPages: React.ReactNode[]
  isPreview: boolean
}

/**
 * The reading view.
 *
 * Pages turn one at a time rather than scrolling as a single column: a
 * three-sheet letter read as one long page stops feeling like a notebook,
 * which is the whole difference between this and a blog post.
 *
 * On a phone the photo and the transcription cannot both fit at 375px without
 * one becoming a useless thumbnail, so they toggle — and the photo opens
 * first, because the handwriting is the point. **Both halves are always in
 * the DOM**; the toggle only changes which is visible. Hiding the text behind
 * a JS-only tab would make the accessible version the optional one.
 */
export function LetterReader({ letterId, renderedPages, isPreview }: Props) {
  const [current, setCurrent] = useState(0)
  const [showTranscription, setShowTranscription] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const reported = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const total = renderedPages.length
  const isLast = current === total - 1

  // "Reached the end" is the second of the two marks. An open with no end
  // means the letter was abandoned partway; both together mean it was read.
  // Those are different problems with opposite fixes, which is why one
  // number was never enough.
  useEffect(() => {
    if (isPreview || reported.current || !isLast) return

    const target = endRef.current
    if (!target) return

    // An observer aimed at something with no box never fires, so this is on
    // a real element rather than a zero-height marker.
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        if (reported.current) return
        reported.current = true
        observer.disconnect()

        // Fire and forget: a failed measurement must never disturb reading.
        fetch(`/api/letters/${letterId}/reached-end`, {
          method: 'POST',
          keepalive: true,
        }).catch(() => {})
      },
      { threshold: 0.6 },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [letterId, isLast, isPreview])

  function goTo(next: number) {
    const bounded = Math.max(0, Math.min(total - 1, next))
    setCurrent(bounded)
    // Focus lands on the page heading, so a keyboard reader is not left
    // wherever the old button used to be.
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-8">
      {isPreview && (
        <p className="rounded border p-3 text-sm">
          <strong>Preview.</strong> This letter is not published, so nobody
          else can open it and nothing is being counted.
        </p>
      )}

      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-sm opacity-70 outline-none"
      >
        Page {current + 1} of {total}
      </h1>

      {/* Mobile only. The photo is the default, and the text is one tap away. */}
      {total > 0 && (
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setShowTranscription((shown) => !shown)}
            aria-pressed={showTranscription}
            className="rounded border px-3 py-2 text-sm"
          >
            {showTranscription ? 'Show the handwriting' : 'Show the transcription'}
          </button>
        </div>
      )}

      <div className="letter-stage" data-showing={showTranscription ? 'text' : 'photo'}>
        {renderedPages.map((page, i) => (
          <div
            key={i}
            className="letter-page"
            data-active={i === current ? 'true' : 'false'}
            // Pages that are not on screen stay in the DOM but out of the
            // accessibility tree and out of tab order, rather than being
            // unmounted — the text of every page ships in the HTML.
            aria-hidden={i === current ? undefined : true}
            inert={i !== current}
          >
            {page}
          </div>
        ))}
      </div>

      <nav
        className="flex items-center justify-between gap-4"
        aria-label="Pages"
      >
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          className="rounded border px-4 py-2 disabled:opacity-40"
        >
          Previous page
        </button>

        <span aria-live="polite" className="text-sm opacity-70">
          {current + 1} / {total}
        </span>

        <button
          type="button"
          onClick={() => goTo(current + 1)}
          disabled={isLast}
          className="rounded border px-4 py-2 disabled:opacity-40"
        >
          Next page
        </button>
      </nav>

      <div ref={endRef} className="min-h-24 pt-4">
        {isLast && (
          <p className="text-sm opacity-80">
            That is the whole letter. If any of it is worth a reply, the
            smallest one is welcome.
          </p>
        )}
      </div>
    </main>
  )
}

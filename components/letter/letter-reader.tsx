'use client'

import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { HighlightReveal } from './highlight-reveal'

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
 * which is the whole difference between this and a blog post. The turn is
 * directional — forward leans away to the left, back comes in from the left —
 * so the motion says which way you went.
 *
 * On a phone the photo and the transcription cannot both fit at 375px without
 * one becoming a useless thumbnail, so they toggle, and the photo opens
 * first because the handwriting is the point.
 */
export function LetterReader({ letterId, renderedPages, isPreview }: Props) {
  const [current, setCurrent] = useState(0)
  const [showTranscription, setShowTranscription] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const reported = useRef(false)
  const headingRef = useRef<HTMLParagraphElement>(null)
  const reduceMotion = useReducedMotion()

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
    if (bounded === current) return
    setCurrent(bounded)
    // Focus lands on the page counter, so a keyboard reader is not left
    // wherever the old button used to be.
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement) {
        const tag = event.target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
      }
      if (event.key === 'ArrowRight') goTo(current + 1)
      if (event.key === 'ArrowLeft') goTo(current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /*
    Motion walks straight past the global prefers-reduced-motion reset — that
    block only zeroes CSS — so anything animated here asks for itself.

    Every page stays mounted, so what animates is which one is on top. Pages
    behind lean away in the direction they were left: turned past, or not yet
    reached.
  */
  const pageState = (i: number) => {
    if (i === current) return 'settled'
    return i < current ? 'turned' : 'ahead'
  }

  const variants = reduceMotion
    ? {
        settled: { opacity: 1 },
        turned: { opacity: 0 },
        ahead: { opacity: 0 },
      }
    : {
        settled: { opacity: 1, rotateY: 0, x: 0, scale: 1 },
        turned: { opacity: 0, rotateY: -9, x: -44, scale: 0.985 },
        ahead: { opacity: 0, rotateY: 9, x: 44, scale: 0.985 },
      }

  return (
    <main className="letter-shell">
      {isPreview && (
        <p className="preview-banner">
          <span className="meta">Preview</span> Not published, so nobody else
          can open it and nothing is being counted.
        </p>
      )}

      <header className="letter-masthead">
        <span className="display letter-wordmark">from anna</span>
        <span className="rule" aria-hidden="true" />
        <p
          ref={headingRef}
          tabIndex={-1}
          className="meta letter-counter"
          aria-live="polite"
        >
          Page {current + 1} of {total}
        </p>
      </header>

      <div className="letter-toggle-row">
          <button
            type="button"
            onClick={() => setShowTranscription((shown) => !shown)}
            aria-pressed={showTranscription}
            className="pill"
          >
          {showTranscription ? 'The handwriting' : 'The transcription'}
        </button>
      </div>

      <div
        className="letter-stage"
        data-showing={showTranscription ? 'text' : 'photo'}
      >
        {renderedPages.map((page, i) => (
          <motion.div
            key={i}
            className="letter-page"
            data-active={i === current ? 'true' : 'false'}
            // Every page is in the DOM and in the server HTML. The ones that
            // are not on screen leave the accessibility tree and tab order
            // instead of being unmounted — the text of a letter should not
            // depend on which page happens to be showing.
            aria-hidden={i === current ? undefined : true}
            inert={i !== current}
            variants={variants}
            initial={false}
            animate={pageState(i)}
            transition={{
              duration: reduceMotion ? 0.14 : 0.42,
              ease: [0.23, 1, 0.32, 1],
              // Fading out runs shorter than settling in, so the arriving
              // page is already legible while the old one is still leaving.
              opacity: {
                duration: reduceMotion ? 0.14 : i === current ? 0.4 : 0.26,
              },
            }}
          >
            <HighlightReveal>{page}</HighlightReveal>
          </motion.div>
        ))}
      </div>

      <nav className="letter-nav" aria-label="Pages">
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          className="pill"
        >
          <span aria-hidden="true">←</span> Previous
        </button>

        {total > 1 && (
          <ol className="letter-dots" aria-hidden="true">
            {renderedPages.map((_, i) => (
              <li key={i} data-active={i === current ? 'true' : 'false'} />
            ))}
          </ol>
        )}

        <button
          type="button"
          onClick={() => goTo(current + 1)}
          disabled={isLast}
          className="pill"
        >
          Next <span aria-hidden="true">→</span>
        </button>
      </nav>

      <div ref={endRef} className="letter-coda">
        {isLast && (
          <p>
            That is the whole letter.
            <br />
            <span className="letter-coda-ask">
              If any of it is worth a reply, the smallest one is welcome.
            </span>
          </p>
        )}
      </div>
    </main>
  )
}

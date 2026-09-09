'use client'

import { useEffect, useRef } from 'react'

/**
 * Sweeps the highlights in as they come into view.
 *
 * The animation is entirely CSS; this only decides *when*, and hands each
 * mark its position in the sequence so a paragraph reveals left to right
 * rather than all at once.
 *
 * Nothing here renders content. The transcription is server-rendered and
 * fully painted before this runs — if the script never loads, the stylesheet
 * has the finished state under `@media (scripting: none)`, so a highlight is
 * never something that only exists once JavaScript arrives.
 */
export function HighlightReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return

    // The stagger is per element, in document order.
    const marks = root.querySelectorAll<HTMLElement>('mark[data-c]')
    marks.forEach((mark, i) => {
      // Cap it: past a handful, a longer queue reads as lag rather than rhythm.
      mark.style.setProperty('--hl-i', String(Math.min(i, 6)))
    })

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.dataset.revealed = 'true'
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          ;(entry.target as HTMLElement).dataset.revealed = 'true'
          observer.unobserve(entry.target)
        }
      },
      // An observer aimed at something with no box never fires; this is on a
      // wrapper with real content in it.
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [children])

  return (
    <div ref={ref} data-revealed="false">
      {children}
    </div>
  )
}

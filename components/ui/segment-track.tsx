'use client'

import { useCallback, useLayoutEffect, useRef, type ReactNode } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'

type Props = { children: ReactNode; label: string; className?: string }

/** Owned entrepta adaptation: preserves the semantics of the links and steps. */
export function SegmentTrack({ children, label, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const previous = useRef<{ selected: HTMLElement; geometry: string } | null>(
    null,
  )
  const reducedMotion = useReducedMotion()

  // Which edges still have something past them. A track that scrolls says so
  // with a fade on those edges, and only on those: a fade on the end that is
  // already showing would dim the item the reader is looking at.
  const flagEdges = useCallback(() => {
    const track = ref.current
    if (!track) return
    const room = track.scrollWidth - track.clientWidth
    const start = room > 1 && track.scrollLeft > 1
    const end = room > 1 && track.scrollLeft < room - 1
    track.toggleAttribute('data-overflow-start', start)
    track.toggleAttribute('data-overflow-end', end)
  }, [])

  const measure = useCallback((resize = false) => {
    const track = ref.current
    if (!track) return
    const selected = track.querySelector<HTMLElement>(
      '[aria-pressed="true"], [aria-current="page"], [aria-current="step"], [aria-current="true"]',
    )
    const parent = track.getBoundingClientRect()
    if (!selected || !parent.width || !parent.height) {
      delete track.dataset.ready
      previous.current = null
      return
    }
    const box = selected.getBoundingClientRect()
    const geometry = [
      box.left - parent.left + track.scrollLeft - track.clientLeft,
      box.top - parent.top - track.clientTop,
      box.width,
      box.height,
    ]
    const key = geometry.join(',')
    if (
      previous.current?.selected === selected &&
      previous.current.geometry === key
    )
      return
    track.dataset.moving = String(
      !resize && !!previous.current && previous.current.selected !== selected,
    )
    for (const [i, axis] of ['x', 'y', 'w', 'h'].entries()) {
      track.style.setProperty(`--segment-${axis}`, `${geometry[i]}px`)
    }
    track.dataset.ready = 'true'

    // On a narrow screen the track scrolls, and the current item has to be
    // in view or the indicator is pointing at nothing. Only the track moves,
    // never the page, and not on a resize, where the reader did not ask.
    const moved = previous.current?.selected !== selected
    if (!resize && moved && track.scrollWidth > track.clientWidth + 1) {
      const target = geometry[0] - (track.clientWidth - geometry[2]) / 2
      const max = track.scrollWidth - track.clientWidth
      track.scrollTo({
        left: Math.min(Math.max(target, 0), max),
        behavior: reducedMotion ? 'auto' : 'smooth',
      })
    }
    previous.current = { selected, geometry: key }
  }, [reducedMotion])

  // Measure in the same commit as the pressed state, before the browser paints.
  useLayoutEffect(() => {
    measure()
    flagEdges()
  })
  useLayoutEffect(() => {
    const track = ref.current
    if (!track) return
    const observer = new MutationObserver(() => measure())
    observer.observe(track, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-pressed', 'aria-current'],
    })
    const resize = new ResizeObserver(() => {
      measure(true)
      flagEdges()
    })
    resize.observe(track)
    track.addEventListener('scroll', flagEdges, { passive: true })
    let disposed = false
    document.fonts.ready.then(() => {
      if (!disposed) measure(true)
    })
    return () => {
      disposed = true
      observer.disconnect()
      resize.disconnect()
      track.removeEventListener('scroll', flagEdges)
    }
  }, [measure, flagEdges])
  return (
    <div
      ref={ref}
      className={`segment-track ${className}`}
      role="group"
      aria-label={label}
      data-reduced-motion={reducedMotion || undefined}
    >
      {children}
    </div>
  )
}

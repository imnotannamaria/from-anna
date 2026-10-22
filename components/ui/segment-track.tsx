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
    previous.current = { selected, geometry: key }
  }, [])

  // Measure in the same commit as the pressed state, before the browser paints.
  useLayoutEffect(() => {
    measure()
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
    const resize = new ResizeObserver(() => measure(true))
    resize.observe(track)
    let disposed = false
    document.fonts.ready.then(() => {
      if (!disposed) measure(true)
    })
    return () => {
      disposed = true
      observer.disconnect()
      resize.disconnect()
    }
  }, [measure])
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

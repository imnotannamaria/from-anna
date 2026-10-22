'use client'

import { useEffect, useRef } from 'react'
import { Icon } from '@/components/ui/icon'
import { SegmentTrack } from '@/components/ui/segment-track'

type Props = {
  sheet: number
  count: number
  onSheet: (index: number) => void
  busy?: boolean
}
/** Remains mounted across turns, so the originating keyboard control keeps focus. */
export function DeckControls({ sheet, count, onSheet, busy = false }: Props) {
  const backRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const atStart = sheet === 0,
    atEnd = sheet === count - 1
  useEffect(() => {
    const active = document.activeElement
    if (active === backRef.current && atStart) nextRef.current?.focus()
    else if (active === nextRef.current && atEnd) backRef.current?.focus()
  }, [atStart, atEnd])
  return (
    <nav className="island deck-controls" aria-label="Sheets" aria-busy={busy}>
      <button
        ref={backRef}
        type="button"
        className="pill pill--icon"
        onClick={() => {
          if (!busy && !atStart) onSheet(sheet - 1)
        }}
        aria-disabled={atStart || busy}
        aria-busy={busy}
        data-busy={busy || undefined}
        aria-label={busy ? 'Turning the page' : 'Previous sheet'}
      >
        <Icon name="left" />
      </button>
      <SegmentTrack label="Choose a sheet">
        {Array.from({ length: count }, (_, index) => (
          <button
            key={index}
            type="button"
            className="pill pill--icon"
            aria-current={sheet === index ? 'page' : undefined}
            aria-disabled={busy}
            aria-label={`Sheet ${index + 1} of ${count}`}
            onClick={() => {
              if (!busy) onSheet(index)
            }}
          >
            {index + 1}
          </button>
        ))}
      </SegmentTrack>
      <button
        ref={nextRef}
        type="button"
        className="pill pill--icon"
        onClick={() => {
          if (!busy && !atEnd) onSheet(sheet + 1)
        }}
        aria-disabled={atEnd || busy}
        aria-busy={busy}
        data-busy={busy || undefined}
        aria-label={busy ? 'Turning the page' : 'Next sheet'}
      >
        <Icon name="right" />
      </button>
      <p className="sr-only" aria-live="polite">
        {busy ? 'Turning the page' : `Sheet ${sheet + 1} of ${count}`}
      </p>
    </nav>
  )
}

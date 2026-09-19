'use client'

import { useEffect, useRef } from 'react'

type Props = {
  sheet: number
  count: number
  onSheet: (index: number) => void
  busy?: boolean
}

/** Arrow controls retain focus during a turn and announce its settled position. */
export function DeckControls({ sheet, count, onSheet, busy = false }: Props) {
  const backRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  const atStart = sheet === 0
  const atEnd = sheet === count - 1

  useEffect(() => {
    const active = document.activeElement
    // Only ever moves focus that is already on one of these two arrows, and
    // only when that arrow has just become unusable. Focus anywhere else on
    // the page is none of this component's business.
    if (active !== backRef.current && active !== nextRef.current) return

    if (active === backRef.current && atStart) nextRef.current?.focus()
    else if (active === nextRef.current && atEnd) backRef.current?.focus()
  }, [atStart, atEnd])

  return (
    <nav className="deck-controls" aria-label="Sheets" aria-busy={busy}>
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
        <span aria-hidden="true">←</span>
      </button>

      <p className="deck-count meta" aria-hidden="true">
        {sheet + 1} / {count}
      </p>

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
        <span aria-hidden="true">→</span>
      </button>

      {/*
        The count above is `aria-hidden` and this says the same thing, because
        the two have different jobs: one is a label that is always on screen,
        the other only speaks when the number changes. Announcing both would
        read the position twice on every turn.
      */}
      <p className="sr-only" aria-live="polite">
        {busy ? 'Turning the page' : `Sheet ${sheet + 1} of ${count}`}
      </p>
    </nav>
  )
}

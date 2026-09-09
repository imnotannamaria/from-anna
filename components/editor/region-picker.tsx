'use client'

import { useRef, useState } from 'react'

export type PickerPage = {
  index: number
  src: string
  alt: string
  width: number
  height: number
}

type Props = {
  pages: PickerPage[]
  /** Which sheet the caret is on, worked out from the `---` before it. */
  sheetIndex: number
  /** Called with `"top bottom"`, or with nothing to mark a passage regionless. */
  onMark: (at?: string) => void
}

/**
 * Drawing a band on the photograph.
 *
 * A region says which part of the sheet a passage was written on, and the
 * only honest way to know that is to look. So this is a photograph you drag
 * down: no derivation, no guess from line counts, nothing that can be subtly
 * wrong in a way nobody notices.
 *
 * It writes the region **into the markdown**, as `:::passage{at="…"}`. The
 * markdown stays the one source of truth for a letter — the same reason
 * highlights are directives rather than rows in a table, and the reason
 * fixing a comma cannot break anything here either.
 *
 * Marking a region is optional. A passage without one falls back to a
 * proportional band, so this is an upgrade for the pages that deserve it
 * rather than a step every letter has to go through.
 */
export function RegionPicker({ pages, sheetIndex, onMark }: Props) {
  const page = pages[Math.min(sheetIndex, pages.length - 1)]
  const frameRef = useRef<HTMLDivElement>(null)
  const [band, setBand] = useState<{ top: number; bottom: number } | null>(null)
  const dragFrom = useRef<number | null>(null)

  if (!page) return null

  const fractionAt = (clientY: number) => {
    const box = frameRef.current?.getBoundingClientRect()
    if (!box || box.height === 0) return 0
    return Math.min(1, Math.max(0, (clientY - box.top) / box.height))
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    // Pointer events rather than mouse: the same code then works with a
    // trackpad, a touchscreen and a stylus, which is the device most likely
    // to be in the hand of someone marking up a scan.
    const at = fractionAt(event.clientY)
    dragFrom.current = at
    setBand({ top: at, bottom: at })

    // Capture keeps the drag alive past the edge of the photograph. It is an
    // improvement, not a requirement — and it throws on a pointer id the
    // browser no longer considers active, which would otherwise take the
    // whole drag down with it.
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Dragging still works inside the frame, which is where it happens.
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (dragFrom.current === null) return
    const at = fractionAt(event.clientY)
    const from = dragFrom.current
    setBand({ top: Math.min(from, at), bottom: Math.max(from, at) })
  }

  function onPointerUp() {
    dragFrom.current = null
    // A tap rather than a drag is a click, not a zero-height region. Give it
    // a sensible band around where it landed instead of a line with no height.
    setBand((current) => {
      if (!current) return current
      if (current.bottom - current.top >= 0.04) return current
      const centre = (current.top + current.bottom) / 2
      return {
        top: Math.max(0, centre - 0.06),
        bottom: Math.min(1, centre + 0.06),
      }
    })
  }

  /** Nudge an edge from the keyboard, so a pointer is never the only route. */
  function nudge(edge: 'top' | 'bottom', by: number) {
    setBand((current) => {
      const base = current ?? { top: 0.2, bottom: 0.35 }
      const next = { ...base, [edge]: base[edge] + by }
      return {
        top: Math.min(Math.max(0, next.top), 0.98),
        bottom: Math.min(Math.max(0.02, next.bottom), 1),
      }
    })
  }

  const at = band
    ? `${band.top.toFixed(2)} ${band.bottom.toFixed(2)}`
    : undefined

  return (
    <section className="admin-section">
      <div className="admin-card-head">
        <p className="meta" id="region-picker-label">
          Region · sheet {page.index + 1}
        </p>
        <span className="meta">{at ?? 'no region'}</span>
      </div>

      <p className="editor-hint">
        Drag down the photograph to say where this passage was written. A
        passage without a region falls back to a proportional band, so this is
        worth doing for the pages that need it and skipping for the ones that
        do not.
      </p>

      <div className="region-grid">
        <div
          ref={frameRef}
          className="region-frame"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.src}
            alt={page.alt}
            width={page.width}
            height={page.height}
            draggable={false}
          />
          {band && (
            <span
              className="region-band"
              aria-hidden="true"
              style={{
                top: `${band.top * 100}%`,
                height: `${(band.bottom - band.top) * 100}%`,
              }}
            />
          )}
        </div>

        <div className="region-controls">
          {/*
            The drag is the fast route and these are the reachable one. A
            region that can only be set by dragging is a region that cannot be
            set with a keyboard.
          */}
          <div
            className="region-nudges"
            role="group"
            aria-labelledby="region-picker-label"
          >
            <button type="button" className="pill" onClick={() => nudge('top', -0.02)}>
              Top <span aria-hidden="true">↑</span>
              <span className="sr-only">move the top of the region up</span>
            </button>
            <button type="button" className="pill" onClick={() => nudge('top', 0.02)}>
              Top <span aria-hidden="true">↓</span>
              <span className="sr-only">move the top of the region down</span>
            </button>
            <button
              type="button"
              className="pill"
              onClick={() => nudge('bottom', -0.02)}
            >
              Bottom <span aria-hidden="true">↑</span>
              <span className="sr-only">move the bottom of the region up</span>
            </button>
            <button
              type="button"
              className="pill"
              onClick={() => nudge('bottom', 0.02)}
            >
              Bottom <span aria-hidden="true">↓</span>
              <span className="sr-only">move the bottom of the region down</span>
            </button>
          </div>

          <div className="editor-bar">
            <button
              type="button"
              className="pill"
              disabled={!at}
              onClick={() => onMark(at)}
            >
              Mark this passage
            </button>
            <button type="button" className="pill" onClick={() => onMark()}>
              Passage, no region
            </button>
            {band && (
              <button type="button" className="pill" onClick={() => setBand(null)}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

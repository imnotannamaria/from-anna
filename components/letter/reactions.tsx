'use client'

import { useEffect, useRef, useState } from 'react'

import { Icon } from '@/components/ui/icon'
import {
  REACTIONS,
  type ReactionCounts,
  type ReactionId,
} from '@/lib/letters/reactions'

type Props = {
  letterId: string
  counts: ReactionCounts
  /** This reader's own picks, read on the server from their session. */
  mine: ReactionId[]
  /**
   * The counts show and nothing can be chosen: the author checking the
   * letter, or a preview. Neither is a reader, so neither gets to answer.
   */
  readOnly: boolean
  enhanced: boolean
}

/**
 * How a reader answers the letter: the smallest reply there is.
 *
 * It is a row of what the letter has been answered with and a button that
 * opens the list to add to it, the way a message is answered in a chat app.
 * A click moves the count at once and tells the server; if the server says
 * no, it moves back and says so. Each reaction waits for its own pending
 * write before it takes another toggle, so a double click is one change.
 *
 * Nothing here is the letter, so nothing here exists without a script: the
 * letter is complete in the server HTML and a button that does nothing
 * without one would be worse than no button.
 */
export function Reactions({
  letterId,
  counts: initial,
  mine: initialMine,
  readOnly,
  enhanced,
}: Props) {
  const [counts, setCounts] = useState(initial)
  const [mine, setMine] = useState(initialMine)
  const [open, setOpen] = useState(false)
  const [flights, setFlights] = useState<Partial<Record<ReactionId, number>>>(
    {},
  )
  const [announcement, setAnnouncement] = useState('')
  const [failed, setFailed] = useState(false)

  // What is picked, for the code that runs between two renders: a second
  // click before React has committed the first must see the first.
  const picks = useRef(new Set<ReactionId>(initialMine))
  const pending = useRef(new Set<ReactionId>())

  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  // A picker is dismissed by anything that is not the picker: a press
  // outside it, Escape, or focus moving on.
  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    // Into the list, so a keyboard reader does not have to find it.
    pickerRef.current?.querySelector<HTMLElement>('button')?.focus()

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!enhanced) return null

  const shown = REACTIONS.filter(
    ({ id }) => counts[id] > 0 || mine.includes(id),
  )

  const choose = (next: Set<ReactionId>) => {
    picks.current = next
    setMine(REACTIONS.map(({ id }) => id).filter((id) => next.has(id)))
  }

  const toggle = (reaction: ReactionId) => {
    if (readOnly || pending.current.has(reaction)) return
    pending.current.add(reaction)
    setFailed(false)

    const on = !picks.current.has(reaction)
    const label = REACTIONS.find((item) => item.id === reaction)?.label
    const before = counts[reaction]

    const next = new Set(picks.current)
    if (on) next.add(reaction)
    else next.delete(reaction)
    choose(next)
    setCounts((now) => ({
      ...now,
      [reaction]: Math.max(0, now[reaction] + (on ? 1 : -1)),
    }))
    if (on) setFlights((now) => ({ ...now, [reaction]: (now[reaction] ?? 0) + 1 }))
    setAnnouncement(on ? `Reacted: ${label}` : `Removed: ${label}`)

    void (async () => {
      try {
        const res = await fetch(`/api/letters/${letterId}/react`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reaction, on }),
        })
        if (!res.ok) throw new Error(String(res.status))
        const body = (await res.json()) as { reactions?: ReactionCounts }
        // Only the reaction that was clicked takes its number from the reply:
        // another click still on its way would be undone by taking them all.
        if (body.reactions) {
          const confirmed = body.reactions[reaction]
          setCounts((now) => ({ ...now, [reaction]: confirmed }))
        }
      } catch {
        const undone = new Set(picks.current)
        if (on) undone.delete(reaction)
        else undone.add(reaction)
        choose(undone)
        setCounts((now) => ({ ...now, [reaction]: before }))
        setFailed(true)
        setAnnouncement('That reaction could not be saved. Try again.')
      } finally {
        pending.current.delete(reaction)
      }
    })()
  }

  return (
    <section className="reactions" aria-label="Reactions to this letter">
      <div className="reactions-inner" ref={wrapRef}>
        {shown.length > 0 && (
          <ul className="reactions-list">
            {shown.map(({ id, emoji, label }) => {
              const active = mine.includes(id)
              return (
                <li key={id}>
                  {readOnly ? (
                    <span className="reaction" data-static="true">
                      <span className="reaction-emoji" aria-hidden="true">
                        {emoji}
                      </span>
                      <span className="reaction-count" aria-hidden="true">
                        {counts[id]}
                      </span>
                      <span className="sr-only">
                        {label}: {counts[id]}
                      </span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="reaction"
                      aria-pressed={active}
                      aria-label={`${label}: ${counts[id]}`}
                      onClick={() => toggle(id)}
                    >
                      <span className="reaction-emoji" aria-hidden="true">
                        {emoji}
                      </span>
                      <span className="reaction-count" aria-hidden="true">
                        {counts[id]}
                      </span>
                      {flights[id] ? (
                        <span
                          key={flights[id]}
                          className="reaction-flight"
                          aria-hidden="true"
                        >
                          {emoji}
                        </span>
                      ) : null}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {readOnly && shown.length === 0 && (
          // The author and a draft preview cannot answer, but the place where
          // a reader will is still shown, so the page is the one a reader gets.
          <span className="reaction reaction--add" data-static="true">
            <Icon name="react" />
            <span>Readers react here</span>
          </span>
        )}

        {!readOnly && (
          <button
            ref={triggerRef}
            type="button"
            className="reaction reaction--add"
            data-bare={shown.length > 0 || undefined}
            aria-label="Add a reaction"
            aria-expanded={open}
            aria-controls="reaction-picker"
            onClick={() => setOpen((now) => !now)}
          >
            <Icon name="react" />
            {shown.length === 0 && <span>React</span>}
          </button>
        )}

        {open && (
          <div
            id="reaction-picker"
            ref={pickerRef}
            className="reaction-picker"
            role="group"
            aria-label="Choose a reaction"
          >
            {REACTIONS.map(({ id, emoji, label }) => (
              <button
                key={id}
                type="button"
                className="reaction-choice"
                aria-pressed={mine.includes(id)}
                aria-label={label}
                title={label}
                onClick={() => {
                  toggle(id)
                  setOpen(false)
                  triggerRef.current?.focus()
                }}
              >
                <span aria-hidden="true">{emoji}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="reactions-note" role="status" data-failed={failed || undefined}>
        {announcement}
      </p>
    </section>
  )
}

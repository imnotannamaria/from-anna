'use client'

type Props = {
  /** Who it is for, if I said. `null` reads as "you". */
  recipient: string | null
  tags: readonly string[]
  filter: string | null
  onFilter: (tag: string | null) => void
  enhanced: boolean
  progress: number
}

/**
 * The bar that stays.
 *
 * Addressed, the way a letter is: *from anna to you*, or to whoever it was
 * written for. That line is the whole centre of the bar and nothing else
 * goes there.
 *
 * At 390px the chips go — filtering by colour is a way of re-reading a letter
 * rather than a way of reading it. The address stays, and it is the only thing
 * that is always here.
 *
 * The photo/transcription toggle used to live here, below 900px only, because
 * a wide screen showed both halves at once. The sheet has two faces now and
 * the control that turns it belongs on the sheet, at every width.
 */
export function ReaderBar({
  recipient,
  tags,
  filter,
  onFilter,
  enhanced,
  progress,
}: Props) {
  return (
    <header className="reader-bar">
      {/* Decorative: how far down the letter you are. */}
      <div className="reader-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      <p className="reader-name">
        from anna <em>to {recipient ?? 'you'}</em>
      </p>

      <div className="reader-controls">
        {enhanced && (
          <div className="legend" role="group" aria-label="Highlights">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className="chip"
                data-tag={tag}
                aria-pressed={filter === tag}
                onClick={() => onFilter(filter === tag ? null : tag)}
              >
                <span className="chip-swatch" aria-hidden="true" />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}

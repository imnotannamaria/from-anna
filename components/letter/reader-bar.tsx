'use client'

type Props = {
  name: string[]
  tags: readonly string[]
  filter: string | null
  onFilter: (tag: string | null) => void
  showing: 'photo' | 'text'
  onShowing: (showing: 'photo' | 'text') => void
  enhanced: boolean
  progress: number
}

/**
 * The bar that stays.
 *
 * Nothing in it comes from inside the letter. The name is the three words of
 * the slug, which the reader already has in their address bar, and the
 * counter is their own position — a fixed strip that is on screen the whole
 * way down is the last place to put something private.
 *
 * Three regions and one width, so something has to give at 390px. What gives
 * is the name and the chips: the name reappears in full in the opening, where
 * it has a line to itself, and filtering by colour is a way of re-reading a
 * letter rather than a way of reading it. What stays is the wordmark and the
 * photo/transcription toggle, because that toggle is the only control on a
 * phone that changes what you can see.
 */
export function ReaderBar({
  name,
  tags,
  filter,
  onFilter,
  showing,
  onShowing,
  enhanced,
  progress,
}: Props) {
  return (
    <header className="reader-bar">
      {/* Decorative: the same fact is written out in the coda. */}
      <div className="reader-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>

      <span className="display reader-wordmark">from anna</span>

      <p className="meta reader-name">{name.join(' · ')}</p>

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

        {enhanced && (
          <button
            type="button"
            className="pill reader-toggle"
            aria-pressed={showing === 'text'}
            onClick={() => onShowing(showing === 'text' ? 'photo' : 'text')}
          >
            {showing === 'text' ? 'The handwriting' : 'The transcription'}
          </button>
        )}
      </div>
    </header>
  )
}

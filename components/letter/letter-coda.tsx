'use client'

type Props = {
  ref: React.Ref<HTMLElement>
  writeBackEmail: string | null
  name: string[]
  onReadAgain: () => void
  enhanced: boolean
}

/**
 * The end of the letter.
 *
 * Two things happen here and they are related. It is where "reached the end"
 * is recorded — the second of the two marks that tell *never opened* apart
 * from *opened and abandoned* — and it is where that measurement is written
 * down in plain words for the person it was taken from.
 *
 * **The privacy line is literal, and has to stay true.** One row per open,
 * deduplicated per session with a cookie, no IP in a column or a log. If the
 * measurement ever changes, that sentence changes in the same commit.
 *
 * The reply address comes from an env var rather than the repository. An
 * address on a public page gets harvested eventually; when that becomes a
 * problem the swap is to a form, and the button is the only thing that moves.
 */
export function LetterCoda({
  ref,
  writeBackEmail,
  name,
  onReadAgain,
  enhanced,
}: Props) {
  const subject = encodeURIComponent(`Re: ${name.join(' · ')}`)

  return (
    <section ref={ref} className="coda" aria-label="The end of the letter">
      <div className="coda-inner">
        <p className="meta">The end of the page</p>

        <p className="display coda-line">
          That is the whole letter.{' '}
          <em>If any of it is worth a reply, the smallest one is welcome.</em>
        </p>

        <div className="coda-actions">
          {writeBackEmail && (
            <a
              className="pill pill--solid"
              href={`mailto:${writeBackEmail}?subject=${subject}`}
            >
              Write back <span aria-hidden="true">→</span>
            </a>
          )}

          {enhanced && (
            <button type="button" className="pill" onClick={onReadAgain}>
              Read it again
            </button>
          )}
        </div>

        <p className="meta coda-privacy">
          read to the end · counted once · nothing else is stored
        </p>
      </div>
    </section>
  )
}

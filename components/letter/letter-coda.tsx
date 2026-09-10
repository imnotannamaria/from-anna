'use client'

type Props = {
  ref: React.Ref<HTMLElement>
  writeBackEmail: string | null
  onReadAgain: () => void
  enhanced: boolean
}

/**
 * The end of the letter.
 *
 * It is where "reached the end" is recorded — the second of the two marks
 * that tell *never opened* apart from *opened and abandoned*.
 *
 * The reply address comes from an env var rather than the repository. An
 * address on a public page gets harvested eventually; when that becomes a
 * problem the swap is to a form, and the button is the only thing that moves.
 */
export function LetterCoda({
  ref,
  writeBackEmail,
  onReadAgain,
  enhanced,
}: Props) {
  const subject = encodeURIComponent('Re: your letter')

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

      </div>
    </section>
  )
}

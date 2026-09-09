type Props = {
  name: string[]
  sentOn: string | null
  photo: React.ReactNode
  sheetCount: number
}

/**
 * The opening.
 *
 * The photograph is the argument, so it is the first thing on screen at a
 * size worth looking at: off-centre, tilted a degree and a half, running off
 * the right edge the way a sheet does when it is put down on a desk rather
 * than filed.
 *
 * It is the same sheet that appears again below, with the real `alt` and the
 * transcription attached to it, so this copy is decorative and says so.
 * Announcing the same photograph twice would make a screen reader's version
 * of the page longer than the letter.
 *
 * Nothing here is the letter's text. The heading describes the object, and
 * the name is the slug the reader arrived on.
 */
export function LetterHero({ name, sentOn, photo, sheetCount }: Props) {
  return (
    <section className="hero" aria-label="Opening">
      <div className="hero-copy">
        <p className="meta hero-name" style={{ animationDelay: '80ms' }}>
          {name.join(' · ')}
        </p>

        <h1 className="display hero-title" style={{ animationDelay: '160ms' }}>
          A letter,
          <br />
          written <em>by hand.</em>
        </h1>

        <span
          className="rule hero-rule"
          aria-hidden="true"
          style={{ animationDelay: '280ms' }}
        />

        <p className="hero-lede" style={{ animationDelay: '360ms' }}>
          The photograph is what you see. The transcription beside it is what
          you can <mark data-c="important">actually read</mark> — because a
          picture of handwriting is invisible to a screen reader, and a letter
          nobody can read is not a letter.
        </p>

        <p className="meta hero-meta" style={{ animationDelay: '460ms' }}>
          {sheetCount === 1 ? 'one sheet' : `${sheetCount} sheets`}
          {sentOn && <> · {sentOn}</>} · <span>unlisted link</span>
        </p>

        <div
          className="hero-cue"
          aria-hidden="true"
          style={{ animationDelay: '640ms' }}
        >
          <span className="meta">Read</span>
          <span className="hero-cue-arrow">↓</span>
        </div>
      </div>

      <div className="hero-photo">
        {/*
          Decorative, and the reason is above: the same sheet is below with
          its real description and its transcription. Hiding it here keeps the
          spoken version of the page as short as the read one.
        */}
        <div aria-hidden="true">{photo}</div>
        <span className="hero-caption" aria-hidden="true">
          sheet 01 · as photographed
        </span>
      </div>
    </section>
  )
}

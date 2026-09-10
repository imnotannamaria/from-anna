'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { LetterCoda } from './letter-coda'
import { LetterHero } from './letter-hero'
import { ReaderBar } from './reader-bar'

export type SheetProps = {
  key: string
  /** `<ScannedPhoto>`, rendered on the server. */
  photo: React.ReactNode
  /** `<ScannedTranscription>`, rendered on the server. The content. */
  prose: React.ReactNode
  /** `width / height` of the photo, so the frame reserves the right box. */
  ratio: number
}

type Props = {
  letterId: string
  isPreview: boolean
  /** Who it is for, if I said. The bar reads "to you" when this is null. */
  recipient: string | null
  /** Formatted on the server, in UTC, so it cannot disagree with itself. */
  sentOn: string | null
  /** From an env var, never the repository. Null hides the button. */
  writeBackEmail: string | null
  tags: readonly string[]
  sheets: SheetProps[]
  /** The first sheet again, decorative, for the opening. */
  heroPhoto: React.ReactNode
}

/**
 * How far, in px, the opening photograph drifts. The same number is
 * `--hero-drift` in `globals.css`, which reserves that much room below it:
 * past that the photograph would slide over the first lines of the letter.
 */
const HERO_DRIFT = 48

/**
 * The reading view.
 *
 * A letter is read straight through, so the page scrolls straight through.
 * The photograph of each sheet pins itself while its transcription moves past,
 * which is closer to sitting with a letter than paging through a document —
 * and it is what replaced the previous/next buttons on a wide screen. On a
 * phone there is one column, so nothing pins and the two halves toggle.
 *
 * Three things are load-bearing and easy to undo by accident:
 *
 * 1. **The transcription is server-rendered and arrives complete.** Nothing
 *    here creates content; it adds `data-` attributes to text that is already
 *    painted. With no JavaScript the letter reads top to bottom, unmoved.
 * 2. **The reveal moves `translateY` and never opacity.** A passage held at
 *    12% opacity is unreadable, and the page's whole argument is that the
 *    transcription is the part you can read.
 * 3. **`position: sticky` dies silently** if any ancestor has `overflow`
 *    other than `visible`. There is no error and no warning; the photograph
 *    simply scrolls away.
 *
 * The photograph used to zoom and pan to the band of the sheet the current
 * passage was written on. It is gone: see `docs/design/DECISIONS.md`.
 */
export function LetterView({
  letterId,
  isPreview,
  recipient,
  sentOn,
  writeBackEmail,
  tags,
  sheets,
  heroPhoto,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const codaRef = useRef<HTMLElement>(null)
  const reported = useRef(false)

  const [filter, setFilter] = useState<string | null>(null)
  const [showing, setShowing] = useState<'photo' | 'text'>('photo')
  const [progress, setProgress] = useState(0)
  const [heroShift, setHeroShift] = useState(0)

  // The chips and the photo/transcription toggle are enhancements: with no
  // JavaScript they do nothing, so they do not render rather than rendering
  // broken. Everything they control has a working default without them.
  //
  // `useSyncExternalStore` rather than a `setState` in an effect: the server
  // snapshot is `false` and the client one is `true`, which is the same
  // answer without a second render pass to get there.
  const enhanced = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  /* ---- passages -----------------------------------------------------
     The transcription arrives as finished HTML, so the passages are
     whatever its top-level blocks turned out to be. They are found here
     rather than constructed, which is what keeps the markdown the source of
     truth for a letter's shape. */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const found: { el: HTMLElement; sheet: number; index: number }[] = []

    root.querySelectorAll<HTMLElement>('[data-sheet]').forEach((sheetEl) => {
      const sheet = Number(sheetEl.dataset.sheet)
      const prose = sheetEl.querySelector('.scanned-transcription')
      if (!prose) return

      const passages = Array.from(prose.children) as HTMLElement[]
      sheetEl.dataset.passageCount = String(passages.length)

      passages.forEach((el, index) => {
        el.dataset.passage = String(index)
        el.dataset.sheetIndex = String(sheet)

        // Anything already on screen starts settled. Without this a passage
        // that hydrates in view drops 18px and slides back, which is a
        // glitch rather than an entrance.
        el.dataset.seen =
          el.getBoundingClientRect().top < window.innerHeight ? 'true' : 'false'

        // The highlight sweep runs left to right in sequence within a
        // passage. Capped, because past a handful a longer queue reads as
        // lag rather than rhythm.
        el.querySelectorAll<HTMLElement>('mark[data-c]').forEach((mark, i) => {
          mark.style.setProperty('--hl-i', String(Math.min(i, 6)))
        })

        found.push({ el, sheet, index })
      })
    })

    if (found.length === 0) return

    // "Has the reader got here yet", which is generous on purpose: a passage
    // still translated while it sits fully on screen is a bug.
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          ;(entry.target as HTMLElement).dataset.seen = 'true'
          reveal.unobserve(entry.target)
        }
      },
      { threshold: 0, rootMargin: '0px 0px -8% 0px' },
    )

    // A second observer used to track which passage was being read, to light
    // the number in its gutter. The numbers are gone, and so is it.
    for (const { el } of found) reveal.observe(el)

    return () => reveal.disconnect()
  }, [sheets])

  /* ---- progress ------------------------------------------------------
     How far down the letter you are, as a line under the bar. Decorative,
     and a transform, so following the scroll never repaints anything. */
  useEffect(() => {
    let frame = 0
    // The scrollable height is measured on mount and when the document
    // changes size — never inside the scroll handler. Reading a layout value
    // every frame is what makes a sticky page stutter.
    let max = 0

    const measure = () => {
      max = document.documentElement.scrollHeight - window.innerHeight
    }

    const update = () => {
      frame = 0
      const y = window.scrollY
      setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0)
      // The opening photograph drifts slower than the words beside it. Capped,
      // because past a certain distance it stops reading as depth and starts
      // reading as a bug — and it is only ever a transform.
      setHeroShift(Math.min(y * 0.14, HERO_DRIFT))
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    measure()
    update()

    // Photographs arriving change the document height, so the denominator has
    // to be remeasured rather than assumed.
    const resize = new ResizeObserver(() => {
      measure()
      onScroll()
    })
    resize.observe(document.body)

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      resize.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  /* ---- reached the end ----------------------------------------------- */
  useEffect(() => {
    if (isPreview || reported.current) return

    const target = codaRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        if (reported.current) return
        reported.current = true
        observer.disconnect()

        // Fire and forget: a failed measurement must never disturb reading.
        fetch(`/api/letters/${letterId}/reached-end`, {
          method: 'POST',
          keepalive: true,
        }).catch(() => {})
      },
      { threshold: 0.6 },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [letterId, isPreview])

  const scrollToTop = useCallback(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Never a reload: the letter has already been counted as opened, and
    // reading it twice is not two readers.
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }, [])

  const goToSheet = useCallback((index: number) => {
    const target = document.getElementById(`sheet-${index}`)
    if (!target) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }, [])

  return (
    <div
      ref={rootRef}
      className="reader"
      data-filter={filter ?? ''}
      data-showing={showing}
      style={{
        ['--progress' as string]: `${(progress * 100).toFixed(2)}%`,
        ['--hero-shift' as string]: `${heroShift.toFixed(1)}px`,
      }}
    >
      <ReaderBar
        recipient={recipient}
        tags={tags}
        filter={filter}
        onFilter={setFilter}
        showing={showing}
        onShowing={setShowing}
        enhanced={enhanced}
        progress={progress}
      />

      <main className="reader-main">
        {isPreview && (
          <p className="preview-banner">
            <span className="meta">Preview</span> Not published, so nobody else
            can open it and nothing is being counted.
          </p>
        )}

        <LetterHero
          sentOn={sentOn}
          photo={heroPhoto}
          sheetCount={sheets.length}
        />

        {sheets.length > 1 && (
          <nav className="sheet-nav" aria-label="Sheets">
            {sheets.map((sheet, i) => (
              <button
                key={sheet.key}
                type="button"
                className="pill"
                onClick={() => goToSheet(i)}
              >
                Sheet {i + 1}
              </button>
            ))}
          </nav>
        )}

        {sheets.map((sheet, i) => (
          <section
            key={sheet.key}
            id={`sheet-${i}`}
            className="sheet"
            data-sheet={i}
            aria-label={`Sheet ${i + 1} of ${sheets.length}`}
            style={{ ['--sheet-ratio' as string]: String(sheet.ratio) }}
          >
            <div className="sheet-photo">
              <div className="sheet-frame">{sheet.photo}</div>

              <div className="sheet-frame-foot">
                <p className="meta">
                  Sheet {i + 1} of {sheets.length}
                </p>
              </div>
            </div>

            <div className="sheet-text">{sheet.prose}</div>
          </section>
        ))}
      </main>

      <LetterCoda
        ref={codaRef}
        writeBackEmail={writeBackEmail}
        onReadAgain={scrollToTop}
        enhanced={enhanced}
      />
    </div>
  )
}

'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import { regionFor } from 'remark-scanned-page/passage'

import { LetterCoda } from './letter-coda'
import { LetterHero } from './letter-hero'
import { ReaderBar } from './reader-bar'

/**
 * How far into the sheet the passage zoom goes.
 *
 * Measured, not chosen. The sticky photograph occupies 616px at a 1440
 * viewport and 728px at 1920, so on a retina screen it needs roughly 1230 to
 * 1460 device pixels to be sharp at rest. Against the 2400px stored sheet
 * that is a comfortable margin at rest and 97% coverage at 1.5×. Past that it
 * starts to soften, and a soft photograph of handwriting is the one thing
 * this page cannot afford.
 *
 * Raising the stored image is what buys more zoom. Raising this alone only
 * buys blur.
 */
const MAX_ZOOM = 1.5

export type SheetProps = {
  key: string
  /** `<ScannedPhoto>`, rendered on the server. */
  photo: React.ReactNode
  /** `<ScannedTranscription>`, rendered on the server. The content. */
  prose: React.ReactNode
  /** `width / height` of the photo, so the frame never crops it. */
  ratio: number
}

type Props = {
  letterId: string
  isPreview: boolean
  /** The three words of the slug. Never anything from inside the letter. */
  name: string[]
  /** Formatted on the server, in UTC, so it cannot disagree with itself. */
  sentOn: string | null
  /** From an env var, never the repository. Null hides the button. */
  writeBackEmail: string | null
  tags: readonly string[]
  sheets: SheetProps[]
  /** The first sheet again, decorative, for the opening. */
  heroPhoto: React.ReactNode
}

type Active = { sheet: number; passage: number }

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
 */
export function LetterView({
  letterId,
  isPreview,
  name,
  sentOn,
  writeBackEmail,
  tags,
  sheets,
  heroPhoto,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const codaRef = useRef<HTMLElement>(null)
  const reported = useRef(false)

  const [active, setActive] = useState<Active | null>(null)
  const [following, setFollowing] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)
  const [showing, setShowing] = useState<'photo' | 'text'>('photo')
  const [progress, setProgress] = useState(0)

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

    // Two observers, because they answer different questions. This one asks
    // "has the reader got here yet", which is generous on purpose: a passage
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

    // And this one asks "which passage is being read", which is a narrow band
    // across the upper middle of the viewport. Threshold zero plus a margin
    // rather than a ratio, because a passage taller than the band would never
    // reach any ratio and would never become active.
    const visible = new Set<Element>()
    const reading = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target)
          else visible.delete(entry.target)
        }
        const first = found.find((candidate) => visible.has(candidate.el))
        if (first) setActive({ sheet: first.sheet, passage: first.index })
      },
      { threshold: 0, rootMargin: '-25% 0px -45% 0px' },
    )

    for (const { el } of found) {
      reveal.observe(el)
      reading.observe(el)
    }

    return () => {
      reveal.disconnect()
      reading.disconnect()
    }
  }, [sheets])

  /* ---- following the line -------------------------------------------
     Each sheet is told where to look through custom properties, so the
     photograph moves in CSS and nothing here touches a layout value. */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    root.querySelectorAll<HTMLElement>('[data-sheet]').forEach((sheetEl) => {
      const sheet = Number(sheetEl.dataset.sheet)
      const count = Number(sheetEl.dataset.passageCount) || 1
      const isActive = active?.sheet === sheet
      const index = isActive ? active.passage : 0

      const passages = Array.from(
        sheetEl.querySelector('.scanned-transcription')?.children ?? [],
      ) as HTMLElement[]

      // The number in the gutter is the only thing on screen that names the
      // passage the photograph is following. It is not the only signal —
      // the sheet moves and the band moves with it — but it is the one that
      // survives the photograph being switched off on a phone.
      passages.forEach((passage, i) => {
        passage.dataset.active = isActive && i === index ? 'true' : 'false'
      })

      const el = passages[index]

      // `at` came out of markdown, which came out of a vision model. It is a
      // number that ends up inside a `transform`, so it is parsed and
      // clamped, never interpolated — and anything unusable falls back to
      // the proportional band rather than throwing.
      const region = regionFor(el?.dataset.passageAt, index, count)
      const centre = (region.top + region.bottom) / 2
      const on = isActive && following

      sheetEl.dataset.following = on ? 'true' : 'false'
      sheetEl.style.setProperty('--zoom', on ? String(MAX_ZOOM) : '1')
      sheetEl.style.setProperty(
        '--pan',
        on ? `${((0.5 - centre) * 100).toFixed(2)}%` : '0%',
      )
      sheetEl.style.setProperty('--band-top', `${(region.top * 100).toFixed(2)}%`)
      sheetEl.style.setProperty(
        '--band-height',
        `${((region.bottom - region.top) * 100).toFixed(2)}%`,
      )
    })
  }, [active, following])

  /* ---- progress ------------------------------------------------------
     Shown because the coda says "counted once, nothing else is stored" out
     loud, and a reader can only judge that claim against something they can
     see. It turns the measurement from something hidden into something
     admitted. */
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
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0)
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
      style={{ ['--progress' as string]: `${(progress * 100).toFixed(2)}%` }}
    >
      <ReaderBar
        name={name}
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
          name={name}
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
            data-following="false"
            aria-label={`Sheet ${i + 1} of ${sheets.length}`}
            style={{ ['--sheet-ratio' as string]: String(sheet.ratio) }}
          >
            <div className="sheet-photo">
              <div className="sheet-frame">
                <div className="sheet-zoom">
                  {sheet.photo}
                  <span className="sheet-band" aria-hidden="true" />
                </div>
              </div>

              <div className="sheet-frame-foot">
                <p className="meta">
                  Sheet {i + 1} of {sheets.length}
                </p>
                {enhanced && (
                  <button
                    type="button"
                    className="pill"
                    aria-pressed={following}
                    onClick={() => setFollowing((on) => !on)}
                  >
                    {following ? 'Full page' : 'Follow the line'}
                  </button>
                )}
              </div>
            </div>

            <div className="sheet-text">{sheet.prose}</div>
          </section>
        ))}
      </main>

      <LetterCoda
        ref={codaRef}
        writeBackEmail={writeBackEmail}
        name={name}
        onReadAgain={scrollToTop}
        enhanced={enhanced}
      />
    </div>
  )
}

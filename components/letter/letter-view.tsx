'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { DeckControls } from './deck-controls'
import { EnvelopeStage } from './envelope-stage'
import { SoundToggle } from './sound-toggle'
import { useEnvelope } from './use-envelope'
import { PhotoFrame } from '@/components/ui/photo-frame'
import { playPaperSound } from '@/lib/paper-sounds'
import { LetterCoda } from './letter-coda'
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
}

/**
 * The reading view.
 *
 * A letter arrives closed. The page opens on an envelope, addressed, and the
 * letter is underneath it; opening the envelope is the first thing a reader
 * does, because it is the first thing anyone does with a letter.
 *
 * It replaced a photograph of the first sheet pinned beside a scrolling
 * transcription. That was a good way to show a document and a letter is not a
 * document: see `docs/design/DECISIONS.md`, *The envelope*.
 *
 * Three things are load-bearing and easy to undo by accident:
 *
 * 1. **The transcription is server-rendered and arrives complete.** Nothing
 *    here creates content; it adds `data-` attributes to text that is already
 *    painted.
 * 2. **The envelope must never become a wall.** It only covers the letter once
 *    `data-enhanced` is set, which happens on mount. Script disabled, script
 *    that failed to load, script still parsing: in every one of those the
 *    envelope is a header and the whole letter is below it, scrollable. A cover
 *    that hides the content by default hides it forever when the script does
 *    not arrive, and this is a letter somebody was sent.
 * 3. **The reveal moves `translateY` and never opacity.** A passage held at
 *    12% opacity is unreadable, and the page's whole argument is that the
 *    transcription is the part you can read.
 */
export function LetterView({
  letterId,
  isPreview,
  recipient,
  sentOn,
  writeBackEmail,
  tags,
  sheets,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const codaRef = useRef<HTMLElement>(null)
  const reported = useRef(false)

  const [filter, setFilter] = useState<string | null>(null)
  // Which face of the sheet is up. The transcription is the front and the
  // default, at every width: it is the content, and with no script there is no
  // control to turn the sheet over with, so the half that shows has to be the
  // half you can read.
  //
  // This used to be a toggle in the bar that only existed below 900px, because
  // a wide screen showed both halves side by side. The sheet has two faces
  // now, so the toggle belongs on the sheet and applies everywhere.
  const [face, setFace] = useState<'front' | 'back'>('front')
  const [progress, setProgress] = useState(0)
  const envelope = useEnvelope()
  const { attachContent } = envelope
  const { open, enhanced, reducedMotion } = envelope
  const [sheet, setSheet] = useState(0)
  const [turning, setTurning] = useState(false)
  const turnLock = useRef(false)
  const activeAnimation = useRef<Animation | null>(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      activeAnimation.current?.cancel()
    }
  }, [])

  /* ---- passages -----------------------------------------------------
     The transcription arrives as finished HTML, so the passages are
     whatever its top-level blocks turned out to be. They are found here
     rather than constructed, which is what keeps the markdown the source of
     truth for a letter's shape. */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // Nothing to set up while the envelope is closed, and setting it up anyway
    // is actively wrong: a sheet behind the envelope is `display: none`, so
    // `getBoundingClientRect()` hands back zeros, every passage measures as
    // already on screen, and the whole letter opens with its entrance spent.
    //
    // `sheet` is in the dependencies for the same reason. A sheet still in the
    // deck measures as zeros too, so the one being turned to has to be
    // measured after it is the one on top, not before.
    if (!open || envelope.phase !== 'open') return

    const found: { el: HTMLElement; sheet: number; index: number }[] = []

    root
      .querySelectorAll<HTMLElement>('[data-sheet][data-active="true"]')
      .forEach((sheetEl) => {
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
            el.getBoundingClientRect().top < window.innerHeight
              ? 'true'
              : 'false'

          // The highlight sweep runs left to right in sequence within a
          // passage. Capped, because past a handful a longer queue reads as
          // lag rather than rhythm.
          el.querySelectorAll<HTMLElement>('mark[data-c]').forEach(
            (mark, i) => {
              mark.style.setProperty('--hl-i', String(Math.min(i, 6)))
            },
          )

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
  }, [sheets, enhanced, open, sheet, envelope.phase])

  /* ---- progress ------------------------------------------------------
     How far down the letter you are, as a line under the bar. Decorative,
     and a transform, so following the scroll never repaints anything. */
  useEffect(() => {
    let frame = 0
    // The scrollable height is measured on mount and when the document
    // changes size — never inside the scroll handler. Reading a layout value
    // every frame is what makes a scrolling page stutter.
    let max = 0

    const measure = () => {
      max = document.documentElement.scrollHeight - window.innerHeight
    }

    const update = () => {
      frame = 0
      const y = window.scrollY
      const within = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0
      // How far through the letter, not how far down one sheet. With a deck
      // the scrollbar only ever describes the sheet in front of you, and a bar
      // that fills up three times over says nothing about the letter.
      setProgress(
        sheets.length > 1 && open
          ? Math.min(1, (sheet + within) / sheets.length)
          : within,
      )
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
  }, [sheet, sheets.length, open])

  /* ---- reached the end ----------------------------------------------- */
  useEffect(() => {
    if (isPreview || reported.current) return

    // The same trap as the reveal above, and this one is the expensive one.
    // A coda that is laid out but unreached still intersects, so an observer
    // attached while the envelope is closed fires immediately and every open
    // is recorded as a full read. `display: none` gives it no box to
    // intersect, and this guard means it is never asked in the first place.
    if (!open || envelope.phase !== 'open') return

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
  }, [letterId, isPreview, enhanced, open, envelope.phase])

  const readAgain = useCallback(() => {
    // Back to the first sheet, not to the top of the last one. Never a reload:
    // the letter has already been counted as opened, and reading it twice is
    // not two readers.
    setSheet(0)
    setFace('front')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  /* ---- turning a sheet ------------------------------------------------ */

  const turnTo = useCallback(
    async (index: number) => {
      const next = Math.min(Math.max(index, 0), sheets.length - 1)
      if (next === sheet || turnLock.current || envelope.busy) return
      turnLock.current = true
      setTurning(true)
      playPaperSound('turn')
      const direction = next > sheet ? -1 : 1
      const paper = rootRef.current?.querySelector<HTMLElement>(
        '.sheet[data-active="true"] .paper-sheet',
      )
      if (paper && !reducedMotion) {
        const animation = paper.animate(
          [
            { transform: 'none' },
            {
              transform: `translateX(${direction * 45}px) rotate(${direction * 4}deg) rotateY(${direction * 12}deg)`,
            },
          ],
          { duration: 180, easing: 'ease-in', fill: 'forwards' },
        )
        activeAnimation.current = animation
        await animation.finished.catch(() => {})
        animation.cancel()
      }
      if (!mounted.current) return
      setSheet(next)
      setFace('front')
      window.scrollTo({ top: 0, behavior: 'instant' })
      // React commits the next sheet before its entrance is measured.
      requestAnimationFrame(() =>
        requestAnimationFrame(async () => {
          if (!mounted.current) return
          const incoming = rootRef.current?.querySelector<HTMLElement>(
            '.sheet[data-active="true"] .paper-sheet',
          )
          if (incoming && !reducedMotion) {
            const animation = incoming.animate(
              [
                {
                  transform: `translateX(${-direction * 34}px) rotate(${-direction * 2}deg) rotateY(${-direction * 8}deg)`,
                },
                { transform: 'none' },
              ],
              { duration: 340, easing: 'cubic-bezier(.23,1,.32,1)' },
            )
            activeAnimation.current = animation
            await animation.finished.catch(() => {})
          }
          if (!mounted.current) return
          activeAnimation.current = null
          turnLock.current = false
          setTurning(false)
        }),
      )
    },
    [sheets.length, sheet, reducedMotion, envelope.busy],
  )

  const turnFace = () => {
    if (turnLock.current || envelope.busy) return
    playPaperSound('turn')
    setFace(face === 'back' ? 'front' : 'back')
  }

  // Arrow keys do what the arrows do. Only while the letter is open, and never
  // while someone is typing into something.
  useEffect(() => {
    if (!open || sheets.length < 2) return

    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.isContentEditable) return
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        void turnTo(sheet + 1)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        void turnTo(sheet - 1)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, sheet, sheets.length, turnTo])

  return (
    <div
      ref={rootRef}
      className="reader"
      data-filter={filter ?? ''}
      data-face={face}
      data-open={open ? 'true' : 'false'}
      data-sheet-active={sheet}
      data-phase={envelope.phase}
      data-turning={turning || undefined}
      // The coda is the end of the letter, so it is only in the layout once
      // the last sheet is. It is also what `reachedEnd` observes, and an
      // observer given a coda that is laid out from the start fires on
      // arrival and turns every open into a full read.
      data-at-end={sheet === sheets.length - 1 ? 'true' : 'false'}
      // Set on mount, never on the server. It is what lets the envelope cover
      // the letter: until it is here, the envelope is only a header and every
      // sheet below it is visible and reachable by scrolling.
      data-enhanced={enhanced ? 'true' : undefined}
      style={{
        ['--progress' as string]: `${(progress * 100).toFixed(2)}%`,
      }}
    >
      <ReaderBar
        recipient={recipient}
        tags={tags}
        filter={filter}
        onFilter={setFilter}
        enhanced={enhanced && open}
        progress={progress}
      />

      <main className="reader-main">
        {isPreview && (
          <p className="preview-banner">
            <span className="meta">Preview</span> Not published, so nobody else
            can open it and nothing is being counted.
          </p>
        )}

        <EnvelopeStage
          envelope={envelope}
          recipient={recipient}
          sentOn={sentOn}
          target="#sheet-0"
          label="Open the letter"
          caption={`${sheets.length === 1 ? 'One sheet' : `${sheets.length} sheets`}${sentOn ? ` · ${sentOn}` : ''}`}
        />

        <div
          className="letter-deck paper-content"
          ref={attachContent}
          tabIndex={-1}
        >
          {sheets.map((item, i) => (
            <section
              key={item.key}
              id={`sheet-${i}`}
              className="sheet"
              data-sheet={i}
              // The one on top of the deck. Everything else is `display: none`,
              // which is the whole reason the observers above can be trusted.
              data-active={i === sheet ? 'true' : 'false'}
              aria-label={`Sheet ${i + 1} of ${sheets.length}`}
              style={{ ['--sheet-ratio' as string]: String(item.ratio) }}
            >
              <div className="paper-sheet">
                <div className="sheet-head">
                  <p className="meta">
                    Sheet {i + 1} of {sheets.length}
                  </p>

                  {/*
                Only where it governs something. With no script both faces are
                already on the page, one under the other, so a control that
                turns the sheet over would be a control that does nothing.
              */}
                  {enhanced && (
                    <div className="sheet-actions">
                      <button
                        type="button"
                        className="pill sheet-turn"
                        aria-pressed={face === 'back'}
                        onClick={turnFace}
                        aria-disabled={turning || envelope.busy}
                      >
                        {face === 'back'
                          ? 'Read the letter'
                          : 'View original photo'}
                      </button>
                      <button
                        type="button"
                        className="pill pill--icon paper-close"
                        aria-label="Close the letter"
                        aria-disabled={turning || envelope.busy}
                        data-busy={envelope.phase === 'closing' || undefined}
                        aria-busy={envelope.phase === 'closing'}
                        onClick={(event) => {
                          if (!turnLock.current) {
                            window.scrollTo({ top: 0, behavior: 'instant' })
                            // `detail` is 0 when Enter or Space made the click.
                            envelope.closeLetter({
                              keyboard: event.detail === 0,
                            })
                          }
                        }}
                      >
                        <span aria-hidden="true">×</span>
                        <span className="sr-only">
                          {envelope.phase === 'closing'
                            ? 'Closing the letter'
                            : 'Close the letter'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/*
              Two faces of one sheet: the front is what you can read, the back
              is what was written. Both are in the DOM and the front is what
              the server renders.
            */}
                <div className="sheet-face sheet-face--front">{item.prose}</div>

                <div className="sheet-face sheet-face--back">
                  <PhotoFrame
                    className="sheet-frame"
                    // The sheet on top, once the letter is open: its photo
                    // downloads while the words are being read, so turning
                    // the sheet over is not a wait. Never all of them — each
                    // one is large enough to zoom into.
                    warm={enhanced && envelope.phase === 'open' && i === sheet}
                  >
                    {item.photo}
                  </PhotoFrame>
                </div>
                <span className="paper-fold-line" aria-hidden="true" />
              </div>
            </section>
          ))}

          {/*
          Rendered only where it governs something. With no script every sheet
          is already on the page, so a control that turns one would be a
          control that appears to do nothing.
        */}
          {enhanced && sheets.length > 1 && (
            <DeckControls
              sheet={sheet}
              count={sheets.length}
              onSheet={turnTo}
              busy={turning || envelope.busy}
            />
          )}
        </div>
        {enhanced && (
          <div className="reader-sound">
            <SoundToggle />
          </div>
        )}
      </main>

      <LetterCoda
        ref={codaRef}
        writeBackEmail={writeBackEmail}
        onReadAgain={readAgain}
        enhanced={enhanced}
      />
    </div>
  )
}

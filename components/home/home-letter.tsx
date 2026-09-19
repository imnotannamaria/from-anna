'use client'

import { EnvelopeStage } from '@/components/letter/envelope-stage'
import { SoundToggle } from '@/components/letter/sound-toggle'
import { useEnvelope } from '@/components/letter/use-envelope'

type Props = { children: React.ReactNode }

/** The home note uses the same paper, opening, sound and fallback as a letter. */
export function HomeLetter({ children }: Props) {
  const envelope = useEnvelope()
  const { attachContent } = envelope
  return (
    <div
      className="home-letter"
      data-open={String(envelope.open)}
      data-phase={envelope.phase}
      data-enhanced={envelope.enhanced || undefined}
    >
      <EnvelopeStage
        envelope={envelope}
        recipient={null}
        target="#the-note"
        label="Open the note"
        caption="Written by hand. Sent with care."
      />
      <div
        className="home-stack paper-content"
        id="the-note"
        ref={attachContent}
        tabIndex={-1}
      >
        <div className="home-stack-sheet paper-sheet" data-revealed="true">
          <div className="home-note-head">
            <p className="home-stack-mark">
              from anna <em>to you</em>
            </p>
            {envelope.enhanced && (
              <button
                type="button"
                className="pill pill--icon paper-close"
                aria-label="Close the note"
                aria-disabled={envelope.busy}
                aria-busy={envelope.phase === 'closing'}
                data-busy={envelope.phase === 'closing' || undefined}
                onClick={envelope.closeLetter}
              >
                <span aria-hidden="true">×</span>
                <span className="sr-only">
                  {envelope.phase === 'closing'
                    ? 'Closing the note'
                    : 'Close the note'}
                </span>
              </button>
            )}
          </div>
          {children}
          <span className="paper-fold-line" aria-hidden="true" />
        </div>
      </div>
      {envelope.enhanced && <SoundToggle />}
    </div>
  )
}

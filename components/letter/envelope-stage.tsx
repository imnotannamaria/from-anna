import { Envelope } from './envelope'
import type { useEnvelope } from './use-envelope'

type Props = {
  envelope: ReturnType<typeof useEnvelope>
  recipient: string | null
  sentOn?: string | null
  target: string
  label: string
  caption: string
}

export function EnvelopeStage({
  envelope,
  recipient,
  sentOn,
  target,
  label,
  caption,
}: Props) {
  const { attachOpener } = envelope
  return (
    <section
      className="envelope-stage"
      aria-label="Opening"
      data-opening={envelope.opening ? 'true' : 'false'}
    >
      <p className="envelope-eyebrow meta">A little something, just for you</p>
      <a
        ref={attachOpener}
        href={target}
        className="envelope-invitation"
        aria-label={envelope.opening ? 'Opening the letter' : label}
        aria-busy={envelope.opening}
        data-busy={envelope.opening || undefined}
        onClick={(event) => {
          event.preventDefault()
          envelope.openLetter()
        }}
      >
        <Envelope recipient={recipient} sentOn={sentOn} />
        <span className="envelope-open pill">
          {envelope.opening ? 'Opening your letter…' : label}
          {!envelope.opening && <span aria-hidden="true">↗</span>}
        </span>
      </a>
      <p className="envelope-under meta">{caption}</p>
      <p className="sr-only" role="status">
        {envelope.opening ? 'Opening the letter' : ''}
      </p>
    </section>
  )
}

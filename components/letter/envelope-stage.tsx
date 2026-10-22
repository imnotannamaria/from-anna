import { BrandMark } from '@/components/ui/brand-mark'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Envelope } from './envelope'
import type { useEnvelope } from './use-envelope'
import { Icon } from '@/components/ui/icon'

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
  const { opening, attachOpener, openLetter } = envelope
  return (
    <section
      className="envelope-stage"
      aria-label="Opening"
      data-opening={opening ? 'true' : 'false'}
    >
      <header className="envelope-stationery-head">
        <span className="wordmark">
          <BrandMark size={34} />
          from <em>anna</em>
        </span>
        <ThemeToggle />
      </header>
      <div className="envelope-heading">
        <h1 className="display">
          A letter, <em>for {recipient ?? 'you'}.</em>
        </h1>
        <p className="meta">
          written by hand · from Anna{sentOn ? ` · ${sentOn}` : ''}
        </p>
      </div>
      <a
        ref={attachOpener}
        href={target}
        className="envelope-opener"
        aria-label={opening ? 'Opening the letter' : label}
        aria-busy={opening}
        data-busy={opening || undefined}
        onClick={(event) => {
          if (
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          )
            return
          event.preventDefault()
          openLetter()
        }}
      >
        <Envelope recipient={recipient} />
        <span
          className="pill pill--solid envelope-open"
          data-busy={opening || undefined}
        >
          <Icon name="envelope" />
          {opening ? 'Opening your letter…' : label}
        </span>
      </a>
      <p className="meta envelope-under">{caption}</p>
      <p className="sr-only" role="status">
        {opening ? 'Opening the letter' : ''}
      </p>
    </section>
  )
}

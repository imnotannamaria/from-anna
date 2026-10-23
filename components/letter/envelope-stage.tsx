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
        <span className="wordmark wordmark--mark">
          <BrandMark size={38} />
        </span>
        <ThemeToggle />
      </header>
      {/*
        The envelope carries the name, where a real one would. The page's
        heading is for a screen reader, which the envelope is hidden from.
      */}
      <h1 className="sr-only">
        A letter for {recipient ?? 'you'}, from Anna
        {sentOn ? `, ${sentOn}` : ''}
      </h1>
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
        <Envelope recipient={recipient} sentOn={sentOn} />
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

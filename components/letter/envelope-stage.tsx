import { useTranslations } from 'next-intl'

import { BrandMark } from '@/components/ui/brand-mark'
import { LanguageSwitch } from '@/components/ui/language-switch'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Envelope, type Postmark } from './envelope'
import type { useEnvelope } from './use-envelope'
import { Icon } from '@/components/ui/icon'

type Props = {
  envelope: ReturnType<typeof useEnvelope>
  recipient: string | null
  sentOn?: string | null
  postmark?: Postmark | null
  /** This letter's address without its language, for the flag. */
  path: string
  target: string
  caption: string
}
export function EnvelopeStage({
  envelope,
  recipient,
  sentOn,
  postmark,
  path,
  target,
  caption,
}: Props) {
  const t = useTranslations('letter.stage')
  const tEnvelope = useTranslations('letter.envelope')
  const { opening, attachOpener, openLetter } = envelope
  return (
    <section
      className="envelope-stage"
      aria-label={t('label')}
      data-opening={opening ? 'true' : 'false'}
    >
      <header className="envelope-stationery-head">
        <span className="wordmark wordmark--mark">
          <BrandMark size={38} />
        </span>
        <div className="envelope-stationery-controls">
          <LanguageSwitch path={path} />
          <ThemeToggle />
        </div>
      </header>
      {/*
        The envelope carries the name, where a real one would. The page's
        heading is for a screen reader, which the envelope is hidden from.
      */}
      <h1 className="sr-only">
        {sentOn
          ? t('headingDated', {
              recipient: recipient ?? tEnvelope('anyone'),
              date: sentOn,
            })
          : t('heading', { recipient: recipient ?? tEnvelope('anyone') })}
      </h1>
      <a
        ref={attachOpener}
        href={target}
        className="envelope-opener"
        aria-label={opening ? t('announce') : t('open')}
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
        <Envelope recipient={recipient} sentOn={sentOn} postmark={postmark} />
        <span
          className="pill pill--solid envelope-open"
          data-busy={opening || undefined}
        >
          <Icon name="envelope" />
          {opening ? t('opening') : t('open')}
        </span>
      </a>
      <p className="meta envelope-under">{caption}</p>
      <p className="sr-only" role="status">
        {opening ? t('announce') : ''}
      </p>
    </section>
  )
}

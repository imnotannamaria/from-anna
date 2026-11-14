'use client'

import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

import { BrandMark } from '@/components/ui/brand-mark'
import { LanguageSwitch } from '@/components/ui/language-switch'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { HighlightLegend } from './highlight-legend'

type Props = {
  recipient: string | null
  sentOn: string | null
  count: number
  tags: readonly string[]
  filter: string | null
  onFilter: (tag: string | null) => void
  enhanced: boolean
  progress: number
  /** This letter's address without its language, for the flag. */
  path: string
  children?: ReactNode
}
export function ReaderBar({
  recipient,
  sentOn,
  count,
  tags,
  filter,
  onFilter,
  enhanced,
  progress,
  path,
  children,
}: Props) {
  const t = useTranslations('letter.bar')
  const tEnvelope = useTranslations('letter.envelope')
  return (
    <div className="reader-chrome">
      <header className="reader-bar">
        <BrandMark size={44} />
        <div className="reader-address">
          {/* h2: the page's h1 is the envelope's "A letter, for …". */}
          <h2 className="reader-name">
            {t.rich('for', {
              recipient: recipient ?? tEnvelope('anyone'),
              em: (chunks) => <em>{chunks}</em>,
            })}
          </h2>
          <p className="meta">
            {sentOn ? t('metaDated', { date: sentOn, count }) : t('meta', { count })}
          </p>
        </div>
        <div className="reader-controls">
          <LanguageSwitch path={path} />
          <ThemeToggle />
          {children}
        </div>
      </header>
      {enhanced && (
        <>
          <div className="reader-progress" aria-hidden="true">
            <span style={{ transform: `scaleX(${progress})` }} />
          </div>
          <HighlightLegend tags={tags} filter={filter} onFilter={onFilter} />
        </>
      )}
    </div>
  )
}

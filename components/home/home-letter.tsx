'use client'

import { useTranslations } from 'next-intl'
import { useState, type ReactNode } from 'react'

import { BrandMark } from '@/components/ui/brand-mark'
import { HighlightLegend } from '@/components/letter/highlight-legend'
import { Icon } from '@/components/ui/icon'
import { SegmentTrack } from '@/components/ui/segment-track'
import { HIGHLIGHT_TAGS } from '@/lib/theme/highlight-tags'

/** The demo uses the real server-rendered package output and the reader's legend. */
export function HomeLetter({ children }: { children: ReactNode }) {
  const t = useTranslations('home.demo')
  const [filter, setFilter] = useState<string | null>(null)
  return (
    <article
      className="home-letter surface"
      data-filter={filter ?? ''}
      data-revealed="true"
      aria-label={t('label')}
    >
      <header className="home-note-head">
        <BrandMark size={44} />
        <div>
          <h2>{t.rich('for', { em: (chunks) => <em>{chunks}</em> })}</h2>
          <p className="meta">{t('meta')}</p>
        </div>
        <span className="demo-label">{t('tag')}</span>
      </header>
      <HighlightLegend
        tags={HIGHLIGHT_TAGS}
        filter={filter}
        onFilter={setFilter}
      />
      <div className="home-demo-prose">{children}</div>
      <div className="home-demo-dock island">
        <SegmentTrack label={t('explore')}>
          <a href="#syntax">
            <Icon name="text" />
            {t('syntax')}
          </a>
          <a href="#package">
            <Icon name="package" />
            {t('package')}
          </a>
        </SegmentTrack>
      </div>
    </article>
  )
}

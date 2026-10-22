'use client'

import { BrandMark } from '@/components/ui/brand-mark'

import { useState, type ReactNode } from 'react'
import { HighlightLegend } from '@/components/letter/highlight-legend'
import { Icon } from '@/components/ui/icon'
import { SegmentTrack } from '@/components/ui/segment-track'
import { HIGHLIGHT_TAGS } from '@/lib/theme/highlight-tags'

/** The demo uses the real server-rendered package output and the reader's legend. */
export function HomeLetter({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<string | null>(null)
  return (
    <article
      className="home-letter surface"
      data-filter={filter ?? ''}
      data-revealed="true"
      aria-label="A demonstration note from Anna"
    >
      <header className="home-note-head">
        <BrandMark size={44} />
        <div>
          <h2>
            for <em>you</em>, visitor
          </h2>
          <p className="meta">a demo note · one page</p>
        </div>
        <span className="demo-label">demo</span>
      </header>
      <HighlightLegend
        tags={HIGHLIGHT_TAGS}
        filter={filter}
        onFilter={setFilter}
      />
      <div className="home-demo-prose">{children}</div>
      <div className="home-demo-dock island">
        <SegmentTrack label="Explore the demonstration">
          <a href="#syntax">
            <Icon name="text" />
            The syntax
          </a>
          <a href="#package">
            <Icon name="package" />
            The package
          </a>
        </SegmentTrack>
      </div>
    </article>
  )
}

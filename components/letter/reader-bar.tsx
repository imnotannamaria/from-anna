'use client'

import { ThemeToggle } from '@/components/ui/theme-toggle'

import { BrandMark } from '@/components/ui/brand-mark'

import type { ReactNode } from 'react'
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
  children,
}: Props) {
  return (
    <div className="reader-chrome">
      <header className="reader-bar">
        <BrandMark size={44} />
        <div className="reader-address">
          {/* h2: the page's h1 is the envelope's "A letter, for …". */}
          <h2 className="reader-name">
            for <em>{recipient ?? 'you'}</em>
          </h2>
          <p className="meta">
            from Anna{sentOn ? ` · ${sentOn}` : ''} · {count}{' '}
            {count === 1 ? 'sheet' : 'sheets'}
          </p>
        </div>
        <div className="reader-controls">
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

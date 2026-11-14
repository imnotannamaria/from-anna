'use client'

import { useTranslations } from 'next-intl'

import { Icon } from '@/components/ui/icon'
import type { HighlightTag } from '@/lib/theme/highlight-tags'

type Props = {
  tags: readonly string[]
  filter: string | null
  onFilter: (tag: string | null) => void
}
export function HighlightLegend({ tags, filter, onFilter }: Props) {
  const t = useTranslations('letter.legend')
  return (
    <div className="legend" role="group" aria-label={t('group')}>
      <button
        type="button"
        className="pill chip"
        aria-pressed={filter === null}
        onClick={() => onFilter(null)}
      >
        {t('all')}
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          className="pill chip"
          data-tag={tag}
          aria-pressed={filter === tag}
          onClick={() => onFilter(filter === tag ? null : tag)}
        >
          <Icon
            name={tag === 'important' ? 'star' : tag === 'ask' ? 'ask' : 'pen'}
          />
          {t(tag as HighlightTag)}
        </button>
      ))}
    </div>
  )
}

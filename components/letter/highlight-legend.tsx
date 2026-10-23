'use client'

import { Icon } from '@/components/ui/icon'

type Props = {
  tags: readonly string[]
  filter: string | null
  onFilter: (tag: string | null) => void
}
export function HighlightLegend({ tags, filter, onFilter }: Props) {
  return (
    <div className="legend" role="group" aria-label="Show highlights">
      <button
        type="button"
        className="pill chip"
        aria-pressed={filter === null}
        onClick={() => onFilter(null)}
      >
        All
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
          {tag === 'ask' ? 'question' : tag}
        </button>
      ))}
    </div>
  )
}

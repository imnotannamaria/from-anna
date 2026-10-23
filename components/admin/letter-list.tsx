'use client'

import { useState, type ReactNode } from 'react'
import { EmptyState } from '@/app/components/entrepta/empty-state'
import { SegmentedControl } from '@/app/components/entrepta/segmented-control'

type Status = 'all' | 'published' | 'draft' | 'expired'
export function LetterList({
  children,
  counts,
}: {
  children: ReactNode
  counts: Record<Status, number>
}) {
  const [filter, setFilter] = useState<Status>('all')
  return (
    <div className="letter-list" data-filter={filter}>
      <div className="admin-list-tools">
        <div className="island" aria-label="Filter letters">
          <SegmentedControl
            aria-label="Letter status"
            value={filter}
            size="sm"
            className="w-full"
            options={(['all', 'published', 'draft', 'expired'] as const).map(
              (status) => ({
                value: status,
                label: (
                  <>
                    {status === 'all'
                      ? 'All'
                      : status[0].toUpperCase() + status.slice(1)}{' '}
                    <span className="filter-count">{counts[status]}</span>
                  </>
                ),
              }),
            )}
            onValueChange={(next) => setFilter(next as Status)}
          />
        </div>
        <span className="meta" role="status">
          {counts[filter]} {counts[filter] === 1 ? 'letter' : 'letters'}
        </span>
      </div>
      {children}
      {counts[filter] === 0 && (
        <EmptyState
          title={
            filter === 'all'
              ? 'Nothing written yet.'
              : `No ${filter} letters here.`
          }
          description={
            filter === 'all'
              ? 'Start a letter and add your first photograph.'
              : undefined
          }
        />
      )}
    </div>
  )
}

'use client'

import { useTransition } from 'react'
import { Icon } from './icon'

export function RetryButton({ retry }: { retry: () => void }) {
  const [pending, startTransition] = useTransition()
  return (
    <button
      type="button"
      className="pill pill--solid"
      disabled={pending}
      aria-busy={pending}
      data-busy={pending || undefined}
      onClick={() => startTransition(retry)}
    >
      <Icon name="refresh" />
      {pending ? 'Trying again…' : 'Try again'}
    </button>
  )
}

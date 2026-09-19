'use client'

import { usePaperSound } from '@/lib/paper-sounds'

export function SoundToggle() {
  const { enabled, toggle } = usePaperSound()
  return (
    <button
      type="button"
      className="pill paper-sound"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label="Paper sounds"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        {enabled ? (
          <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
        ) : (
          <path d="m16 9 6 6m0-6-6 6" />
        )}
      </svg>
      Sound {enabled ? 'on' : 'off'}
    </button>
  )
}

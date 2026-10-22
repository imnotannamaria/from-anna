'use client'

import { useEffect } from 'react'

import { restoreMode } from '@/lib/theme/mode'

/** Puts a saved dark choice back after a client render of the root layout. */
export function ModeSync() {
  useEffect(() => {
    restoreMode()
  }, [])
  return null
}

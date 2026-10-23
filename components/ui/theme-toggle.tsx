'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'
import { MODE_KEY, syncThemeColor } from '@/lib/theme/mode'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { Icon } from './icon'

const KEY = MODE_KEY
let activeTransition: ViewTransition | undefined
let switchVersion = 0
let requestedMode: 'dark' | 'light' | undefined

/**
 * A downward view-transition curtain on a pointer that hovers, an instant
 * switch everywhere else.
 *
 * A view transition photographs the page, and WebKit flattens a 3D scene to do
 * it: on a phone the sealed envelope came out of that with the back of it, the
 * seal, in the middle of the front. A curtain is a nicety for a mouse; a phone
 * gets the mode with no animation at all, which is also the cheaper switch.
 */
const canCurtain = () =>
  typeof document.startViewTransition === 'function' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches

function changeMode(mode: 'dark' | 'light', reduced: boolean) {
  const root = document.documentElement
  const version = ++switchVersion
  requestedMode = mode
  activeTransition?.skipTransition()
  const apply = () => {
    if (version !== switchVersion) return
    flushSync(() => {
      root.dataset.mode = mode
      syncThemeColor(mode)
      try {
        localStorage.setItem(KEY, mode)
      } catch {
        /* This visit still works. */
      }
      window.dispatchEvent(new Event('from-anna-theme'))
    })
  }
  root.dataset.themeSwitching = ''
  const done = () => {
    if (version !== switchVersion) return
    delete root.dataset.themeSwitching
    activeTransition = undefined
    requestedMode = undefined
  }
  if (!reduced && canCurtain()) {
    const transition = document.startViewTransition(apply)
    activeTransition = transition
    transition.ready.catch(() => {})
    transition.finished.then(done, done)
  } else {
    apply()
    requestAnimationFrame(() => requestAnimationFrame(done))
  }
}
function subscribe(notify: () => void) {
  const sync = (event: StorageEvent) => {
    if (event.key !== KEY && event.key !== null) return
    document.documentElement.dataset.mode =
      event.newValue === 'dark' ? 'dark' : 'light'
    notify()
  }
  window.addEventListener('from-anna-theme', notify)
  window.addEventListener('storage', sync)
  return () => {
    window.removeEventListener('from-anna-theme', notify)
    window.removeEventListener('storage', sync)
  }
}
const getSnapshot = () => document.documentElement.dataset.mode === 'dark'
const getServerSnapshot = () => false

/** Light on first visit; an explicit choice persists without gating content. */
export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    if (reducedMotion) activeTransition?.skipTransition()
  }, [reducedMotion])
  return (
    <button
      type="button"
      className="pill pill--icon theme-toggle"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={dark}
      onClick={() => {
        const mode = requestedMode ?? (getSnapshot() ? 'dark' : 'light')
        changeMode(mode === 'dark' ? 'light' : 'dark', reducedMotion)
      }}
    >
      <span className="theme-icon-light">
        <Icon name="moon" />
      </span>
      <span className="theme-icon-dark">
        <Icon name="sun" />
      </span>
    </button>
  )
}

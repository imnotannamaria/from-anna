'use client'

import { useSyncExternalStore } from 'react'

type PaperSound = 'tear' | 'turn'
const preferenceKey = 'from-anna:paper-sound'
const changeEvent = 'paper-sound-change'
const sounds = new Map<PaperSound, HTMLAudioElement>()
let playing: HTMLAudioElement | undefined

let fallbackEnabled = true
function isEnabled() {
  try {
    return localStorage.getItem(preferenceKey) !== 'off'
  } catch {
    return fallbackEnabled
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(changeEvent, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(changeEvent, onChange)
  }
}

/** Called by a gesture, never on mount. The browser receives only static audio. */
export function playPaperSound(name: PaperSound) {
  if (!isEnabled()) return
  playing?.pause()
  let sound = sounds.get(name)
  if (!sound) {
    sound = new Audio(`/sounds/paper-${name}.mp3`)
    sound.volume = name === 'tear' ? 0.32 : 0.24
    sounds.set(name, sound)
  }
  playing = sound
  sound.currentTime = 0
  void sound.play().catch(() => {
    /* Audio failure never blocks reading. */
  })
}

export function usePaperSound() {
  const enabled = useSyncExternalStore(subscribe, isEnabled, () => true)
  function toggle() {
    fallbackEnabled = !enabled
    try {
      localStorage.setItem(preferenceKey, enabled ? 'off' : 'on')
    } catch {
      /* Session only. */
    }
    if (enabled) playing?.pause()
    window.dispatchEvent(new Event(changeEvent))
  }
  return { enabled, toggle }
}

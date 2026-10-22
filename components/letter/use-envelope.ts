'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { playPaperSound } from '@/lib/paper-sounds'
import { useReducedMotion } from '@/lib/use-reduced-motion'

const subscribe = () => () => {}
type Phase = 'sealed' | 'tearing' | 'unfolding' | 'open' | 'closing'

/** One timeline for both letters. Timers are a fallback even if CSS is unavailable. */
export function useEnvelope() {
  const [phase, setPhase] = useState<Phase>('sealed')
  const phaseRef = useRef<Phase>('sealed')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const reducedMotion = useReducedMotion()
  const enhanced = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  const openerRef = useRef<HTMLAnchorElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const attachOpener = useCallback((node: HTMLAnchorElement | null) => {
    openerRef.current = node
  }, [])
  const attachContent = useCallback((node: HTMLDivElement | null) => {
    contentRef.current = node
  }, [])

  const change = useCallback((next: Phase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])
  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])
  useEffect(() => clear, [clear])

  // The real content stays complete and at full text opacity during handover.
  useLayoutEffect(() => {
    if (phase !== 'unfolding' || reducedMotion) return
    const content = contentRef.current
    if (!content) return
    const animation = content.animate(
      [{ transform: 'translateY(24px)' }, { transform: 'none' }],
      { duration: 440, easing: 'cubic-bezier(.16,1,.3,1)' },
    )
    return () => animation.cancel()
  }, [phase, reducedMotion])

  // A preference change during the sequence must settle it immediately.
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const settle = () => {
      if (!media.matches) return
      const current = phaseRef.current
      if (current === 'tearing' || current === 'unfolding') {
        clear()
        change('open')
      } else if (current === 'closing') {
        clear()
        change('sealed')
      }
    }
    media.addEventListener('change', settle)
    return () => media.removeEventListener('change', settle)
  }, [change, clear])

  const openLetter = useCallback(() => {
    if (phaseRef.current !== 'sealed') return
    clear()
    playPaperSound('tear')
    if (reducedMotion) {
      change('open')
      return
    }
    // The envelope turns over (520ms), the flap lifts and the letter rises
    // (to ~1100ms); then the real sheet takes over from it.
    change('tearing')
    timers.current.push(setTimeout(() => change('unfolding'), 1150))
    timers.current.push(setTimeout(() => change('open'), 1590))
  }, [change, clear, reducedMotion])

  // Whether focus goes back to the envelope quietly. Focus moved by a script
  // matches `:focus-visible` in some browsers whatever the last input was, so
  // a tap on × drew a keyboard ring on the envelope — the "random" ring on a
  // phone. The ring is only earned when the close came from a key.
  const returnQuietly = useRef(false)

  const closeLetter = useCallback(
    (options?: { keyboard?: boolean }) => {
      if (phaseRef.current !== 'open') return
      returnQuietly.current = !options?.keyboard
      clear()
      playPaperSound('turn')
      if (reducedMotion) {
        change('sealed')
        return
      }
      change('closing')
      timers.current.push(setTimeout(() => change('sealed'), 380))
    },
    [change, clear, reducedMotion],
  )

  const hasOpened = useRef(false)
  useEffect(() => {
    if (phase === 'open') {
      hasOpened.current = true
      contentRef.current?.focus({ preventScroll: true })
    } else if (phase === 'sealed' && hasOpened.current) {
      const opener = openerRef.current
      if (!opener) return
      if (returnQuietly.current) {
        opener.dataset.quietFocus = 'true'
        // Any key afterwards means the reader is on a keyboard after all.
        const loud = () => {
          delete opener.dataset.quietFocus
          opener.removeEventListener('blur', loud)
          opener.removeEventListener('keydown', loud)
        }
        opener.addEventListener('blur', loud)
        opener.addEventListener('keydown', loud)
      }
      opener.focus({ preventScroll: true })
    }
  }, [phase])

  return {
    phase,
    enhanced,
    reducedMotion,
    attachOpener,
    attachContent,
    openLetter,
    closeLetter,
    open: phase === 'unfolding' || phase === 'open' || phase === 'closing',
    opening: phase === 'tearing' || phase === 'unfolding',
    busy: phase !== 'sealed' && phase !== 'open',
  }
}

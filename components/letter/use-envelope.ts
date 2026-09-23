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

  // Measure the insert and the actual paper once at handover. The sheet begins
  // where the insert left the envelope, including on a narrow viewport.
  useLayoutEffect(() => {
    if (phase !== 'unfolding' || reducedMotion) return
    const insert = openerRef.current?.querySelector('.envelope-fold')
    // The sheet on top of the deck, not the first one: closing on sheet 2 and
    // opening again shows sheet 2, and animating sheet 1 — `display: none`
    // by then — measured zeros and gave the visible sheet no entrance.
    const content = contentRef.current
    const paper =
      content?.querySelector<HTMLElement>('[data-active="true"] .paper-sheet') ??
      content?.querySelector<HTMLElement>('.paper-sheet')
    if (!insert || !paper) return
    const from = insert.getBoundingClientRect()
    const to = paper.getBoundingClientRect()
    const dx = from.left + from.width / 2 - (to.left + to.width / 2)
    const dy = from.top - to.top
    const scale = Math.min(1, from.width / to.width)
    const animation = paper.animate(
      [
        {
          transform: `translate(${dx}px, ${dy}px) perspective(1000px) rotateX(-64deg) scale(${scale})`,
        },
        {
          transform: 'translateY(-5px) perspective(1000px) rotateX(4deg)',
          offset: 0.72,
        },
        { transform: 'none' },
      ],
      { duration: 580, easing: 'cubic-bezier(.23,1,.32,1)' },
    )
    return () => animation.cancel()
  }, [phase, reducedMotion])

  const openLetter = useCallback(() => {
    if (phaseRef.current !== 'sealed') return
    clear()
    playPaperSound('tear')
    if (reducedMotion) {
      change('open')
      return
    }
    change('tearing')
    timers.current.push(setTimeout(() => change('unfolding'), 620))
    timers.current.push(setTimeout(() => change('open'), 1200))
  }, [change, clear, reducedMotion])

  // Whether focus goes back to the envelope quietly. Focus moved by a script
  // matches `:focus-visible` in some browsers whatever the last input was, so
  // a tap on × drew a keyboard ring on the envelope — the "random" ring on a
  // phone. The ring is only earned when the close came from a key.
  const returnQuietly = useRef(false)

  const closeLetter = useCallback((options?: { keyboard?: boolean }) => {
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
  }, [change, clear, reducedMotion])

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

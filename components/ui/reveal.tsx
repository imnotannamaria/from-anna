'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'

/** Content is visible in server HTML. Only its position is enhanced on entry. */
export function Reveal({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    const node = ref.current
    if (!node || reduced) return
    let animation: Animation | undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        animation = node.animate(
          [{ transform: 'translateY(18px)' }, { transform: 'none' }],
          { duration: 560, easing: 'cubic-bezier(.16,1,.3,1)' },
        )
        observer.disconnect()
      },
      { threshold: 0.06 },
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      animation?.cancel()
    }
  }, [reduced])
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

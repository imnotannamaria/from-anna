'use client'

import { BrandMark } from '@/components/ui/brand-mark'

import { useEffect, useState } from 'react'
import { SegmentTrack } from '@/components/ui/segment-track'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const sections = [
  ['top', 'letter'],
  ['how', 'how it works'],
  ['syntax', 'syntax'],
  ['package', 'package'],
  ['run', 'run your own'],
] as const
export function HomeNavigation() {
  const [current, setCurrent] = useState('top')
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const match = [...sections]
        .reverse()
        .find(
          ([id]) =>
            (document.getElementById(id)?.getBoundingClientRect().top ??
              Infinity) <=
            innerHeight * 0.4,
        )
      setCurrent(match?.[0] ?? 'top')
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
  return (
    <nav className="island home-navigation" aria-label="Main">
      <a className="wordmark" href="#top">
        <BrandMark size={36} />
        from <em>anna</em>
      </a>
      <SegmentTrack label="On this page">
        {sections.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={current === id ? 'page' : undefined}
          >
            {label}
          </a>
        ))}
      </SegmentTrack>
      <span className="island-divider" aria-hidden="true" />
      <ThemeToggle />
    </nav>
  )
}

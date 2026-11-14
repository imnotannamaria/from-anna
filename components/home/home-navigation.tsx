'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { BrandMark } from '@/components/ui/brand-mark'
import { LanguageSwitch } from '@/components/ui/language-switch'
import { SegmentTrack } from '@/components/ui/segment-track'
import { ThemeToggle } from '@/components/ui/theme-toggle'

// The ids are the sections of the page; each one's name is `home.nav.<id>`,
// with the first section named for what it holds.
const sections = [
  ['top', 'letter'],
  ['how', 'how'],
  ['syntax', 'syntax'],
  ['package', 'package'],
  ['run', 'run'],
] as const
export function HomeNavigation() {
  const t = useTranslations('home.nav')
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
    <nav className="island home-navigation" aria-label={t('label')}>
      {/* The mark alone; the name is the link's, for a screen reader. */}
      <a
        className="wordmark wordmark--mark"
        href="#top"
        aria-label={t('top')}
      >
        <BrandMark size={38} />
      </a>
      <SegmentTrack label={t('sections')}>
        {sections.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={current === id ? 'true' : undefined}
          >
            {t(label)}
          </a>
        ))}
      </SegmentTrack>
      <span className="island-divider" aria-hidden="true" />
      <LanguageSwitch path="/" />
      <ThemeToggle />
    </nav>
  )
}

'use client'

import { useLocale, useTranslations } from 'next-intl'

import { Flag } from '@/components/ui/flag'
import {
  HTML_LANG,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_NAME,
  isLocale,
  localePath,
  otherLocale,
} from '@/lib/i18n/locales'

/**
 * The same page in the other language, as the flag of the one it is in now.
 *
 * A link, not a button: it is an address, so it works with no script, opens in
 * a new tab and can be shared. The click also remembers the choice in a
 * cookie, because `/` sends a visitor whose browser asks for Portuguese to
 * `/pt`, and someone who picked English on purpose would be sent straight back.
 *
 * `path` is the page without its language (`/` or `/a-letter`), handed down
 * from the server so the address is right in the first HTML.
 */
export function LanguageSwitch({ path }: { path: string }) {
  const raw = useLocale()
  const current = isLocale(raw) ? raw : 'en'
  const target = otherLocale(current)
  const t = useTranslations('lang')
  const label = t('switch', {
    current: LOCALE_NAME[current],
    next: LOCALE_NAME[target],
  })

  return (
    <a
      className="pill pill--icon language-switch"
      href={localePath(target, path)}
      hrefLang={HTML_LANG[target]}
      aria-label={label}
      title={label}
      onClick={() => {
        const secure = window.location.protocol === 'https:' ? '; secure' : ''
        document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax${secure}`
      }}
    >
      <Flag locale={current} />
    </a>
  )
}

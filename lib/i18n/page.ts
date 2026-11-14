import { setRequestLocale } from 'next-intl/server'

import { DEFAULT_LOCALE, isLocale, type Locale } from './locales'

/** What every page under `app/[locale]` is handed. */
export type LocaleParams = { params: Promise<{ locale: string }> }

/**
 * The first line of every page under `app/[locale]`: reads the language from
 * the address and tells next-intl, so the page renders in it without reading
 * the request. That is what lets the front page stay static.
 */
export async function pageLocale(
  params: Promise<{ locale: string }>,
): Promise<Locale> {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE
  setRequestLocale(locale)
  return locale
}

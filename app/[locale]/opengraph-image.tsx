import { getTranslations } from 'next-intl/server'

import { letterCard } from '@/components/og/letter-card'
import { LOCALES, isLocale } from '@/lib/i18n/locales'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// `alt` is a static export, so the card's description is English for both
// languages; the words on the card itself follow the address.
export const alt = 'from anna · letters I write by hand, for one person each'

/** The card has no content of its own to look up, so it is built once per language. */
export const generateStaticParams = () => LOCALES.map((locale) => ({ locale }))

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: raw } = await params
  const t = await getTranslations({
    locale: isLocale(raw) ? raw : 'en',
    namespace: 'og',
  })
  return letterCard({
    line1: t('siteLine1'),
    line2: t('siteLine2'),
    line3: t('siteLine3'),
    tagline: t('siteTagline'),
  })
}

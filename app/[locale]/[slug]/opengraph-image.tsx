import { getTranslations } from 'next-intl/server'

import { letterCard } from '@/components/og/letter-card'
import { isLocale } from '@/lib/i18n/locales'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'from anna · a handwritten letter, just for you'

/** No lookup, photo, recipient or letter text: third-party previews outlive access. */
export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: raw } = await params
  const t = await getTranslations({
    locale: isLocale(raw) ? raw : 'en',
    namespace: 'og',
  })
  return letterCard({
    line1: t('letterLine1'),
    line2: t('letterLine2'),
    line3: t('letterLine3'),
    tagline: t('letterTagline'),
  })
}

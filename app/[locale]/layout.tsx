import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { RootShell } from '@/app/root-shell'
import { LOCALES, isLocale } from '@/lib/i18n/locales'
import { THEME_COLOR } from '@/lib/theme/mode'

/** The site's own title and description, in the language of the page. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : 'en'
  const t = await getTranslations({ locale, namespace: 'meta.site' })
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    ),
    title: t('title'),
    description: t('description'),
    twitter: { card: 'summary_large_image' },
    openGraph: {
      siteName: 'from anna',
      locale: locale === 'pt' ? 'pt_BR' : 'en_US',
    },
  }
}

// The light canvas. The head script swaps it for the dark one when that is
// the saved choice, so the browser chrome matches the page either way.
export const viewport: Viewport = { themeColor: THEME_COLOR.light }

/** One copy of every static page per language. */
export const generateStaticParams = () => LOCALES.map((locale) => ({ locale }))

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  // Tells next-intl the language without reading the request, so the front
  // page stays static.
  setRequestLocale(locale)
  return <RootShell locale={locale}>{children}</RootShell>
}

import { ClerkProvider } from '@clerk/nextjs'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { Inter, JetBrains_Mono, Newsreader } from 'next/font/google'

import { SiteAnalytics } from '@/components/site-analytics'
import { ModeSync } from '@/components/ui/mode-sync'
import { HTML_LANG, type Locale } from '@/lib/i18n/locales'
import { MODE_SCRIPT } from '@/lib/theme/mode'

import 'remark-scanned-page/styles/scanned-page.css'

import './globals.css'

// Newsreader for headings, Inter for reading and JetBrains Mono for controls.
// next/font downloads them at build time; no browser request to Google Fonts.
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-newsreader',
  display: 'swap',
})

// Roman only. Nothing sets the mono in italic, and the italic file was a
// preload on every page for no glyph anyone saw.
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  style: ['normal'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const fontVariables = [newsreader, inter, jetbrainsMono]
  .map((font) => font.variable)
  .join(' ')

/**
 * The document every page is drawn in: the language, the fonts, the mode
 * script and the providers. There are two root layouts, the site's (one per
 * language, `app/[locale]/layout.tsx`) and the desk's (`app/admin/layout.tsx`,
 * always English), and both are this.
 *
 * Server HTML is complete in light mode. The head script only restores an
 * explicit color choice; it never gates rendering or changes letter content.
 * `suppressHydrationWarning` covers exactly that: the script changes
 * `data-mode` on <html> before React hydrates.
 *
 * A 404 thrown from inside `/[slug]` makes Next render this layout again on
 * the client, and React 19 logs "Encountered a script tag" in development
 * when it does. That warning is dev-only and harmless; `ModeSync` puts the
 * saved mode back on that path.
 */
export async function RootShell({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  const t = await getTranslations({ locale, namespace: 'frame' })
  // Every client component reads its words from here.
  const messages = await getMessages({ locale })

  return (
    <html
      lang={HTML_LANG[locale]}
      data-mode="light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      data-theme="entrepta"
      className={`h-full ${fontVariables}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a className="skip-link" href="#main-content">
          {t('skip')}
        </a>
        <ClerkProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ClerkProvider>
        <ModeSync />
        <SiteAnalytics />
      </body>
    </html>
  )
}

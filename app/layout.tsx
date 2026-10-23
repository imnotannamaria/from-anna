import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Newsreader } from 'next/font/google'

import { SiteAnalytics } from '@/components/site-analytics'
import { ModeSync } from '@/components/ui/mode-sync'
import { MODE_SCRIPT, THEME_COLOR } from '@/lib/theme/mode'

import 'remark-scanned-page/styles/scanned-page.css'

import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  ),
  title: 'from anna',
  description: 'Handwritten letters, published on the web.',
  twitter: { card: 'summary_large_image' },
}

// The light canvas. The head script swaps it for the dark one when that is
// the saved choice, so the browser chrome matches the page either way.
export const viewport: Viewport = {
  themeColor: THEME_COLOR.light,
}

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

// Server HTML is complete in light mode. The head script only restores an
// explicit color choice; it never gates rendering or changes letter content.
// `suppressHydrationWarning` covers exactly that: the script changes
// `data-mode` on <html> before React hydrates.
//
// A 404 thrown from inside `/[slug]` makes Next render this layout again on
// the client, and React 19 logs "Encountered a script tag" in development
// when it does. That warning is dev-only and harmless; `ModeSync` puts the
// saved mode back on that path.
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
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
          Skip to content
        </a>
        <ClerkProvider>{children}</ClerkProvider>
        <ModeSync />
        <SiteAnalytics />
      </body>
    </html>
  )
}

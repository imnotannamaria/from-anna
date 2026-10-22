import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter, JetBrains_Mono, Newsreader } from 'next/font/google'

import { SiteAnalytics } from '@/components/site-analytics'

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

// The approved reference uses Newsreader display, Inter body and Mono controls.
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

// Server HTML is complete in light mode. The critical script only restores an
// explicit color choice; it never gates rendering or changes letter content.
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
      <body className="flex min-h-full flex-col">
        <Script
          id="restore-color-mode"
          strategy="beforeInteractive"
        >{`try { document.documentElement.dataset.mode = localStorage.getItem('from-anna-mode') === 'dark' ? 'dark' : 'light' } catch {}`}</Script>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <ClerkProvider>{children}</ClerkProvider>
        <SiteAnalytics />
      </body>
    </html>
  )
}

import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Fraunces, Inter, JetBrains_Mono, Newsreader } from 'next/font/google'

import 'remark-scanned-page/styles/scanned-page.css'

import './globals.css'

export const metadata: Metadata = {
  title: 'from anna',
  description: 'Handwritten letters, published on the web.',
}

/*
  The four faces, downloaded at build time and served from this domain.

  They used to come from an `@import url(...)` of Google Fonts at the top of
  `globals.css`, which is how entrepta ships them. The build dropped it: it is
  in neither the dev nor the production stylesheet, so every page had been
  set in Times New Roman, Georgia and Menlo since the first deploy, and
  nothing said so. Each one is exposed as a CSS variable that the font tokens
  in `globals.css` name first.

  Variable fonts, so no weight list: every weight the stylesheet asks for is
  in the one file. The axes are the ones the stylesheet sets by hand:
  `opsz` on both serifs, and `SOFT` and `WONK` on Fraunces.
*/
const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  variable: '--font-newsreader',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz', 'SOFT', 'WONK'],
  variable: '--font-fraunces',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const fontVariables = [newsreader, fraunces, jetbrainsMono, inter]
  .map((font) => font.variable)
  .join(' ')

/**
 * `data-mode="light"` is deliberate and not a default.
 *
 * entrepta ships dark-first with an IDE metaphor, and this is the one project
 * where that fights the content: the page is a photograph of ink on paper,
 * and a dark editor chrome around it frames the wrong thing. Light mode is
 * overridden in `globals.css` to paper rather than white.
 *
 * Fonts come from `next/font`, above, as variables on `<html>`.
 *
 * The package stylesheet is imported before `globals.css` so this project's
 * palette is declared after the structure it fills in. Custom properties
 * resolve at use time, so the order is for readers, not the cascade.
 *
 * `ClerkProvider` sits inside `<body>` rather than around `<html>`, and it
 * wraps every route rather than only the admin ones. It has to: `auth()` is
 * read on the letter route too, by `requireAdmin()` deciding whether a draft
 * is a preview or a 404. It renders nothing and adds no visible chrome —
 * there is no sign-in button anywhere on the public site, because there are
 * no public accounts.
 */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" data-mode="light" className={`h-full ${fontVariables}`}>
      <body className="flex min-h-full flex-col">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  )
}

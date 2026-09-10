import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'

import 'remark-scanned-page/styles/scanned-page.css'

import './globals.css'

export const metadata: Metadata = {
  title: 'from anna',
  description: 'Handwritten letters, published on the web.',
}

/**
 * `data-mode="light"` is deliberate and not a default.
 *
 * entrepta ships dark-first with an IDE metaphor, and this is the one project
 * where that fights the content: the page is a photograph of ink on paper,
 * and a dark editor chrome around it frames the wrong thing. Light mode is
 * overridden in `globals.css` to paper rather than white.
 *
 * Fonts come from the `@import` at the top of `globals.css`, which is how
 * entrepta ships them.
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
    <html lang="en" data-mode="light" className="h-full">
      <body className="flex min-h-full flex-col">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  )
}

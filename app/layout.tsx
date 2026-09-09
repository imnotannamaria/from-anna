import type { Metadata } from 'next'

import 'remark-scanned-page/styles/scanned-page.css'

import './globals.css'

export const metadata: Metadata = {
  title: 'from anna',
  description: 'Handwritten letters, published on the web.',
}

/**
 * entrepta is dark-first: dark is the default and light is opted into with
 * `data-mode="light"` on this element. No attribute means dark, which is why
 * there is none here.
 *
 * Fonts come from the `@import` at the top of `globals.css`, which is how
 * entrepta ships them.
 *
 * The package stylesheet is imported before `globals.css` so this project's
 * palette is declared after the structure it fills in. Custom properties
 * resolve at use time, so the order is for readers, not the cascade.
 */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}

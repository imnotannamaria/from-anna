import type { Metadata } from 'next'

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
 */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}

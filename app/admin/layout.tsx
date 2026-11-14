import type { Metadata, Viewport } from 'next'

import { RootShell } from '@/app/root-shell'
import { THEME_COLOR } from '@/lib/theme/mode'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  ),
  title: 'from anna',
  robots: { index: false, follow: false },
}
export const viewport: Viewport = { themeColor: THEME_COLOR.light }

/**
 * The desk is the author's tool and it is in English: it is outside
 * `[locale]`, so it has its own root layout, drawn by the same shell.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RootShell locale="en">{children}</RootShell>
}

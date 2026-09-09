import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { ScannedPage } from 'remark-scanned-page'

import { LetterReader } from '@/components/letter/letter-reader'
import { requireAdmin } from '@/lib/auth/admin'
import {
  SESSION_COOKIE,
  deviceFrom,
  isAutomated,
  newSessionId,
  normaliseReferrer,
  normaliseSource,
} from '@/lib/analytics/visit'
import { isPubliclyReadable } from '@/lib/letters/access'
import { getLetterBySlug, recordView } from '@/lib/letters/queries'
import { HIGHLIGHT_TAGS } from '@/lib/theme/highlight-tags'
import { splitBlocks } from '@/lib/transcription/split'

/** Reads the database and records an opening. Never cached. */
export const dynamic = 'force-dynamic'

/**
 * Nothing about the letter goes in here.
 *
 * The slug is unguessable and the route is `noindex`, but metadata is also
 * what a link preview reads and caches, and a cached preview outlives
 * unpublishing. The title is deliberately generic.
 */
export const metadata: Metadata = {
  title: 'A letter',
  description: 'A handwritten letter.',
  robots: { index: false, follow: false, nocache: true },
}

export default async function LetterPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { slug } = await params
  const { from } = await searchParams

  const found = await getLetterBySlug(slug)
  if (!found) notFound()

  const { letter, pages } = found
  const readable = isPubliclyReadable(letter)

  if (!readable) {
    // A draft or an expired letter is mine to preview and nobody else's to
    // find. 404 rather than 403: a 403 confirms the slug exists.
    try {
      await requireAdmin()
    } catch {
      notFound()
    }
  }

  const headerList = await headers()
  const userAgent = headerList.get('user-agent')

  // Only a published letter is counted. Previewing my own draft is not a
  // reader, and neither is a link-preview fetch.
  if (readable && !isAutomated(userAgent)) {
    const jar = await cookies()

    // `proxy.ts` hands out this cookie before the page renders, because a
    // Server Component can read cookies but not set them. Without that, every
    // request would arrive with no session and a refresh would count as a new
    // reader — the exact thing the deduplication exists to prevent.
    const sessionId = jar.get(SESSION_COOKIE)?.value ?? newSessionId()

    await recordView({
      letterId: letter.id,
      sessionId,
      source: normaliseSource(from),
      referrer: normaliseReferrer(headerList.get('referer')),
      country: headerList.get('x-vercel-ip-country'),
      device: deviceFrom(userAgent),
    })
  }

  // One markdown document, split on `---`, so a page whose block is missing
  // still shows its photo rather than vanishing.
  const blocks = splitBlocks(letter.mdContent)

  return (
    <LetterReader
      letterId={letter.id}
      isPreview={!readable}
      renderedPages={pages.map((page, i) => (
        <ScannedPage
          key={page.id}
          imageSrc={`/api/letters/${letter.id}/pages/${page.index}`}
          alt={page.alt}
          width={page.width}
          height={page.height}
          markdown={blocks[i] ?? ''}
          pageNumber={page.index + 1}
          totalPages={pages.length}
          priority={i === 0}
          knownTags={HIGHLIGHT_TAGS}
          proseClassName="letter-prose"
        />
      ))}
    />
  )
}

import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { ScannedPhoto, ScannedTranscription } from 'remark-scanned-page'

import { LetterView } from '@/components/letter/letter-view'
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
import { letterName } from '@/lib/letters/name'
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

/**
 * The month a letter was sent, formatted on the server and in UTC.
 *
 * Formatting a date in a client component would give the server one answer
 * and the browser another, which React reports as a hydration mismatch and a
 * reader across a date line sees as the wrong month.
 */
function sentOn(date: Date | null): string | null {
  if (!date) return null
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
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

  // One markdown document, split on `---`, so a sheet whose block is missing
  // still shows its photo rather than vanishing.
  const blocks = splitBlocks(letter.mdContent)

  const photoSrc = (index: number) =>
    `/api/letters/${letter.id}/pages/${index}`

  const sheets = pages.map((page, i) => ({
    key: page.id,
    ratio: page.width / page.height,
    photo: (
      <ScannedPhoto
        imageSrc={photoSrc(page.index)}
        screenSrc={
          page.screenBlobUrl ? `${photoSrc(page.index)}?size=screen` : undefined
        }
        screenWidth={page.screenWidth ?? undefined}
        alt={page.alt}
        width={page.width}
        height={page.height}
        // Everything but the opening is below the fold, and each sheet is
        // large enough to zoom into.
        priority={false}
      />
    ),
    prose: (
      <ScannedTranscription
        markdown={blocks[i] ?? ''}
        className="letter-prose"
        knownTags={HIGHLIGHT_TAGS}
      />
    ),
  }))

  const first = pages[0]

  return (
    <LetterView
      letterId={letter.id}
      isPreview={!readable}
      name={letterName(letter.slug)}
      sentOn={sentOn(letter.publishedAt)}
      // From the environment, never the repository. Absent hides the button
      // rather than shipping a broken `mailto:`.
      writeBackEmail={process.env.WRITE_BACK_EMAIL || null}
      tags={HIGHLIGHT_TAGS}
      sheets={sheets}
      heroPhoto={
        first ? (
          <ScannedPhoto
            imageSrc={photoSrc(first.index)}
            screenSrc={
              first.screenBlobUrl
                ? `${photoSrc(first.index)}?size=screen`
                : undefined
            }
            screenWidth={first.screenWidth ?? undefined}
            // Deliberately empty: the same sheet appears again below with its
            // real description and its transcription attached. Describing it
            // twice makes the spoken page longer than the letter, and the
            // wrapper in the hero is `aria-hidden` for the same reason.
            alt=""
            width={first.width}
            height={first.height}
            priority
          />
        ) : null
      }
    />
  )
}

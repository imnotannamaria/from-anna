import type { NextRequest } from 'next/server'

import { NotAuthorizedError, requireAdmin } from '@/lib/auth/admin'
import { readBlobAsDataUrl } from '@/lib/blob/read'
import {
  getLetterWithPages,
  saveTranscriptions,
  seedMdContent,
} from '@/lib/letters/mutations'
import { TranscriptionError, transcribe } from '@/lib/transcription/openrouter'
import { joinPages, splitTranscription } from '@/lib/transcription/split'

export const dynamic = 'force-dynamic'

/**
 * Transcribe every page of a letter in one call.
 *
 * Triggered by a button, never automatically after upload — that leaves room
 * to look at the photos and retake a blurry one before spending a call.
 *
 * There is no retry here. A failed request is not billed, so retrying is
 * cheap, but it is the caller's decision to make out loud rather than
 * something that happens invisibly.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return new Response('Not found', { status: 404 })
    }
    throw error
  }

  const { id } = await params

  const letter = await getLetterWithPages(id)
  if (!letter) return new Response('Not found', { status: 404 })
  if (letter.pages.length === 0) {
    return Response.json(
      { error: 'This letter has no pages yet.' },
      { status: 400 },
    )
  }

  let result
  try {
    // The Blob store is private, so OpenRouter cannot fetch these URLs
    // itself. The bytes ride in the request body as data URLs instead.
    const images = await Promise.all(
      letter.pages.map((page) => readBlobAsDataUrl(page.blobUrl)),
    )
    result = await transcribe(images)
  } catch (error) {
    if (error instanceof TranscriptionError) {
      const status =
        error.code === 'rate_limited'
          ? 429
          : error.code === 'not_configured'
            ? 500
            : 502
      return Response.json(
        { error: error.message, code: error.code },
        { status },
      )
    }
    console.error('transcription failed', error)
    return Response.json({ error: 'Transcription failed.' }, { status: 502 })
  }

  const split = splitTranscription(result.text, letter.pages.length)

  if (split.status === 'mismatch') {
    // Losing the split is recoverable, losing the transcription is not, so
    // the whole response goes on the first page and the caller is warned.
    await saveTranscriptions([
      {
        pageId: letter.pages[0].id,
        raw: split.whole,
        provider: result.provider,
      },
    ])

    return Response.json(
      {
        warning: 'mismatch',
        message: `The model returned ${split.found} block${split.found === 1 ? '' : 's'} for ${split.expected} pages. The full text was saved to page 1 so nothing was lost. Check for a "---" line inside the letter itself.`,
        expected: split.expected,
        found: split.found,
        provider: result.provider,
      },
      { status: 200 },
    )
  }

  await saveTranscriptions(
    letter.pages.map((page, i) => ({
      pageId: page.id,
      raw: split.pages[i],
      provider: result.provider,
    })),
  )

  // Seeding refuses to overwrite a letter that has already been edited.
  const seed = await seedMdContent(id, joinPages(split.pages))

  return Response.json({
    pages: split.pages.length,
    provider: result.provider,
    seededEditor: seed.seeded,
    seedSkippedBecause: seed.reason,
  })
}

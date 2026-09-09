import { put } from '@vercel/blob'
import type { NextRequest } from 'next/server'

import { NotAuthorizedError, requireAdmin } from '@/lib/auth/admin'
import { MAX_PAGES_PER_LETTER } from '@/lib/db/schema'
import { TooManyPagesError, addPages } from '@/lib/letters/mutations'
import { MAX_DIMENSION, OUTPUT_TYPE } from '@/lib/images/process'

/** Reads the database, so it can never be cached. */
export const dynamic = 'force-dynamic'

/**
 * Upload already-processed page photos and attach them to a letter.
 *
 * The client has resized and re-encoded the images before they got here, so
 * anything arriving oversized or in the wrong format is either a bug or
 * someone calling this directly. Both are rejected.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      // 404, never 403 — a 403 confirms the letter exists.
      return new Response('Not found', { status: 404 })
    }
    throw error
  }

  const { id } = await params

  const form = await request.formData()
  const files = form.getAll('page').filter((v): v is File => v instanceof File)
  const alts = form.getAll('alt').map(String)

  if (files.length === 0) {
    return Response.json({ error: 'No pages were sent.' }, { status: 400 })
  }
  if (files.length > MAX_PAGES_PER_LETTER) {
    return Response.json(
      { error: `A letter holds at most ${MAX_PAGES_PER_LETTER} pages.` },
      { status: 400 },
    )
  }
  if (alts.length !== files.length || alts.some((alt) => alt.trim() === '')) {
    // An image of text is invisible to a screen reader, so a page without
    // alt text is a page that cannot be published.
    return Response.json(
      { error: 'Every page needs alt text.' },
      { status: 400 },
    )
  }
  if (files.some((file) => file.type !== OUTPUT_TYPE)) {
    return Response.json(
      { error: 'Pages must be processed to JPEG before upload.' },
      { status: 400 },
    )
  }

  const dimensions = files.map((_, i) => ({
    width: Number(form.getAll('width')[i]),
    height: Number(form.getAll('height')[i]),
  }))

  if (
    dimensions.some(
      ({ width, height }) =>
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width < 1 ||
        height < 1 ||
        Math.max(width, height) > MAX_DIMENSION,
    )
  ) {
    return Response.json(
      { error: 'Page dimensions are missing or out of range.' },
      { status: 400 },
    )
  }

  try {
    const uploaded = await Promise.all(
      files.map(async (file, i) => {
        // Private: the photo is the letter's content, and a public URL
        // would outlive unpublishing and expiry.
        const blob = await put(`letters/${id}/${crypto.randomUUID()}.jpg`, file, {
          access: 'private',
          contentType: OUTPUT_TYPE,
        })
        return {
          blobUrl: blob.url,
          width: dimensions[i].width,
          height: dimensions[i].height,
          alt: alts[i].trim(),
        }
      }),
    )

    const rows = await addPages(id, uploaded)
    return Response.json({ pages: rows }, { status: 201 })
  } catch (error) {
    if (error instanceof TooManyPagesError) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    // Never forward an upstream body: it can echo the request and the token.
    console.error('page upload failed', error)
    return Response.json({ error: 'Upload failed.' }, { status: 500 })
  }
}

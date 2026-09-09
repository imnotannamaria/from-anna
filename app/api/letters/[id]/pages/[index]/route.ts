import type { NextRequest } from 'next/server'

import { requireAdmin } from '@/lib/auth/admin'
import { BlobNotFoundError, readBlob } from '@/lib/blob/read'
import { isPubliclyReadable } from '@/lib/letters/access'
import { getLetterWithPages } from '@/lib/letters/mutations'

export const dynamic = 'force-dynamic'

/**
 * Serve one page photo.
 *
 * The Blob store is private, so this Function is the only way to a photo.
 * That is the point rather than a cost: it means unpublishing a letter, or
 * letting it expire, actually takes the photo down with it. A public blob URL
 * would keep working long after either, and the photo *is* the letter.
 *
 * A published, unexpired letter is readable by anyone with the link. Anything
 * else is admin-only, and a refusal is a 404 rather than a 403 — a 403 would
 * confirm the letter exists.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; index: string }> },
) {
  const { id, index } = await params

  const pageIndex = Number(index)
  if (!Number.isInteger(pageIndex) || pageIndex < 0) {
    return new Response('Not found', { status: 404 })
  }

  const letter = await getLetterWithPages(id)
  if (!letter) return new Response('Not found', { status: 404 })

  if (!isPubliclyReadable(letter.letter)) {
    try {
      await requireAdmin()
    } catch {
      return new Response('Not found', { status: 404 })
    }
  }

  const page = letter.pages.find((candidate) => candidate.index === pageIndex)
  if (!page) return new Response('Not found', { status: 404 })

  try {
    const blob = await readBlob(page.blobUrl)

    return new Response(blob.stream, {
      headers: {
        'Content-Type': blob.blob.contentType || 'image/jpeg',
        'Content-Length': String(blob.blob.size),
        // Private, because the response is only valid for whoever was allowed
        // through above. A shared cache must not hold it: the letter can be
        // unpublished, and a CDN copy would outlive that.
        'Cache-Control': 'private, max-age=3600, must-revalidate',
        // Photographs of a letter have no business in a search index.
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return new Response('Not found', { status: 404 })
    }
    console.error('failed to read page blob', error)
    return new Response('Could not load the page image', { status: 500 })
  }
}

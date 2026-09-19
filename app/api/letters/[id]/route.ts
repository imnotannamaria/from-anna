import { del } from '@vercel/blob'
import type { NextRequest } from 'next/server'

import { NotAuthorizedError, requireAdmin } from '@/lib/auth/admin'
import { validateLetterDetails } from '@/lib/letters/details'
import {
  deleteLetter,
  getLetterWithPages,
  saveMdContent,
  setLetterStatus,
  updateLetterDetails,
} from '@/lib/letters/mutations'

export const dynamic = 'force-dynamic'

/** Generous, but bounded. A letter is a few hundred words. */
const MAX_MD_BYTES = 200_000

/**
 * Save the edited transcription.
 *
 * The only path allowed to replace `mdContent`. Seeding from the raws refuses
 * to overwrite existing text, which is what stops a second transcription run
 * from silently eating an evening of corrections.
 */
export async function PATCH(
  request: NextRequest,
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

  const body = (await request.json().catch(() => null)) as {
    title?: unknown
    recipient?: unknown
    mdContent?: unknown
    status?: unknown
    expiresAt?: unknown
  } | null

  if (!body) {
    return Response.json({ error: 'Expected a JSON body.' }, { status: 400 })
  }

  // One kind of change per request: the text, the details, or the status and
  // expiry. Each branch below returns, so a body that mixed two used to save
  // the first and drop the rest without saying so.
  const kinds = [
    body.mdContent !== undefined,
    body.title !== undefined || body.recipient !== undefined,
    body.status !== undefined || body.expiresAt !== undefined,
  ].filter(Boolean).length
  if (kinds > 1) {
    return Response.json(
      {
        error:
          'Send the text, the details, or the status and expiry, one at a time.',
      },
      { status: 400 },
    )
  }

  if (body.title !== undefined || body.recipient !== undefined) {
    const details = validateLetterDetails(body)
    if (!details.ok)
      return Response.json({ error: details.error }, { status: 400 })
    const row = await updateLetterDetails(id, {
      title: details.title,
      recipient: details.recipient,
    })
    if (!row) return new Response('Not found', { status: 404 })
    return Response.json({ title: row.title, recipient: row.recipient })
  }

  // Validated on the server, not just in the form.
  if (body.mdContent !== undefined) {
    if (typeof body.mdContent !== 'string') {
      return Response.json(
        { error: 'mdContent must be a string.' },
        { status: 400 },
      )
    }
    if (Buffer.byteLength(body.mdContent, 'utf8') > MAX_MD_BYTES) {
      return Response.json({ error: 'That is too long.' }, { status: 413 })
    }

    const row = await saveMdContent(id, body.mdContent)
    if (!row) return new Response('Not found', { status: 404 })
    return Response.json({ savedAt: row.updatedAt })
  }

  if (
    body.status !== undefined &&
    body.status !== 'draft' &&
    body.status !== 'published'
  ) {
    return Response.json(
      { error: 'status must be draft or published.' },
      { status: 400 },
    )
  }

  // The desk disables Publish until there is a photograph and saved text, and
  // the same rule holds here: a link that opens on an empty letter is the one
  // mistake the recipient sees.
  if (body.status === 'published') {
    const current = await getLetterWithPages(id)
    if (!current) return new Response('Not found', { status: 404 })
    if (current.pages.length === 0 || !current.letter.mdContent.trim()) {
      return Response.json(
        {
          error:
            'Add a photograph and save the transcription before publishing.',
        },
        { status: 409 },
      )
    }
  }

  let expiresAt: Date | null | undefined
  if (body.expiresAt !== undefined) {
    if (body.expiresAt === null || body.expiresAt === '') {
      expiresAt = null
    } else if (typeof body.expiresAt === 'string') {
      const parsed = new Date(body.expiresAt)
      if (Number.isNaN(parsed.getTime())) {
        return Response.json(
          { error: 'expiresAt is not a date.' },
          { status: 400 },
        )
      }
      expiresAt = parsed
    } else {
      return Response.json(
        { error: 'expiresAt must be a date string or null.' },
        { status: 400 },
      )
    }
  }

  const row = await setLetterStatus(id, {
    status: body.status as 'draft' | 'published' | undefined,
    expiresAt,
  })
  if (!row) return new Response('Not found', { status: 404 })

  return Response.json({
    status: row.status,
    expiresAt: row.expiresAt,
    publishedAt: row.publishedAt,
  })
}

/**
 * Delete a letter, its pages, its numbers and its photographs.
 *
 * The photographs are the letter's content and live in the Blob store, which
 * the database cascade cannot reach. Deleting only the row would leave them
 * stored for good — private, so unreachable, but kept, and a delete that
 * keeps the thing it deleted is not one.
 */
export async function DELETE(
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
  const result = await deleteLetter(id)
  if (!result.deleted) return new Response('Not found', { status: 404 })

  if (result.blobUrls.length > 0) {
    try {
      await del(result.blobUrls)
    } catch (error) {
      // The letter is already gone, and the photographs are private. Log it
      // for cleanup rather than tell me the delete failed when it did not.
      console.error('letter deleted, blob cleanup failed', error)
      return Response.json({ deleted: true, photographs: 'left behind' })
    }
  }

  return Response.json({ deleted: true })
}

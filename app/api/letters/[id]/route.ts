import type { NextRequest } from 'next/server'

import { NotAuthorizedError, requireAdmin } from '@/lib/auth/admin'
import { saveMdContent } from '@/lib/letters/mutations'

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
    mdContent?: unknown
  } | null

  // Validated on the server, not just in the form.
  if (!body || typeof body.mdContent !== 'string') {
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

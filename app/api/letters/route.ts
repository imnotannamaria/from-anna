import type { NextRequest } from 'next/server'

import { NotAuthorizedError, requireAdmin } from '@/lib/auth/admin'
import { createLetter } from '@/lib/letters/mutations'

export const dynamic = 'force-dynamic'

/** Internal labels, not content. A few words each is plenty. */
const MAX_TITLE = 200
const MAX_RECIPIENT = 200

/**
 * Start a letter.
 *
 * There was no way to do this until now — `createLetter()` existed and
 * nothing called it, so the only letter in the database had been inserted by
 * hand through Drizzle Studio. That works exactly once and then stops being
 * funny.
 *
 * A letter starts as a **draft with no pages and no text**, which is the
 * honest order: it exists so photographs have somewhere to go, and it is a
 * 404 to everyone until it is published.
 *
 * Neither field is ever rendered on the published page. `title` is how I find
 * it in a list and `recipient` is who I wrote it for — both mine, and neither
 * belongs in front of the person reading.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      // 404, never 403 — a 403 confirms the thing exists.
      return new Response('Not found', { status: 404 })
    }
    throw error
  }

  const body = (await request.json().catch(() => null)) as {
    title?: unknown
    recipient?: unknown
  } | null

  if (!body) {
    return Response.json({ error: 'Expected a JSON body.' }, { status: 400 })
  }

  // Validated on the server, not only in the form: a client-side limit is a
  // convenience and a server-side one is a rule.
  if (typeof body.title !== 'string' || body.title.trim() === '') {
    return Response.json(
      { error: 'A letter needs a title to find it by.' },
      { status: 400 },
    )
  }
  if (body.title.trim().length > MAX_TITLE) {
    return Response.json({ error: 'That title is too long.' }, { status: 400 })
  }

  if (body.recipient !== undefined && body.recipient !== null) {
    if (typeof body.recipient !== 'string') {
      return Response.json(
        { error: 'recipient must be text.' },
        { status: 400 },
      )
    }
    if (body.recipient.trim().length > MAX_RECIPIENT) {
      return Response.json(
        { error: 'That recipient is too long.' },
        { status: 400 },
      )
    }
  }

  const recipient =
    typeof body.recipient === 'string' && body.recipient.trim() !== ''
      ? body.recipient.trim()
      : null

  const letter = await createLetter({ title: body.title.trim(), recipient })

  return Response.json(
    { id: letter.id, slug: letter.slug, title: letter.title },
    { status: 201 },
  )
}

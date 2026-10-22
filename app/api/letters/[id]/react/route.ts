import { cookies, headers } from 'next/headers'
import type { NextRequest } from 'next/server'

import { SESSION_COOKIE, isAutomated } from '@/lib/analytics/visit'
import { isAdmin } from '@/lib/auth/admin'
import { isPubliclyReadable } from '@/lib/letters/access'
import { getLetterWithPages, isLetterId } from '@/lib/letters/mutations'
import { setReaction } from '@/lib/letters/queries'
import { parseReactionBody } from '@/lib/letters/reactions'

export const dynamic = 'force-dynamic'

/**
 * A reader answers the letter with an emoji, or takes it back.
 *
 * It takes a reaction from a closed list and a boolean, and nothing else from
 * the caller: the reader is the session cookie, never a field in the body, so
 * nobody can react as somebody else or write an arbitrary string into the
 * table. Choosing the same reaction twice is a no-op in the database.
 *
 * Every way of not being allowed to — no session, a bot, the author, a draft,
 * an expired letter, an id that does not exist — answers the same 404, for the
 * reason the page does: telling them apart would hand back what the
 * unguessable slug withholds.
 *
 * There is no rate limit keyed on the caller, because that would mean keeping
 * something about the caller. The bound is structural: a session holds at
 * most one row per reaction, and the list is six long.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const refused = () => new Response(null, { status: 404 })

  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value
  if (!sessionId || !isLetterId(id)) return refused()
  if (isAutomated((await headers()).get('user-agent'))) return refused()

  // The author checking their own letter is not a reader, and a reaction from
  // the author would be counted as the reader's answer.
  if (await isAdmin()) return refused()

  const body = parseReactionBody(await request.json().catch(() => null))
  if (!body) return new Response(null, { status: 400 })

  const found = await getLetterWithPages(id)
  if (!found || !isPubliclyReadable(found.letter)) return refused()

  try {
    const reactions = await setReaction({
      letterId: id,
      sessionId,
      reaction: body.reaction,
      on: body.on,
    })
    return Response.json({ reactions }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('could not save reaction', error)
    return new Response(null, { status: 503 })
  }
}

import { cookies, headers } from 'next/headers'
import type { NextRequest } from 'next/server'

import { SESSION_COOKIE, isAutomated } from '@/lib/analytics/visit'
import { isPubliclyReadable } from '@/lib/letters/access'
import { getLetterWithPages } from '@/lib/letters/mutations'
import { markReachedEnd } from '@/lib/letters/queries'

export const dynamic = 'force-dynamic'

/**
 * The second of the two marks: this reader got to the end of the letter.
 *
 * It takes nothing from the caller but the letter in the URL. The session
 * comes from the cookie and the row it updates is the one that session
 * already has — otherwise anyone with the link could write whatever they
 * liked into the table.
 *
 * It updates rather than inserts, so a letter that was read still counts as
 * one opening.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value
  if (!sessionId) return new Response(null, { status: 204 })

  if (isAutomated((await headers()).get('user-agent'))) {
    return new Response(null, { status: 204 })
  }

  const found = await getLetterWithPages(id)
  // Only a published letter is measured. Previewing my own draft is not a
  // reader, and a 404 here would leak whether the id exists.
  if (!found || !isPubliclyReadable(found.letter)) {
    return new Response(null, { status: 204 })
  }

  await markReachedEnd(id, sessionId)

  // No body. The client does not act on the answer, and a measurement should
  // not hand anything back that could be worth probing for.
  return new Response(null, { status: 204 })
}

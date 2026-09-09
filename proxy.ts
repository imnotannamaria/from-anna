import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { SESSION_COOKIE, isAutomated } from '@/lib/analytics/visit'

/**
 * Gives a reader a session cookie before the page renders.
 *
 * This exists because a Server Component can read cookies but cannot set
 * them. Without it every request would arrive with no session, the page would
 * invent a new id each time, and the per-session deduplication would count a
 * refresh as a new reader — which is the exact thing it was added to prevent.
 *
 * It is **not** the gate for anything. A draft is a 404 because the page and
 * the route handler say so, not because a matcher does. A matcher can be
 * edited wrong; this one is only here to hand out an opaque id.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next()

  if (request.cookies.has(SESSION_COOKIE)) return response

  // No cookie for a bot or a link preview: they are filtered out of the
  // count anyway, and handing one out would only make them look like people
  // on a second fetch.
  if (isAutomated(request.headers.get('user-agent'))) return response

  response.cookies.set(SESSION_COOKIE, crypto.randomUUID(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // Long enough that the same person is not counted twice next week,
    // short enough that it is not a permanent identifier.
    maxAge: 60 * 60 * 24 * 180,
  })

  return response
}

export const config = {
  /*
    Only the letter routes. Nothing else needs a session, and handing cookies
    to static assets is noise.
  */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}

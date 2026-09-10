import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { SESSION_COOKIE, isAutomated } from '@/lib/analytics/visit'
import { isAdminAllowed, readAdminContext } from '@/lib/auth/admin'

/**
 * Two jobs, and they are unrelated on purpose.
 *
 * **Clerk's session runs here** because `auth()` has nothing to read in a
 * Server Component or a route handler unless the middleware has already
 * looked at the request. It is not the gate: `requireAdmin()` is called in
 * every admin page and every admin route handler, and a matcher that stopped
 * matching would not open anything. This only makes the session *readable*.
 *
 * **The reading session cookie is issued here** because a Server Component
 * can read cookies but cannot set them. Without it every request would
 * arrive with no session, the page would invent a new id each time, and the
 * per-session deduplication would count a refresh as a new reader — the
 * exact thing it was added to prevent.
 */
function issueReadingSession(request: NextRequest, response: NextResponse) {
  if (request.cookies.has(SESSION_COOKIE)) return

  // The cookie belongs to reading a letter. An API call is already made by
  // someone who has one, and Clerk's own handshake is not a reader at all.
  const path = request.nextUrl.pathname
  if (path.startsWith('/api/') || path.startsWith('/__clerk')) return

  // No cookie for a bot or a link preview: they are filtered out of the
  // count anyway, and handing one out would only make them look like people
  // on a second fetch.
  if (isAutomated(request.headers.get('user-agent'))) return

  response.cookies.set(SESSION_COOKIE, crypto.randomUUID(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // Long enough that the same person is not counted twice next week,
    // short enough that it is not a permanent identifier.
    maxAge: 60 * 60 * 24 * 180,
  })
}

/**
 * The admin surfaces are refused here as well as in every page and route
 * handler, and the reason is the status code rather than the access.
 *
 * `app/admin/loading.tsx` opens a Suspense boundary, so Next sends the
 * response headers — a 200 — before the page has decided anything. A
 * `notFound()` after that swaps the body and cannot take the status back. The
 * result was `/admin` answering **200 with the 404 page inside it**, which is
 * a worse answer than either: it says the route exists and the request
 * succeeded.
 *
 * Refusing before the render starts is the only place the status is still
 * ours to choose. This is **not** the gate — `requireAdmin()` in the page and
 * in the handler is, and a matcher that quietly stopped matching would change
 * nothing about who gets in. It is the same pure decision, called earlier.
 */
function refusesAdmin(request: NextRequest, userId: string | null): boolean {
  const path = request.nextUrl.pathname
  if (!path.startsWith('/admin')) return false

  // The one door. It has to stay open to someone who is not allowed in yet —
  // that is the whole point of it.
  if (path.startsWith('/admin/sign-in')) return false

  return !isAdminAllowed(readAdminContext(userId))
}

export const proxy = clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()

  if (refusesAdmin(request, userId)) {
    // 404, never 403. A 403 confirms the thing exists, and this answer has to
    // be the same one a made-up path gets.
    return new NextResponse(null, { status: 404 })
  }

  const response = NextResponse.next()
  issueReadingSession(request, response)
  return response
})

export const config = {
  /*
    Everything but static assets, and the API routes as well.

    The API routes matter and did not before: `requireAdmin()` runs inside
    the upload and transcription handlers, and `auth()` returns nothing there
    unless Clerk has seen the request. Leaving `api/` excluded here would
    have made uploading a photo fail with a 404 while signed in, which is a
    long way from where anyone would look for the cause.
  */
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/:path*',
  ],
}

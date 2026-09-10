'use client'

import { Analytics } from '@vercel/analytics/next'

import { scrubEvent } from '@/lib/analytics/vercel-events'

/**
 * Vercel Web Analytics, scrubbed before anything is sent.
 *
 * A client component only because `beforeSend` is a function, and a
 * function cannot be passed from the server layout. What gets scrubbed, and
 * why, is in `lib/analytics/vercel-events.ts`.
 */
export function SiteAnalytics() {
  return <Analytics beforeSend={scrubEvent} />
}

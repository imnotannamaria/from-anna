/**
 * Deciding what counts as a reader.
 *
 * All of it is pure, because every interesting case is a string: a user agent
 * that belongs to a link preview, a `?from=` that was never set, my own
 * refresh. None of them need a request to test.
 */

/**
 * User agents that fetch a URL without a person behind them.
 *
 * Messaging apps and social networks open every link they are sent, to build
 * the preview card. Without this filter every letter is born with a view it
 * did not earn — right at the moment the number matters most, because the
 * first thing that ever hits the URL is the app I pasted it into.
 *
 * Matching is deliberately loose. A false negative is a fake reader in the
 * data; a false positive is a real reader missing from it. Neither is good,
 * but a number that is quietly too high is the one that would change what I
 * write next, so this leans towards excluding.
 */
const BOT_PATTERNS = [
  'bot',
  'crawler',
  'spider',
  'crawling',
  'facebookexternalhit',
  'facebookcatalog',
  'whatsapp',
  'telegram',
  'slackbot',
  'discordbot',
  'linkedinbot',
  'twitterbot',
  'skypeuripreview',
  'embedly',
  'quora link preview',
  'pinterest',
  'redditbot',
  'applebot',
  'vercelbot',
  'headlesschrome',
  'lighthouse',
  'curl/',
  'wget/',
  'python-requests',
  'go-http-client',
  'node-fetch',
  'axios/',
  'preview',
  'monitor',
  'ptst', // WebPageTest
]

export function isAutomated(userAgent: string | null | undefined): boolean {
  if (!userAgent) {
    // No user agent at all is a script, not a person with a browser.
    return true
  }
  const ua = userAgent.toLowerCase()
  return BOT_PATTERNS.some((pattern) => ua.includes(pattern))
}

/**
 * Coarse device class from the user agent.
 *
 * Three buckets is all this needs to answer "was the photo legible on the
 * thing they opened it on", which is the only device question the project
 * has. Anything finer would be fingerprinting for no gain.
 */
export function deviceFrom(userAgent: string | null | undefined): string {
  if (!userAgent) return 'unknown'
  const ua = userAgent.toLowerCase()

  if (/ipad|tablet|playbook|silk/.test(ua)) return 'tablet'
  if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(ua)) return 'mobile'
  return 'desktop'
}

/** Length cap, so a hostile query string cannot write an essay into a column. */
const MAX_SOURCE_LENGTH = 64

/**
 * Normalise `?from=`.
 *
 * `source` is who I said the link was for. It is not the referrer, which is
 * where the visit actually came from — those are different facts and they get
 * different columns.
 */
export function normaliseSource(raw: string | null | undefined): string | null {
  if (!raw) return null

  const trimmed = raw.trim().toLowerCase().slice(0, MAX_SOURCE_LENGTH)
  if (trimmed === '') return null

  // Keep it to something that reads as a name in a table.
  const cleaned = trimmed.replace(/[^a-z0-9._-]/g, '-').replace(/-{2,}/g, '-')
  const bounded = cleaned.replace(/^-+|-+$/g, '')

  return bounded === '' ? null : bounded
}

/** Hostnames only. A full referrer URL can carry a query string with anything in it. */
export function normaliseReferrer(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    return new URL(raw).hostname || null
  } catch {
    return null
  }
}

export const SESSION_COOKIE = 'fa_sid'

/** Opaque, random, and not derived from anything about the person. */
export function newSessionId(): string {
  return crypto.randomUUID()
}

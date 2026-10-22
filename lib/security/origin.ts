/**
 * Whether a request that changes something came from another site.
 *
 * Defence in depth, not the gate. Every admin route already checks the
 * session, and Clerk's cookie is `SameSite=Lax`, so a form on another site
 * cannot carry it. But the routes read their body with `request.json()`,
 * which does not care about the content type, so a cross-site `text/plain`
 * POST is shaped like a real one. Refusing it here costs nothing and does not
 * depend on how a cookie happens to be configured.
 *
 * Safe methods are never refused. A request with neither header is a
 * non-browser client, which no cookie rides along with anyway.
 */
export function isCrossSiteWrite(input: {
  method: string
  host: string | null
  origin: string | null
  fetchSite: string | null
}): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(input.method.toUpperCase())) {
    return false
  }

  if (input.fetchSite === 'cross-site') return true

  if (!input.origin) return false
  if (input.origin === 'null') return true

  try {
    return new URL(input.origin).host !== input.host
  } catch {
    return true
  }
}

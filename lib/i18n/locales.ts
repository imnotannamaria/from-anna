/**
 * The two languages of the site, and how one is picked for a visitor.
 *
 * The language is in the address: English at the root (`/`, `/the-letter`),
 * Portuguese under `/pt` (`/pt`, `/pt/the-letter`). Each has its own URL, so a
 * link opens in the language of whoever sent it — which is the point for a
 * letter, where the link is written for one person. Inside the app every page
 * lives under a `[locale]` segment, `/en` and `/pt`; `proxy.ts` maps the
 * English ones to the root, so `/en` is never seen.
 *
 * Only the front page chooses for the visitor. A letter's language is the one
 * in its link: a reader whose browser prefers Portuguese was sent an English
 * link on purpose, or the author would have sent `/pt/…`.
 */
export const LOCALES = ['en', 'pt'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

/** What `<html lang>` says for each. */
export const HTML_LANG: Record<Locale, string> = { en: 'en', pt: 'pt-BR' }
export const LOCALE_NAME: Record<Locale, string> = {
  en: 'English',
  pt: 'Português',
}

/**
 * The cookie a click on the language link writes. A year, since it is a choice
 * and not a session. It is read only to decide where `/` goes.
 */
export const LOCALE_COOKIE = 'site-lang'
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value)

/** The language after this one: what the language link switches to. */
export function otherLocale(locale: Locale): Locale {
  return LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length]
}

/**
 * The language for a request: the visitor's own choice if they made one,
 * otherwise the first language their browser asks for that the site speaks,
 * otherwise English.
 */
export function localeFrom(
  cookie: string | undefined,
  acceptLanguage: string | null,
): Locale {
  if (isLocale(cookie)) return cookie
  if (!acceptLanguage) return DEFAULT_LOCALE

  const wanted = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';')
      const q = params
        .map((param) => param.trim())
        .find((param) => param.startsWith('q='))
      const weight = q ? Number(q.slice(2)) : 1
      return {
        tag: tag.toLowerCase(),
        weight: Number.isFinite(weight) ? weight : 0,
      }
    })
    .filter(({ tag, weight }) => tag && weight > 0)
    // A stable sort: equal weights keep the order the browser sent them in.
    .sort((a, b) => b.weight - a.weight)

  for (const { tag } of wanted) {
    const primary = tag.split('-')[0]
    if (isLocale(primary)) return primary
  }
  return DEFAULT_LOCALE
}

/**
 * An address without its language: `/pt/x` and `/en/x` are both `/x`. It is how
 * the proxy tells the front page from a letter whatever the language.
 */
export function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split('/')
  if (!isLocale(first)) return pathname
  // `/pt//host` has an empty segment, and `/` + `/host` is `//host`: a
  // protocol-relative URL that would take a redirect off the site. Leading
  // slashes collapse to one.
  return `/${rest.join('/').replace(/^\/+/, '')}`
}

/** The address of a page in a language: `/x` in English, `/pt/x` in Portuguese. */
export function localePath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (locale === DEFAULT_LOCALE) return clean
  return clean === '/' ? `/${locale}` : `/${locale}${clean}`
}

/** The language an address is written in, or null when it carries none (which reads as English). */
export function localeOfPath(pathname: string): Locale | null {
  const first = pathname.split('/')[1]
  return isLocale(first) ? first : null
}

/**
 * The preview image of a page. Next advertises it at the address the page has
 * *inside* the app, `/en/…/opengraph-image`, and a link-preview scraper does
 * not always follow a redirect to an image, so that address answers itself.
 */
const isPreviewImage = (pathname: string) =>
  /\/opengraph-image(-\w+)?$/.test(pathname)

/**
 * Whether an address is a page of the site, the only kind that has a language.
 *
 * Not the desk, the API, Clerk's own paths or Vercel's analytics, and not a
 * file: the proxy's matcher leaves only some extensions out, and without this
 * the paper sounds in `public/sounds/` were sent to `/en/sounds/…` and answered
 * 404. A slug never has a dot in it.
 */
export function isPagePath(pathname: string): boolean {
  if (/\.[^/]+$/.test(pathname)) return false
  return ![
    '/admin',
    '/api/',
    '/trpc',
    '/__clerk',
    '/_vercel',
  ].some((prefix) => pathname.startsWith(prefix))
}

/** What `proxy.ts` does with a page request. */
export type Routing =
  | { kind: 'serve' }
  | { kind: 'redirect'; to: string; permanent: boolean }
  | { kind: 'rewrite'; to: string }

/**
 * Where a request for a page goes. Kept here, away from the proxy, so the rule
 * can be read and tested on its own:
 *
 * - `/pt/...` is served as it is
 * - `/en/...` is not an address of the site, and goes to the same page without
 *   the prefix, for good — except a preview image, which is served where it is
 * - `/` goes to Portuguese, for now, when the visitor would rather read it —
 *   their own choice first, their browser's otherwise
 * - anything else is English, served from `/en/...` under the same address
 */
export function routePage(
  pathname: string,
  cookie: string | undefined,
  acceptLanguage: string | null,
): Routing {
  const inPath = localeOfPath(pathname)
  if (inPath === DEFAULT_LOCALE) {
    if (isPreviewImage(pathname)) return { kind: 'serve' }
    return { kind: 'redirect', to: stripLocale(pathname), permanent: true }
  }
  if (inPath) return { kind: 'serve' }

  if (pathname === '/') {
    const wanted = localeFrom(cookie, acceptLanguage)
    if (wanted !== DEFAULT_LOCALE) {
      // 307: it depends on who is asking, so it is never remembered for the
      // next visitor.
      return {
        kind: 'redirect',
        to: localePath(wanted, pathname),
        permanent: false,
      }
    }
  }
  return {
    kind: 'rewrite',
    to: `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`,
  }
}

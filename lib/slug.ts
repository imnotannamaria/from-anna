/**
 * Letter slugs: the title, and the day the letter was started.
 *
 * `carta-pro-joao-2026-09-10`. Readable, it says what it is, and two letters
 * with the same title on different days do not collide.
 *
 * This replaced three random words plus a six-character token, which gave
 * about 2^48 combinations and nobody a way to guess one. That property is
 * gone on purpose: a published letter can now be found by someone who knows
 * roughly what it is called and when it was written. A **draft** is still a
 * 404 to everyone but me, whatever its slug, because that check lives in the
 * route and not in the address.
 *
 * Uniqueness is enforced by the unique index on `letters.slug`. What happens
 * on a collision is up to the caller: a generated slug gets `-2`, `-3`; a slug
 * I typed myself is refused, because silently changing it is worse.
 */

/** Paths that belong to the app. A letter at `/admin` would be unreachable. */
export const RESERVED_SLUGS = new Set(['admin', 'api'])

export const MAX_SLUG_LENGTH = 80

/**
 * Lowercase, accents off, anything that is not a letter or digit becomes a
 * hyphen. `Carta pro João!` → `carta-pro-joao`.
 *
 * Truncated at a word boundary rather than mid-word, so a long title does not
 * end the URL in half a word.
 */
export function slugify(input: string, maxLength = 60): string {
  const base = input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (base.length <= maxLength) return base

  const cut = base.slice(0, maxLength)
  const lastHyphen = cut.lastIndexOf('-')
  return (lastHyphen > maxLength / 2 ? cut.slice(0, lastHyphen) : cut).replace(
    /-+$/,
    '',
  )
}

/**
 * The day, as `YYYY-MM-DD`, in UTC.
 *
 * UTC because it is computed on the server and has to agree with itself: a
 * letter started late at night in Brazil carries the next day's date. That
 * is a smaller surprise than a slug that depends on which region the function
 * happened to run in.
 */
export function slugDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** The slug a letter gets when I do not give it one. */
export function slugFromTitle(title: string, createdAt: Date): string {
  const words = slugify(title) || 'letter'
  return `${words}-${slugDate(createdAt)}`
}

/** `-2`, `-3`… for a generated slug that is already taken. */
export function withSuffix(slug: string, attempt: number): string {
  return attempt <= 1 ? slug : `${slug}-${attempt}`
}

export type SlugCheck = { ok: true; slug: string } | { ok: false; message: string }

/**
 * Check a slug I typed myself.
 *
 * It is slugified rather than rejected for having spaces or capitals — typing
 * `Carta pro João` should just work — and then refused only for the things
 * that would actually break.
 */
export function checkCustomSlug(input: string): SlugCheck {
  const slug = slugify(input, MAX_SLUG_LENGTH)

  if (slug === '') {
    return { ok: false, message: 'Use at least a few letters or numbers.' }
  }
  if (slug.length < 3) {
    return { ok: false, message: 'That is too short to be a link.' }
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { ok: false, message: `/${slug} is part of the site itself.` }
  }
  return { ok: true, slug }
}

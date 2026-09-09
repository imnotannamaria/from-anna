import { SLUG_PATTERN } from '../slug'

/**
 * What a letter is called on its own page.
 *
 * The three words of the slug, without the token: `AUTUMN · BUREAU · COVE`.
 *
 * Not a number. Numbering a letter tells its reader how many exist and where
 * theirs sits in the sequence, which is a fact about me and none of their
 * business. The slug words are already the letter's identity, they are not
 * sequential, and they tie the URL to the page for free — someone who has the
 * link is looking at the same three words at the top of it.
 *
 * Nothing from inside the letter goes here. The name has to be safe in a
 * fixed bar that is on screen the whole way down.
 */
export function letterName(slug: string): string[] {
  const parts = slug.split('-').filter(Boolean)

  // A slug this generator produced is three words plus a token, so the token
  // comes off. Anything else — a hand-made slug, an older one — keeps every
  // part rather than losing a word to a rule it was never built to follow.
  const words = SLUG_PATTERN.test(slug) ? parts.slice(0, -1) : parts

  return words.length > 0 ? words : [slug]
}

/** The same name as one string, for a `title` or an `aria-label`. */
export function letterNameText(slug: string): string {
  return letterName(slug).join(' · ')
}

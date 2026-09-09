import type { Letter } from '../db/schema'

/**
 * Whether a letter is readable by the public right now.
 *
 * Both halves matter and both are decisions from `share/DECISIONS.md`:
 * unpublishing takes a letter off the web immediately, and `expiresAt` does
 * the same on a timer. An expired letter behaves exactly like a draft.
 *
 * Compared in UTC on the server. Comparing against a client clock would make
 * expiry drift by timezone, which for a link meant to stop working is the
 * wrong direction to be wrong in.
 */
export function isPubliclyReadable(
  letter: Pick<Letter, 'status' | 'expiresAt'>,
  now: Date = new Date(),
): boolean {
  if (letter.status !== 'published') return false
  if (letter.expiresAt && letter.expiresAt.getTime() <= now.getTime()) {
    return false
  }
  return true
}

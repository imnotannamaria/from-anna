import { notFound } from 'next/navigation'

/**
 * Anything deeper than one segment. `[slug]` answers for one; this answers for
 * the rest, so every address that is not a page gets the same 404 page,
 * in the language it was asked in.
 */
export default function Missing() {
  notFound()
}

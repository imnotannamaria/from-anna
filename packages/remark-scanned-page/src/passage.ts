/**
 * Passages, and the region of the photograph each one came from.
 *
 * This is the "synchronised" half of a synchronised transcription: a passage
 * of text knows which band of the sheet it was written on, so a reader
 * following the words can be shown the corresponding handwriting.
 *
 * A region is optional. Marking one by hand is an upgrade per page, never a
 * tax on every letter — so a passage with no region falls back to a
 * proportional band, and the cheap version is the default.
 */

/** A horizontal band of the sheet, as fractions of its height from the top. */
export type Region = {
  top: number
  bottom: number
}

/**
 * The smallest band a fallback will produce.
 *
 * Without it, a sheet with ten passages would aim at a 10% sliver, and the
 * marker drawn beside the photo would read as a dot rather than a range.
 */
export const MIN_BAND = 0.12

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/**
 * Parse an `at="0.19 0.31"` attribute.
 *
 * The value arrives from markdown, and the markdown arrives from a vision
 * model, so nothing here trusts it. Anything that is not two finite numbers
 * inside 0–1, in order, returns `null` and the caller falls back to the band.
 * It degrades; it never throws, and it never reaches a `transform` unparsed.
 */
export function parseRegion(at: string | null | undefined): Region | null {
  if (typeof at !== 'string') return null

  const parts = at.trim().split(/[\s,]+/).filter(Boolean)
  if (parts.length !== 2) return null

  const top = Number(parts[0])
  const bottom = Number(parts[1])

  if (!Number.isFinite(top) || !Number.isFinite(bottom)) return null
  if (top < 0 || bottom > 1) return null
  // Inverted or empty. Silently swapping them would be guessing at intent.
  if (bottom <= top) return null

  return { top, bottom }
}

/**
 * The fallback: divide the sheet evenly and give this passage its share.
 *
 * It assumes the text runs down the page at a steady rate, which is close
 * enough to true for a letter and costs nothing to author.
 */
export function bandFor(index: number, total: number, minBand = MIN_BAND): Region {
  if (!Number.isInteger(total) || total < 1) return { top: 0, bottom: 1 }

  const i = Math.min(Math.max(index, 0), total - 1)
  const share = 1 / total

  let top = i * share
  let bottom = top + share

  // Grow a thin band around its own centre rather than from the top, so the
  // passage stays in the middle of what gets shown.
  if (bottom - top < minBand) {
    const centre = (top + bottom) / 2
    top = clamp01(centre - minBand / 2)
    bottom = clamp01(centre + minBand / 2)
  }

  return { top: clamp01(top), bottom: clamp01(bottom) }
}

/** The authored region if there is a usable one, the proportional band if not. */
export function regionFor(
  at: string | null | undefined,
  index: number,
  total: number,
): Region {
  return parseRegion(at) ?? bandFor(index, total)
}

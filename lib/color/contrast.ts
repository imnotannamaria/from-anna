/**
 * WCAG contrast maths.
 *
 * Used to prove the highlight palette is legible rather than assume it. The
 * measurement that matters here is text against the **highlight colour**, not
 * against the page background: a `<mark>` paints over the canvas, so the
 * canvas contrast says nothing about whether the highlighted words can be
 * read.
 *
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

export const AA_NORMAL = 4.5
export const AA_LARGE = 3

export type Rgb = { r: number; g: number; b: number }

export function hexToRgb(hex: string): Rgb {
  const cleaned = hex.trim().replace(/^#/, '')

  const full =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((char) => char + char)
          .join('')
      : cleaned

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new RangeError(`Not a hex colour: ${hex}`)
  }

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

/** sRGB relative luminance, 0 for black and 1 for white. */
export function relativeLuminance(colour: string | Rgb): number {
  const { r, g, b } = typeof colour === 'string' ? hexToRgb(colour) : colour

  const channel = (value: number) => {
    const srgb = value / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** Contrast ratio between two colours, from 1 to 21. Order does not matter. */
export function contrastRatio(a: string | Rgb, b: string | Rgb): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

export function meetsAA(
  foreground: string | Rgb,
  background: string | Rgb,
  threshold: number = AA_NORMAL,
): boolean {
  return contrastRatio(foreground, background) >= threshold
}

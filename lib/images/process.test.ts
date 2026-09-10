import { describe, expect, it } from 'vitest'

import { MAX_DIMENSION, SCREEN_DIMENSION, fitWithin, looksLikeHeic } from './process'

describe('fitWithin', () => {
  it('leaves an image already within the limit untouched', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('does not upscale', () => {
    const { width, height } = fitWithin(100, 50)
    expect(width).toBe(100)
    expect(height).toBe(50)
  })

  it('caps the longest side at the maximum', () => {
    // A portrait phone photo, which is the real case.
    const { width, height } = fitWithin(3024, 4032)
    expect(height).toBe(MAX_DIMENSION)
    expect(width).toBe(1800)
  })

  it('caps the longest side when the image is landscape', () => {
    const { width, height } = fitWithin(4032, 3024)
    expect(width).toBe(MAX_DIMENSION)
    expect(height).toBe(1800)
  })

  it('keeps the aspect ratio within a rounding error', () => {
    const before = 3024 / 4032
    const { width, height } = fitWithin(3024, 4032)
    expect(width / height).toBeCloseTo(before, 2)
  })

  it('never rounds a side down to zero', () => {
    // A very long, thin scan: naive rounding gives height 0, and a
    // zero-height canvas throws.
    const { width, height } = fitWithin(20000, 5)
    expect(width).toBe(MAX_DIMENSION)
    expect(height).toBe(1)
  })

  it('handles an exactly-at-the-limit image without scaling', () => {
    expect(fitWithin(MAX_DIMENSION, 900)).toEqual({
      width: MAX_DIMENSION,
      height: 900,
    })
  })

  it('produces a genuinely smaller second output for narrow screens', () => {
    // If these ever meet, the srcset stops offering a choice and a phone is
    // back to downloading the sheet a desktop zooms into.
    expect(SCREEN_DIMENSION).toBeLessThan(MAX_DIMENSION)

    const full = fitWithin(3024, 4032, MAX_DIMENSION)
    const screen = fitWithin(3024, 4032, SCREEN_DIMENSION)
    expect(screen.width).toBeLessThan(full.width)
    expect(screen.width / screen.height).toBeCloseTo(full.width / full.height, 2)
  })

  it('rejects impossible dimensions rather than producing a broken canvas', () => {
    expect(() => fitWithin(0, 100)).toThrow(RangeError)
    expect(() => fitWithin(-10, 100)).toThrow(RangeError)
    expect(() => fitWithin(Number.NaN, 100)).toThrow(RangeError)
  })
})

describe('looksLikeHeic', () => {
  it('recognises the type Safari reports', () => {
    expect(looksLikeHeic({ name: 'IMG_6110.HEIC', type: 'image/heic' })).toBe(true)
    expect(looksLikeHeic({ name: 'x', type: 'image/heif' })).toBe(true)
  })

  it('recognises the extension when the browser reports no type at all', () => {
    // Desktop Chrome hands over an iPhone HEIC with `type: ''`.
    expect(looksLikeHeic({ name: 'IMG_6110.HEIC', type: '' })).toBe(true)
    expect(looksLikeHeic({ name: 'page.heif', type: '' })).toBe(true)
  })

  it('leaves everything else alone, so a JPEG never loads the converter', () => {
    expect(looksLikeHeic({ name: 'page.jpg', type: 'image/jpeg' })).toBe(false)
    expect(looksLikeHeic({ name: 'heic-notes.png', type: 'image/png' })).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'

import { MAX_DIMENSION, fitWithin } from './process'

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
    expect(width).toBe(1125)
  })

  it('caps the longest side when the image is landscape', () => {
    const { width, height } = fitWithin(4032, 3024)
    expect(width).toBe(MAX_DIMENSION)
    expect(height).toBe(1125)
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

  it('rejects impossible dimensions rather than producing a broken canvas', () => {
    expect(() => fitWithin(0, 100)).toThrow(RangeError)
    expect(() => fitWithin(-10, 100)).toThrow(RangeError)
    expect(() => fitWithin(Number.NaN, 100)).toThrow(RangeError)
  })
})

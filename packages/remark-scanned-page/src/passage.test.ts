import { describe, expect, it } from 'vitest'

import { MIN_BAND, bandFor, parseRegion, regionFor } from './passage'

describe('parseRegion', () => {
  it('reads two fractions', () => {
    expect(parseRegion('0.19 0.31')).toEqual({ top: 0.19, bottom: 0.31 })
  })

  it('accepts a comma as the separator', () => {
    expect(parseRegion('0.2, 0.4')).toEqual({ top: 0.2, bottom: 0.4 })
  })

  it('refuses a single value', () => {
    expect(parseRegion('0.2')).toBeNull()
  })

  it('refuses values outside 0–1', () => {
    expect(parseRegion('-0.1 0.5')).toBeNull()
    expect(parseRegion('0.5 1.4')).toBeNull()
  })

  it('refuses an inverted or empty range rather than guessing', () => {
    expect(parseRegion('0.6 0.2')).toBeNull()
    expect(parseRegion('0.4 0.4')).toBeNull()
  })

  it('refuses anything that is not a number', () => {
    expect(parseRegion('top bottom')).toBeNull()
    expect(parseRegion('0.2 NaN')).toBeNull()
    expect(parseRegion('Infinity 1')).toBeNull()
  })

  it('refuses a missing attribute', () => {
    expect(parseRegion(undefined)).toBeNull()
    expect(parseRegion(null)).toBeNull()
    expect(parseRegion('')).toBeNull()
  })
})

describe('bandFor', () => {
  it('gives a single passage the whole sheet', () => {
    expect(bandFor(0, 1)).toEqual({ top: 0, bottom: 1 })
  })

  it('divides the sheet evenly', () => {
    expect(bandFor(1, 4)).toEqual({ top: 0.25, bottom: 0.5 })
  })

  it('never returns a band thinner than the minimum', () => {
    const band = bandFor(5, 10)
    expect(band.bottom - band.top).toBeCloseTo(MIN_BAND, 5)
    // Grown around its own centre, which stays where it was.
    expect((band.top + band.bottom) / 2).toBeCloseTo(0.55, 5)
  })

  it('stays inside the sheet at either end', () => {
    for (const i of [0, 19]) {
      const band = bandFor(i, 20)
      expect(band.top).toBeGreaterThanOrEqual(0)
      expect(band.bottom).toBeLessThanOrEqual(1)
    }
  })

  it('clamps an index outside the range instead of running off the sheet', () => {
    expect(bandFor(-3, 4)).toEqual(bandFor(0, 4))
    expect(bandFor(99, 4)).toEqual(bandFor(3, 4))
  })

  it('survives a nonsense total', () => {
    expect(bandFor(0, 0)).toEqual({ top: 0, bottom: 1 })
    expect(bandFor(0, 1.5)).toEqual({ top: 0, bottom: 1 })
  })
})

describe('regionFor', () => {
  it('prefers the authored region', () => {
    expect(regionFor('0.19 0.31', 1, 4)).toEqual({ top: 0.19, bottom: 0.31 })
  })

  it('falls back to the band when the region is unusable', () => {
    expect(regionFor('nonsense', 1, 4)).toEqual(bandFor(1, 4))
    expect(regionFor(undefined, 1, 4)).toEqual(bandFor(1, 4))
  })
})

import { describe, expect, it } from 'vitest'

import { contrastRatio, hexToRgb, meetsAA, relativeLuminance } from './contrast.js'

describe('hexToRgb', () => {
  it('parses a six-digit hex', () => {
    expect(hexToRgb('#7d2947')).toEqual({ r: 125, g: 41, b: 71 })
  })

  it('parses a three-digit hex', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('accepts a missing hash and stray whitespace', () => {
    expect(hexToRgb('  fafafa ')).toEqual({ r: 250, g: 250, b: 250 })
  })

  it('rejects anything else rather than guessing', () => {
    expect(() => hexToRgb('rebeccapurple')).toThrow(RangeError)
    expect(() => hexToRgb('#12345')).toThrow(RangeError)
  })
})

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 5)
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5)
  })
})

describe('contrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 2)
  })

  it('is 1 for a colour against itself', () => {
    expect(contrastRatio('#e85a8a', '#e85a8a')).toBeCloseTo(1, 5)
  })

  it('does not care about argument order', () => {
    expect(contrastRatio('#fafafa', '#7d2947')).toBeCloseTo(
      contrastRatio('#7d2947', '#fafafa'),
      5,
    )
  })

  it('matches a known WCAG value', () => {
    // #767676 on white is the canonical 4.54:1 example, the darkest grey
    // that still passes AA for normal text.
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 1)
  })
})

describe('meetsAA', () => {
  it('accepts a pair at the threshold', () => {
    expect(meetsAA('#767676', '#ffffff')).toBe(true)
  })

  it('rejects a pair just under it', () => {
    expect(meetsAA('#797979', '#ffffff')).toBe(false)
  })

  it('catches the failure this project exists to avoid', () => {
    // The user agent's black-on-mark default, in dark mode. This is the pair
    // `color: inherit` exists to prevent.
    expect(meetsAA('#000000', '#3d3a7a')).toBe(false)
  })
})

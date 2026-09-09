import { describe, expect, it } from 'vitest'

import { generateSlug } from '../slug'
import { letterName, letterNameText } from './name'

describe('letterName', () => {
  it('drops the token from a generated slug', () => {
    expect(letterName('autumn-bureau-cove-37a69x')).toEqual([
      'autumn',
      'bureau',
      'cove',
    ])
  })

  it('gives three words for anything the generator produces', () => {
    let seed = 0
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 2 ** 32
      return seed / 2 ** 32
    }

    for (let i = 0; i < 200; i++) {
      expect(letterName(generateSlug(random))).toHaveLength(3)
    }
  })

  it('keeps every part of a slug it does not recognise', () => {
    // A hand-made slug should lose its last word to a rule it never followed.
    expect(letterName('a-letter')).toEqual(['a', 'letter'])
  })

  it('never comes back empty', () => {
    expect(letterName('')).toEqual([''])
    expect(letterName('---')).toEqual(['---'])
  })

  it('joins with a middot for a label', () => {
    expect(letterNameText('autumn-bureau-cove-37a69x')).toBe(
      'autumn · bureau · cove',
    )
  })
})

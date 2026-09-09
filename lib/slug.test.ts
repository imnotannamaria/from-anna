import { describe, expect, it } from 'vitest'

import { SLUG_COMBINATIONS, SLUG_PATTERN, generateSlug } from './slug'

describe('generateSlug', () => {
  it('produces three lowercase words joined by hyphens', () => {
    expect(generateSlug()).toMatch(SLUG_PATTERN)
  })

  it('is url-safe: no spaces, uppercase or punctuation', () => {
    for (let i = 0; i < 200; i++) {
      const slug = generateSlug()
      expect(slug).toBe(encodeURIComponent(slug))
      expect(slug).toBe(slug.toLowerCase())
    }
  })

  it('offers enough combinations to make enumeration hopeless', () => {
    // Words alone are ~330k, which a script walks in an afternoon. The token
    // is what makes the slug unguessable, so this is the test that fails if
    // someone shortens it to make the URL prettier.
    expect(SLUG_COMBINATIONS).toBeGreaterThan(2 ** 45)
  })

  it('does not repeat within a large sample', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 2000; i++) seen.add(generateSlug())
    // At ~2^48 the chance of any collision here is about one in a hundred
    // million. A repeat means the random source is broken, not bad luck.
    expect(seen.size).toBe(2000)
  })

  it('stays in range at the extremes of the random source', () => {
    expect(generateSlug(() => 0)).toMatch(SLUG_PATTERN)
    // 0.9999… must not index past the end of a list.
    expect(generateSlug(() => 0.999999999)).toMatch(SLUG_PATTERN)
  })
})

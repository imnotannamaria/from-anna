import { describe, expect, it } from 'vitest'

import {
  checkCustomSlug,
  slugDate,
  slugFromTitle,
  slugify,
  withSuffix,
} from './slug'

describe('slugify', () => {
  it('lowercases, strips accents and hyphenates', () => {
    expect(slugify('Carta pro João!')).toBe('carta-pro-joao')
  })

  it('collapses runs of punctuation and trims the ends', () => {
    expect(slugify('  --Hello,   world!!  ')).toBe('hello-world')
  })

  it('is url-safe', () => {
    const slug = slugify('Ça va? Ñandú & Co. / 2026')
    expect(slug).toBe(encodeURIComponent(slug))
    expect(slug).toMatch(/^[a-z0-9-]+$/)
  })

  it('cuts a long title at a word boundary, not mid-word', () => {
    const slug = slugify('one two three four five six seven eight nine ten', 20)
    expect(slug.length).toBeLessThanOrEqual(20)
    expect(slug.endsWith('-')).toBe(false)
    expect('one two three four five six seven'.replace(/ /g, '-')).toContain(slug)
  })

  it('returns an empty string for a title with no letters or digits', () => {
    expect(slugify('!!! ???')).toBe('')
  })
})

describe('slugDate', () => {
  it('is the UTC day, as YYYY-MM-DD', () => {
    expect(slugDate(new Date('2026-09-10T12:00:00Z'))).toBe('2026-09-10')
  })

  it('does not drift with the local timezone', () => {
    // 23:30 in São Paulo is 02:30 the next day in UTC. The server answers in
    // UTC, and it has to agree with itself.
    expect(slugDate(new Date('2026-09-10T23:30:00-03:00'))).toBe('2026-09-11')
  })
})

describe('slugFromTitle', () => {
  it('is the title and the day', () => {
    expect(slugFromTitle('Carta pro João', new Date('2026-09-10T12:00:00Z'))).toBe(
      'carta-pro-joao-2026-09-10',
    )
  })

  it('falls back to "letter" when the title has nothing usable', () => {
    expect(slugFromTitle('???', new Date('2026-09-10T12:00:00Z'))).toBe(
      'letter-2026-09-10',
    )
  })
})

describe('withSuffix', () => {
  it('leaves the first attempt alone and numbers the rest', () => {
    expect(withSuffix('a-2026-09-10', 1)).toBe('a-2026-09-10')
    expect(withSuffix('a-2026-09-10', 2)).toBe('a-2026-09-10-2')
  })
})

describe('checkCustomSlug', () => {
  it('slugifies what I typed instead of refusing it', () => {
    expect(checkCustomSlug('Carta pro João')).toEqual({
      ok: true,
      slug: 'carta-pro-joao',
    })
  })

  it('refuses paths that belong to the app', () => {
    expect(checkCustomSlug('admin').ok).toBe(false)
    expect(checkCustomSlug('API').ok).toBe(false)
  })

  it('refuses something too short to be a link', () => {
    expect(checkCustomSlug('ab').ok).toBe(false)
  })

  it('refuses input with nothing usable in it', () => {
    expect(checkCustomSlug('!!!').ok).toBe(false)
  })
})

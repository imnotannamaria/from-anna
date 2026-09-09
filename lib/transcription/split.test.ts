import { describe, expect, it } from 'vitest'

import { joinPages, splitBlocks, splitTranscription } from './split'

describe('splitBlocks', () => {
  it('splits on separator lines', () => {
    expect(splitBlocks('one\n---\ntwo\n---\nthree')).toEqual([
      'one',
      'two',
      'three',
    ])
  })

  it('keeps paragraph breaks inside a block', () => {
    expect(splitBlocks('first para\n\nsecond para\n---\nnext page')).toEqual([
      'first para\n\nsecond para',
      'next page',
    ])
  })

  it('ignores a leading and trailing separator', () => {
    expect(splitBlocks('---\none\n---\ntwo\n---\n')).toEqual(['one', 'two'])
  })

  it('accepts more than three dashes and trailing spaces', () => {
    expect(splitBlocks('one\n----  \ntwo')).toEqual(['one', 'two'])
  })

  it('handles Windows line endings', () => {
    expect(splitBlocks('one\r\n---\r\ntwo')).toEqual(['one', 'two'])
  })

  it('does not split on a dash line that has other text on it', () => {
    expect(splitBlocks('a --- b')).toEqual(['a --- b'])
  })

  it('keeps an empty block between two pages', () => {
    // The model returned nothing for the middle page. That has to surface as
    // a mismatch, not be silently tidied away.
    expect(splitBlocks('one\n---\n\n---\nthree')).toEqual(['one', '', 'three'])
  })
})

describe('splitTranscription', () => {
  it('returns one block per page when the counts agree', () => {
    const result = splitTranscription('page one\n---\npage two', 2)
    expect(result).toEqual({ status: 'ok', pages: ['page one', 'page two'] })
  })

  it('reports a mismatch when the model ignored the separator', () => {
    const result = splitTranscription('everything in one lump', 3)
    expect(result.status).toBe('mismatch')
    if (result.status !== 'mismatch') throw new Error('expected a mismatch')
    expect(result.expected).toBe(3)
    expect(result.found).toBe(1)
    expect(result.whole).toBe('everything in one lump')
  })

  it('reports a mismatch when the letter itself contains a --- line', () => {
    // The over-split case. Two photographed pages, but the letter has a rule
    // in it, so the response splits into three.
    const response = 'page one\n---\nstill page one\n---\npage two'
    const result = splitTranscription(response, 2)
    expect(result.status).toBe('mismatch')
    if (result.status !== 'mismatch') throw new Error('expected a mismatch')
    expect(result.found).toBe(3)
    // Nothing is thrown away: the whole response is kept for page one's raw.
    expect(result.whole).toContain('page one')
    expect(result.whole).toContain('page two')
  })

  it('keeps the full text on a mismatch, separators and all', () => {
    const response = 'a\n---\nb\n---\nc'
    const result = splitTranscription(response, 2)
    if (result.status !== 'mismatch') throw new Error('expected a mismatch')
    expect(result.whole).toBe(response)
  })

  it('handles a single-page letter', () => {
    expect(splitTranscription('just the one page', 1)).toEqual({
      status: 'ok',
      pages: ['just the one page'],
    })
  })

  it('preserves the illegible marker untouched', () => {
    const result = splitTranscription('I went to the [?] yesterday', 1)
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.pages[0]).toBe('I went to the [?] yesterday')
  })

  it('rejects a nonsense page count', () => {
    expect(() => splitTranscription('x', 0)).toThrow(RangeError)
    expect(() => splitTranscription('x', 1.5)).toThrow(RangeError)
  })
})

describe('joinPages', () => {
  it('joins with the separator the prompt asks for', () => {
    expect(joinPages(['one', 'two'])).toBe('one\n\n---\n\ntwo')
  })

  it('round-trips with splitTranscription', () => {
    const pages = ['first page\n\nwith two paragraphs', 'second page']
    const result = splitTranscription(joinPages(pages), 2)
    expect(result).toEqual({ status: 'ok', pages })
  })
})

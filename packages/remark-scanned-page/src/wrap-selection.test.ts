import { describe, expect, it } from 'vitest'

import { wrapSelection } from './wrap-selection'

describe('wrapSelection', () => {
  it('wraps a selection in the directive', () => {
    const text = 'this is worth reading here'
    const result = wrapSelection(text, 8, 21, 'important')

    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.value).toBe('this is :mark[worth reading]{c=important} here')
  })

  it('keeps the wrapped words selected', () => {
    const text = 'aaa bbb ccc'
    const result = wrapSelection(text, 4, 7, 'note')

    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.value.slice(result.selectionStart, result.selectionEnd)).toBe(
      'bbb',
    )
  })

  it('inserts an empty directive when nothing is selected', () => {
    const result = wrapSelection('abc', 3, 3, 'ask')

    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.value).toBe('abc:mark[]{c=ask}')
    // The caret sits between the brackets, ready to type.
    expect(result.selectionStart).toBe(result.selectionEnd)
    expect(result.value.slice(result.selectionStart, result.selectionStart + 1)).toBe(
      ']',
    )
  })

  it('handles a backwards selection', () => {
    // Dragging right to left gives selectionStart > selectionEnd.
    const forwards = wrapSelection('aaa bbb ccc', 4, 7, 'note')
    const backwards = wrapSelection('aaa bbb ccc', 7, 4, 'note')
    expect(backwards).toEqual(forwards)
  })

  it('clamps a selection that runs past the end', () => {
    const result = wrapSelection('abc', 0, 99, 'note')
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.value).toBe(':mark[abc]{c=note}')
  })

  it('refuses to nest one highlight inside another', () => {
    // Nesting does not parse into anything sensible, and quietly producing
    // broken markdown is worse than saying no.
    const text = 'a :mark[already]{c=note} b'
    const result = wrapSelection(text, 0, text.length, 'important')

    expect(result.status).toBe('refused')
    if (result.status !== 'refused') return
    expect(result.reason).toBe('nested')
  })

  it('allows wrapping text that merely sits next to a highlight', () => {
    const text = 'before :mark[x]{c=note} after'
    const result = wrapSelection(text, 0, 6, 'ask')
    expect(result.status).toBe('ok')
  })

  it('wraps at the very start of the document', () => {
    const result = wrapSelection('hello world', 0, 5, 'important')
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.value).toBe(':mark[hello]{c=important} world')
  })

  it('produces markdown the renderer accepts', () => {
    const result = wrapSelection('some words here', 5, 10, 'note')
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.value).toContain(':mark[words]{c=note}')
  })
})

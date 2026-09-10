import { describe, expect, it } from 'vitest'

import { renderMarkdown } from './render.js'
import { wrapPassage, wrapSelection, wrapTheme } from './wrap-selection.js'

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

describe('wrapPassage', () => {
  it('wraps the selected lines', () => {
    const result = wrapPassage('One.\nTwo.\nThree.', 5, 9)
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.value).toBe('One.\n:::passage\nTwo.\n:::\nThree.')
  })

  it('expands a part-line selection to whole lines', () => {
    // A container directive on half a line parses into something else.
    const result = wrapPassage('One two three.', 4, 7)
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.value).toBe(':::passage\nOne two three.\n:::')
  })

  it('leaves the words selected inside the wrapper', () => {
    const result = wrapPassage('One.\nTwo.\nThree.', 5, 9)
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(
      result.value.slice(result.selectionStart, result.selectionEnd),
    ).toBe('Two.')
  })

  it('refuses to nest', () => {
    const source = ':::passage\nInside.\n:::'
    const result = wrapPassage(source, 0, source.length)
    expect(result.status).toBe('refused')
  })

  it('refuses an empty selection rather than wrapping nothing', () => {
    expect(wrapPassage('One.\n\nTwo.', 5, 5).status).toBe('refused')
  })

  it('keeps a highlight inside intact', () => {
    const result = wrapPassage('A :mark[bit]{c=note} of it.', 0, 27)
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.value).toContain(':mark[bit]{c=note}')
  })
})

describe('wrapTheme', () => {
  it('wraps the paragraph, with the caret between the quotes', () => {
    const result = wrapTheme('One.\n\nTwo.\n\nThree.', 6, 10)
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.value).toBe('One.\n\n:::theme{label=""}\nTwo.\n:::\n\nThree.')
    expect(result.selectionStart).toBe(result.selectionEnd)
    expect(result.value.slice(0, result.selectionStart)).toMatch(/:::theme\{label="$/)
  })

  it('selects a given label, so typing replaces it', () => {
    const result = wrapTheme('One.', 0, 0, 'a name')
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.value.slice(result.selectionStart, result.selectionEnd)).toBe('a name')
  })

  it('keeps a quote in the label from ending the attribute early', () => {
    const result = wrapTheme('One.', 0, 0, 'say "hi"')
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.value).toContain(`label="say 'hi'"`)
  })

  it('renders as the bracket', () => {
    const result = wrapTheme('One.', 0, 0, 'why')
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(renderMarkdown(result.value)).toContain('<aside data-theme-label="why"')
  })

  it('groups several paragraphs', () => {
    const source = 'One.\n\nTwo.'
    const result = wrapTheme(source, 0, source.length)
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.value).toBe(':::theme{label=""}\nOne.\n\nTwo.\n:::')
  })

  it('can take a whole passage inside it', () => {
    const source = ':::passage\nIn.\n:::'
    expect(wrapTheme(source, 0, source.length).status).toBe('ok')
  })

  it('refuses a theme inside a theme', () => {
    const source = ':::theme{label="a"}\nIn.\n:::'
    const result = wrapTheme(source, 0, source.length)
    expect(result.status === 'refused' && result.reason).toBe('nested')
  })

  it('refuses when the cursor is already inside a theme', () => {
    const source = ':::theme{label="a"}\nIn.\n:::'
    const at = source.indexOf('In.')
    const result = wrapTheme(source, at, at)
    expect(result.status === 'refused' && result.reason).toBe('nested')
  })

  it('refuses when the cursor is inside a theme, blank lines and all', () => {
    const source = ':::theme{label="a"}\n\nIn.\n\n:::'
    const at = source.indexOf('In.')
    const result = wrapTheme(source, at, at)
    expect(result.status === 'refused' && result.reason).toBe('nested')
  })

  it('allows a paragraph after a theme that has closed', () => {
    const source = ':::theme{label="a"}\nIn.\n:::\n\nAfter.'
    const at = source.indexOf('After.')
    const result = wrapTheme(source, at, at)
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.value).toBe(
      ':::theme{label="a"}\nIn.\n:::\n\n:::theme{label=""}\nAfter.\n:::',
    )
  })

  it('refuses a selection that takes half of another block', () => {
    const source = ':::passage\nIn.\n\nMore.\n:::\n\nAfter.'
    const result = wrapTheme(source, source.indexOf('More.'), source.length)
    expect(result.status === 'refused' && result.reason).toBe('partial')
  })

  it('takes the whole paragraph from a caret on any line of it', () => {
    const source = 'Before.\n\nFirst line\nsecond line\n\nAfter.'
    const at = source.indexOf('second')
    const result = wrapTheme(source, at, at)
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.value).toBe(
      'Before.\n\n:::theme{label=""}\nFirst line\nsecond line\n:::\n\nAfter.',
    )
  })

  it('never cuts a highlight that runs over two lines', () => {
    // The case that found this: a `]{c=…}` on the line after its words.
    const source = 'Hi.\n\n:mark[WEB - IA - MOBILE\n]{c=important}\n\nBye.'
    const at = source.indexOf('WEB')
    const result = wrapTheme(source, at, at, 'what I do')
    if (result.status !== 'ok') throw new Error('expected ok')
    const html = renderMarkdown(result.value)
    expect(html).toContain('<aside data-theme-label="what I do"')
    expect(html).toContain('<mark data-c="important">WEB - IA - MOBILE')
    expect(html).not.toContain(':mark[')
  })

  it('refuses an empty selection rather than wrapping nothing', () => {
    const result = wrapTheme('One.\n\nTwo.', 5, 5)
    expect(result.status === 'refused' && result.reason).toBe('empty')
  })
})

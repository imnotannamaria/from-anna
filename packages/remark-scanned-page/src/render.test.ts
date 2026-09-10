import { describe, expect, it, vi } from 'vitest'

import { renderMarkdown } from './render'

describe('highlights', () => {
  it('turns :mark into a mark carrying its tag', () => {
    const html = renderMarkdown('This is :mark[worth reading]{c=important} now.')
    expect(html).toContain('<mark data-c="important">worth reading</mark>')
  })

  it('keeps the surrounding sentence intact', () => {
    const html = renderMarkdown('before :mark[middle]{c=note} after')
    expect(html).toContain('before <mark')
    expect(html).toContain('</mark> after')
  })

  it('falls back to a default tag when none is given', () => {
    const html = renderMarkdown(':mark[no tag here]')
    expect(html).toContain('data-c="unknown"')
  })

  it('reports an unknown tag without breaking the render', () => {
    const onUnknownTag = vi.fn()
    const html = renderMarkdown(':mark[x]{c=invented}', {
      knownTags: ['important', 'note', 'ask'],
      onUnknownTag,
    })
    // A typo mid-letter must not be a build failure.
    expect(onUnknownTag).toHaveBeenCalledWith('invented')
    expect(html).toContain('<mark data-c="invented">x</mark>')
  })

  it('does not report a known tag', () => {
    const onUnknownTag = vi.fn()
    renderMarkdown(':mark[x]{c=note}', {
      knownTags: ['important', 'note', 'ask'],
      onUnknownTag,
    })
    expect(onUnknownTag).not.toHaveBeenCalled()
  })

  it('shows a labelless :mark as text instead of an invisible empty mark', () => {
    // `:mark` alone is valid directive syntax, so it would otherwise render
    // as <mark></mark>: in the DOM, invisible on screen, and a typo nobody
    // would ever catch. The preview has to show it.
    const html = renderMarkdown('this :mark is not a highlight')
    expect(html).not.toContain('<mark')
    expect(html).toContain(':mark is not a highlight')
  })

  it('still highlights a mark that has a label but no tag', () => {
    const html = renderMarkdown('this :mark[has text] though')
    expect(html).toContain('<mark data-c="unknown">has text</mark>')
  })
})

describe('themed blocks', () => {
  it('turns :::theme into an aside carrying the label', () => {
    const html = renderMarkdown(':::theme{label="what I built"}\ninside\n:::')
    expect(html).toContain('<aside')
    expect(html).toContain('data-theme-label="what I built"')
    expect(html).toContain('inside')
  })

  it('labels the aside for screen readers', () => {
    // The written label is the accessible half of the side bracket, so it
    // has to reach assistive tech and not only the stylesheet.
    const html = renderMarkdown(':::theme{label="quality time"}\nx\n:::')
    expect(html).toContain('aria-label="quality time"')
  })

  it('allows a highlight inside a themed block', () => {
    const html = renderMarkdown(
      ':::theme{label="t"}\nsome :mark[text]{c=note} here\n:::',
    )
    expect(html).toContain('<aside')
    expect(html).toContain('<mark data-c="note">text</mark>')
  })

  it('unwraps a nested theme instead of rendering two brackets', () => {
    const html = renderMarkdown(
      ':::theme{label="outer"}\n::::theme{label="inner"}\nkept\n::::\n:::',
    )
    expect(html.match(/<aside/g) ?? []).toHaveLength(1)
    // Unwrapping drops the second bracket but never the words.
    expect(html).toContain('kept')
  })
})

describe('sanitizing', () => {
  it('strips a script tag', () => {
    const html = renderMarkdown('hi\n\n<script>alert(1)</script>')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('alert(1)')
  })

  it('strips an inline event handler', () => {
    const html = renderMarkdown('<div onclick="steal()">x</div>')
    expect(html).not.toContain('onclick')
  })

  it('strips an iframe', () => {
    const html = renderMarkdown('<iframe src="https://evil.example"></iframe>')
    expect(html).not.toContain('<iframe')
  })

  it('drops a javascript: link but keeps its text', () => {
    const html = renderMarkdown('[click](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
    expect(html).toContain('click')
  })

  it('keeps an https link', () => {
    const html = renderMarkdown('[docs](https://example.com)')
    expect(html).toContain('href="https://example.com"')
  })

  it('drops an http image source', () => {
    // Mixed content on a page that is otherwise https.
    const html = renderMarkdown('![x](http://example.com/a.png)')
    expect(html).not.toContain('http://example.com/a.png')
  })

  it('keeps ordinary markdown working', () => {
    const html = renderMarkdown('# Title\n\n- one\n- two\n\n**bold**')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<li>one</li>')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('survives model output that is entirely untrusted', () => {
    // The transcription is produced by a model reading a photograph. It is
    // data, never markup we vouch for.
    const html = renderMarkdown(
      'Dear friend <img src=x onerror=alert(1)> and [?] more',
    )
    expect(html).not.toContain('onerror')
    expect(html).toContain('[?]')
  })
})

describe(':::passage', () => {
  it('renders a bare div grouping the paragraphs', () => {
    const html = renderMarkdown(':::passage\nText.\n\nMore.\n:::')
    expect(html).toContain('<div>')
    expect(html).toContain('<p>Text.</p>')
    expect(html).toContain('<p>More.</p>')
  })

  it('carries no attributes, which is why the div is safe to allow', () => {
    const html = renderMarkdown(':::passage{at="0.2 0.4" onclick="x"}\nText.\n:::')
    expect(html).toContain('<div>')
    expect(html).not.toContain('at=')
    expect(html).not.toContain('onclick')
  })

  it('holds highlights and themed blocks', () => {
    const html = renderMarkdown(
      ':::passage\nA :mark[phrase]{c=note} of it.\n:::',
    )
    expect(html).toContain('<mark data-c="note">phrase</mark>')
  })

  it('unwraps a passage nested inside a passage', () => {
    const html = renderMarkdown(
      ':::::passage\n\n::::passage\nInner.\n::::\n\n:::::',
    )
    expect(html.match(/<div/g) ?? []).toHaveLength(1)
    expect(html).toContain('Inner.')
  })

  it('unwraps a passage nested inside a theme, and keeps the words', () => {
    const html = renderMarkdown(
      '::::theme{label="a name"}\n\n:::passage\nInner.\n:::\n\n::::',
    )
    expect(html).toContain('<aside')
    expect(html).not.toContain('<div>')
    expect(html).toContain('Inner.')
  })

  it('still allows a theme inside a passage, which is the normal case', () => {
    const html = renderMarkdown(
      '::::passage\n\n:::theme{label="a name"}\nInner.\n:::\n\n::::',
    )
    expect(html).toContain('<div>')
    expect(html).toContain('<aside')
  })

  it('does not let a div through from the source markdown', () => {
    // The div in the schema is only ever the one this plugin emits: raw HTML
    // in the source is dropped before sanitizing ever sees it.
    const html = renderMarkdown('<div class="smuggled">text</div>')
    expect(html).not.toContain('<div')
  })
})

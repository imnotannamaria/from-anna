import { describe, expect, it } from 'vitest'
import { renderEditorMarkdown, renderMarkdown } from './render.js'
import { changeHighlight } from './edit-highlight.js'
import { wrapSelection } from './wrap-selection.js'

describe('source-aware editing', () => {
  it('distinguishes repeated words by exact source offsets', () => {
    const html = renderEditorMarkdown('same\n\nsame')
    expect(html).toContain('data-source-start="0" data-source-end="4">same')
    expect(html).toContain('data-source-start="6" data-source-end="10">same')
    expect(renderMarkdown('same')).not.toContain('data-source')
  })
  it('never guesses offsets for decoded entities or code', () => {
    expect(renderEditorMarkdown('a &amp; b')).not.toContain('data-source-start')
    expect(renderEditorMarkdown('`code`')).not.toContain('data-source-start')
  })
  it('keeps sanitization in the editor', () => {
    const html = renderEditorMarkdown(
      '<script>alert(1)</script>\n\n[x](javascript:alert(1))',
    )
    expect(html).not.toContain('<script')
    expect(html).not.toContain('javascript:')
  })
  it('maps and recolours a highlight while preserving emphasis and surrounding text', () => {
    const directive = ':mark[very **important** words]{c=note}'
    const source = 'before ' + directive + ' after'
    expect(renderEditorMarkdown(source)).toContain('data-mark-start="7"')
    expect(changeHighlight(source, 7, 7 + directive.length, 'ask')).toBe(
      'before :mark[very **important** words]{c=ask} after',
    )
    expect(changeHighlight(source, 7, 7 + directive.length, null)).toBe(
      'before very **important** words after',
    )
  })
  it('rejects stale boundaries, injected tags and nested marks', () => {
    const source = ':mark[words]{c=note}'
    expect(changeHighlight(source, 1, source.length, null)).toBeNull()
    expect(
      changeHighlight(source, 0, source.length, 'bad} <script>'),
    ).toBeNull()
    expect(wrapSelection(source, 6, 11, 'ask').status).toBe('refused')
  })
})

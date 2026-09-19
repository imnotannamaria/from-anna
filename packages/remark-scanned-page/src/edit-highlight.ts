import remarkDirective from 'remark-directive'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

/** Editing boundaries use the same directive grammar as rendering. */
export function highlightRanges(value: string) {
  const tree = unified().use(remarkParse).use(remarkDirective).parse(value)
  const ranges: {
    start: number
    end: number
    contentStart: number
    contentEnd: number
  }[] = []
  visit(tree, 'textDirective', (node) => {
    if (node.name !== 'mark') return
    const start = node.position?.start.offset
    const end = node.position?.end.offset
    const first = node.children[0]?.position?.start.offset
    const last = node.children.at(-1)?.position?.end.offset
    if (
      start !== undefined &&
      end !== undefined &&
      first !== undefined &&
      last !== undefined
    )
      ranges.push({ start, end, contentStart: first, contentEnd: last })
  })
  return ranges
}

export function changeHighlight(
  value: string,
  start: number,
  end: number,
  tag: string | null,
): string | null {
  const mark = highlightRanges(value).find(
    (range) => range.start === start && range.end === end,
  )
  if (!mark || (tag !== null && !/^[\w-]+$/.test(tag))) return null
  const content = value.slice(mark.contentStart, mark.contentEnd)
  return (
    value.slice(0, start) +
    (tag === null ? content : `:mark[${content}]{c=${tag}}`) +
    value.slice(end)
  )
}

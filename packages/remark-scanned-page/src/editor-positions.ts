import type { Element, Root, RootContent } from 'hast'

/** Only generated numeric positions are added after the unchanged sanitizer. */
export function editorPositions(markdown: string) {
  return (tree: Root) => {
    function walk(parent: Root | Element, protectedText = false) {
      parent.children = parent.children.map((node): RootContent => {
        const start = node.position?.start.offset
        const end = node.position?.end.offset
        if (
          node.type === 'text' &&
          !protectedText &&
          start !== undefined &&
          end !== undefined &&
          markdown.slice(start, end) === node.value
        ) {
          return {
            type: 'element',
            tagName: 'span',
            properties: { dataSourceStart: start, dataSourceEnd: end },
            children: [node],
          }
        }
        if (node.type === 'element') {
          if (
            node.tagName === 'mark' &&
            start !== undefined &&
            end !== undefined
          ) {
            node.properties.dataMarkStart = start
            node.properties.dataMarkEnd = end
          }
          walk(
            node,
            protectedText || node.tagName === 'code' || node.tagName === 'pre',
          )
        }
        return node
      }) as typeof parent.children
    }
    walk(tree)
  }
}

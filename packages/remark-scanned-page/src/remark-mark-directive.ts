import type { Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

/**
 * `:mark[text]{c=important}`      → `<mark data-c="important">`
 * `:::theme{label="..."}`         → `<aside>` carrying the label
 * `:::passage{at="0.19 0.31"}`    → `<div data-passage-at="0.19 0.31">`
 *
 * Highlights live inside the markdown rather than as offsets in a database,
 * because a transcription of handwriting exists to be corrected, and fixing a
 * comma would shift every offset after it. Inside the markdown the file
 * carries everything: no join, no sync, still readable and diffable.
 */

export const MARK_NAME = 'mark'
export const THEME_NAME = 'theme'

/**
 * Groups a run of paragraphs and says which band of the sheet they were
 * written on. The region is what makes the transcription *synchronised*
 * rather than merely adjacent, and it is optional: a passage with no `at`
 * falls back to a proportional band, so marking one is an upgrade per page
 * rather than a tax on every letter.
 *
 * The value is never trusted. `parseRegion` in ./passage is the only thing
 * that reads it, and anything it cannot use degrades to the band.
 */
export const PASSAGE_NAME = 'passage'

/** Applied when a highlight has no tag, or a tag nothing recognises. */
export const DEFAULT_TAG = 'unknown'

type DirectiveNode = {
  type: 'textDirective' | 'leafDirective' | 'containerDirective'
  name: string
  attributes?: Record<string, string | null | undefined> | null
  data?: {
    hName?: string
    hProperties?: Record<string, unknown>
  }
  children?: unknown[]
}

export type RemarkMarkDirectiveOptions = {
  /**
   * Tags the consuming project has styling for. Leave undefined to accept
   * anything — the package itself defines no vocabulary, only the mechanism.
   */
  knownTags?: readonly string[]
  /** Called for a tag that isn't in `knownTags`. */
  onUnknownTag?: (tag: string) => void
}

/**
 * A nested `:::theme` is dropped back to a plain block rather than rendered.
 *
 * A bracket inside a bracket cannot be drawn cleanly, and silently rendering
 * one would produce a layout nobody designed. Unwrapping keeps the words.
 */
function isInsideTheme(ancestors: readonly unknown[]): boolean {
  return ancestors.some(
    (ancestor) =>
      (ancestor as DirectiveNode)?.type === 'containerDirective' &&
      (ancestor as DirectiveNode)?.name === THEME_NAME,
  )
}

export const remarkMarkDirective: Plugin<[RemarkMarkDirectiveOptions?], Root> = (
  options = {},
) => {
  const { knownTags, onUnknownTag } = options

  return (tree) => {
    visit(tree, (node) => {
      const directive = node as unknown as DirectiveNode

      if (directive.type === 'textDirective' && directive.name === MARK_NAME) {
        // `:mark` with no label is valid directive syntax, and converting it
        // would emit an empty <mark> — present in the DOM, invisible on
        // screen, so a typo would never be noticed. Turn it back into the
        // text that was typed, which is what the preview is for.
        if (!directive.children || directive.children.length === 0) {
          const asText = node as unknown as {
            type: string
            value: string
            data?: unknown
          }
          asText.type = 'text'
          asText.value = `:${MARK_NAME}`
          delete asText.data
          return
        }

        const tag = directive.attributes?.c?.trim() || DEFAULT_TAG

        if (knownTags && !knownTags.includes(tag)) {
          onUnknownTag?.(tag)
        }

        directive.data = {
          ...directive.data,
          hName: 'mark',
          // camelCase, not 'data-c'. These are hast property names, and
          // `rehype-sanitize` matches the schema against them — a dashed key
          // is silently stripped. The stringifier renders both spellings
          // identically, so the bug only shows up after sanitizing.
          hProperties: { dataC: tag },
        }
        return
      }

      if (
        directive.type === 'containerDirective' &&
        directive.name === PASSAGE_NAME
      ) {
        const at = directive.attributes?.at?.trim() || undefined

        directive.data = {
          ...directive.data,
          hName: 'div',
          // A plain div carrying one data attribute. It is a grouping and a
          // number, with no behaviour and no URL in it — see the note on
          // `div` in the sanitize schema.
          hProperties: { dataPassageAt: at },
        }
        return
      }

      if (
        directive.type === 'containerDirective' &&
        directive.name === THEME_NAME
      ) {
        const label = directive.attributes?.label?.trim() || ''

        directive.data = {
          ...directive.data,
          hName: 'aside',
          hProperties: {
            dataThemeLabel: label,
            // The label is the accessible half of the side bracket: it is what
            // carries the grouping for anyone who cannot see the colour.
            ariaLabel: label || undefined,
          },
        }
      }
    })

    // Second pass for nesting, so the ancestor chain is already decided.
    //
    // A bracket inside a bracket cannot be drawn cleanly, and a passage
    // inside another passage would give one run of text two gutter numbers
    // and two regions. Both unwrap rather than render: the second wrapper
    // goes, the words stay.
    const unwrapInside: Record<string, readonly string[]> = {
      [THEME_NAME]: [THEME_NAME],
      [PASSAGE_NAME]: [PASSAGE_NAME, THEME_NAME],
    }

    visit(tree, (node, index, parent) => {
      const directive = node as unknown as DirectiveNode
      if (
        directive.type !== 'containerDirective' ||
        parent === undefined ||
        index === undefined
      ) {
        return
      }

      const forbidden = unwrapInside[directive.name]
      if (!forbidden) return

      const parentNode = parent as unknown as DirectiveNode
      if (
        parentNode.type === 'containerDirective' &&
        forbidden.includes(parentNode.name)
      ) {
        // Unwrap: keep the children, drop the second wrapper.
        const children = (directive.children ?? []) as never[]
        ;(parent as unknown as { children: unknown[] }).children.splice(
          index,
          1,
          ...children,
        )
        return index
      }
    })
  }
}

export { isInsideTheme }

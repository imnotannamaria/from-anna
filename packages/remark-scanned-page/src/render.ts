import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkDirective from 'remark-directive'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

import {
  type RemarkMarkDirectiveOptions,
  remarkMarkDirective,
} from './remark-mark-directive.js'

/**
 * The sanitize schema.
 *
 * This is the phase where a mistake is exploitable. The markdown is mine
 * today, but two things are not: the transcription is model output, and the
 * package will run on content its author did not write.
 *
 * Protocols are restricted as well as tag names — allowing `<a>` while
 * allowing `javascript:` in its href would be allowing script execution with
 * extra steps.
 */
export const schema = {
  ...defaultSchema,
  tagNames: [
    'p',
    'br',
    'hr',
    'em',
    'strong',
    'del',
    'blockquote',
    'code',
    'pre',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'a',
    'img',
    'mark',
    'aside',
    // Only ever ours, and bare. `remark-rehype` drops raw HTML from the
    // source unless `allowDangerousHtml` is set, which it is not, so the only
    // <div> that reaches here is the one `:::passage` emits — and the schema
    // allows no attribute on it at all.
    'div',
  ],
  attributes: {
    ...defaultSchema.attributes,
    // hast property names, which are camelCase. A dashed spelling here
    // matches nothing and the attribute is stripped without a word.
    mark: ['dataC'],
    aside: ['dataThemeLabel', 'ariaLabel'],
    div: [],
    a: ['href', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ['https', 'mailto'],
    src: ['https'],
  },
}

export function renderMarkdown(
  markdown: string,
  options: RemarkMarkDirectiveOptions = {},
): string {
  return unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkMarkDirective, options)
    .use(remarkRehype)
    .use(rehypeSanitize, schema)
    .use(rehypeStringify)
    .processSync(markdown)
    .toString()
}

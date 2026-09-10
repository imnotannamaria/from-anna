/**
 * Splitting one transcription response back into per-page blocks.
 *
 * Every page goes to the model in a single call, because that is fewer round
 * trips and lets the model see words broken across a page turn. But
 * `rawTranscription` is stored per page, so the response has to stay
 * separable — which is why the prompt requires a `---` line between pages.
 *
 * It is the same separator the reading view paginates on, so the two features
 * agree on one format.
 */

/** A separator line: three or more dashes, alone on the line. */
const SEPARATOR_LINE = /^[ \t]*-{3,}[ \t]*$/

export const PAGE_SEPARATOR = '---'

export type SplitResult =
  | { status: 'ok'; pages: string[] }
  /**
   * The block count disagreed with the page count. The caller writes `whole`
   * into the first page's raw and warns: losing the split is recoverable,
   * losing the transcription is not.
   *
   * The usual cause is a letter that contains a `---` line of its own, which
   * over-splits. The other is a model that ignored the separator entirely.
   */
  | { status: 'mismatch'; expected: number; found: number; whole: string }

function normalise(text: string): string {
  // Windows line endings would leave a trailing \r on every separator and
  // stop it matching.
  return text.replace(/\r\n?/g, '\n')
}

/**
 * Split a response into blocks on separator lines.
 *
 * Empty blocks at the very start and end are dropped, because a model that
 * opens or closes its answer with `---` is common and harmless. An empty
 * block *between* two pages is kept, since that means the response genuinely
 * had nothing for that page and the caller should see the mismatch.
 */
export function splitBlocks(response: string): string[] {
  const lines = normalise(response).split('\n')

  const blocks: string[] = []
  let current: string[] = []

  for (const line of lines) {
    if (SEPARATOR_LINE.test(line)) {
      blocks.push(current.join('\n').trim())
      current = []
      continue
    }
    current.push(line)
  }
  blocks.push(current.join('\n').trim())

  while (blocks.length > 0 && blocks[0] === '') blocks.shift()
  while (blocks.length > 0 && blocks[blocks.length - 1] === '') blocks.pop()

  return blocks
}

/**
 * Split a response into exactly `pageCount` blocks, or report a mismatch.
 */
export function splitTranscription(
  response: string,
  pageCount: number,
): SplitResult {
  if (!Number.isInteger(pageCount) || pageCount < 1) {
    throw new RangeError('pageCount must be a positive integer')
  }

  const whole = normalise(response).trim()
  const blocks = splitBlocks(response)

  if (blocks.length !== pageCount) {
    return { status: 'mismatch', expected: pageCount, found: blocks.length, whole }
  }

  return { status: 'ok', pages: blocks }
}

/**
 * The letter's markdown as one block per photographed sheet, for rendering.
 *
 * A `---` the letter uses as a rule of its own over-splits, and the reading
 * view renders one block per sheet, so the blocks past the last sheet were
 * silently never shown: the end of a letter, gone from the published page.
 * They fold into the last sheet instead, with the rule they were written
 * with. Fewer blocks than sheets is left alone; those sheets show only their
 * photograph.
 */
export function blocksForSheets(markdown: string, sheetCount: number): string[] {
  const blocks = splitBlocks(markdown)
  if (sheetCount < 1 || blocks.length <= sheetCount) return blocks

  return [
    ...blocks.slice(0, sheetCount - 1),
    blocks.slice(sheetCount - 1).join(`\n\n${PAGE_SEPARATOR}\n\n`),
  ]
}

/**
 * Join per-page transcriptions into the single markdown body stored on the
 * letter. Used once, to seed the editor from the raws.
 */
export function joinPages(pages: string[]): string {
  return pages.map((page) => page.trim()).join(`\n\n${PAGE_SEPARATOR}\n\n`)
}


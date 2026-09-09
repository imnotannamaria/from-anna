import { PAGE_SEPARATOR } from './split'

/**
 * The transcription prompt.
 *
 * Deliberately short and restrictive. Hallucination is the dangerous failure
 * in handwriting OCR, because it comes back plausible and a quick reread will
 * not catch it — so the model is told to mark what it cannot read rather than
 * guess, and the `[?]` markers are highlighted in the editor afterwards.
 *
 * The separator line is what lets every page go in one call while
 * `rawTranscription` is still stored per page.
 */
export function transcribePrompt(pageCount: number): string {
  return [
    `You are transcribing ${pageCount} photographed page${pageCount === 1 ? '' : 's'} of a handwritten letter, in the order given.`,
    '',
    'Rules:',
    '- Return plain markdown. No code fences, no commentary, no headings you invented.',
    '- Preserve paragraph breaks as they appear on the page.',
    '- Mark anything you cannot read confidently as [?]. Mark it even for a single word.',
    '- Never guess at a word. An unread word marked [?] is correct; a plausible invented word is not.',
    `- Separate each page with a line containing only ${PAGE_SEPARATOR}`,
    `- Return exactly ${pageCount - 1} separator line${pageCount - 1 === 1 ? '' : 's'}, one between each pair of pages, and none at the start or end.`,
  ].join('\n')
}

/**
 * Rough output ceiling. A dense handwritten page lands around 600 tokens, so
 * this is generous per page and still bounded.
 *
 * The context notes suggested a flat 1200, which was sized for a single page
 * and would truncate a three-sheet letter.
 */
export function maxOutputTokens(pageCount: number): number {
  return 1000 * pageCount + 200
}

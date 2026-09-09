/**
 * Finding the passages the model said it could not read.
 *
 * Hallucination is the dangerous failure in handwriting OCR, because it comes
 * back plausible and a quick reread will not catch it. The prompt tells the
 * model to mark anything it is unsure of as `[?]` rather than guess, so these
 * marks are the shortlist of what has to be checked against the photo.
 *
 * Finding them by eye in a 400-word letter is exactly the kind of task that
 * gets skipped, so the editor points at them instead.
 */

/** The marker the transcription prompt asks for. */
export const ILLEGIBLE_MARK = '[?]'

export type IllegibleMark = {
  /** Index of the `[` in the source string. */
  start: number
  /** Index just past the `]`. */
  end: number
}

export function findIllegibleMarks(markdown: string): IllegibleMark[] {
  const marks: IllegibleMark[] = []
  let from = 0

  for (;;) {
    const start = markdown.indexOf(ILLEGIBLE_MARK, from)
    if (start === -1) break
    marks.push({ start, end: start + ILLEGIBLE_MARK.length })
    from = start + ILLEGIBLE_MARK.length
  }

  return marks
}

/**
 * The next mark at or after `cursor`, wrapping back to the first one at the
 * end so repeated presses cycle rather than dead-end.
 */
export function nextIllegibleMark(
  markdown: string,
  cursor: number,
): IllegibleMark | null {
  const marks = findIllegibleMarks(markdown)
  if (marks.length === 0) return null
  return marks.find((mark) => mark.start >= cursor) ?? marks[0]
}

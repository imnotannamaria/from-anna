/**
 * Turning a transcription written in block capitals into ordinary sentences.
 *
 * A letter written in capitals comes back from the model in capitals, and
 * that is correct: the model is transcribing, and the raw transcription is
 * meant to be what was on the page. So this is a button in the editor, run on
 * `mdContent`, and never an instruction in the prompt. The raw stays the raw.
 *
 * It lowercases and then capitalises the start of each sentence, each
 * paragraph and the pronoun "I". It cannot know that "react" is React or that
 * "joão" is a name, so the editor says as much when it runs.
 *
 * Markdown that is not prose is left alone: link targets, directive
 * attributes and `[?]` markers keep their case exactly.
 */

/**
 * Pieces that must come out byte-for-byte as they went in.
 *
 * - `](...)` is a link target. URLs are case-sensitive.
 * - `{...}` is a directive's attributes: `{c=important}`, `{label="..."}`.
 *   The label is displayed uppercase by the stylesheet anyway.
 */
const PROTECTED = /(\]\([^)]*\)|\{[^}]*\})/g

/** A line that is only a container directive fence, like `:::` or `:::theme`. */
const FENCE = /^\s*:{3,}/

function lowerProse(text: string): string {
  return text
    .split(PROTECTED)
    .map((part, i) => (i % 2 === 1 ? part : part.toLowerCase()))
    .join('')
}

function capitaliseAt(text: string, index: number): string {
  return text.slice(0, index) + text[index].toUpperCase() + text.slice(index + 1)
}

/** Index of the first letter at or after `from`, skipping protected pieces. */
function firstLetter(text: string, from: number): number {
  const letter = /\p{L}/u
  let i = from
  while (i < text.length) {
    // Step over a protected piece whole, rather than capitalising inside it.
    PROTECTED.lastIndex = i
    const match = PROTECTED.exec(text)
    if (match && match.index === i) {
      i += match[0].length
      continue
    }
    // `[?]` is a marker, not a word.
    if (text.startsWith('[?]', i)) {
      i += 3
      continue
    }
    // `:mark[` is syntax, not a word: the first letter is inside the label.
    if (text.startsWith(':mark[', i)) {
      i += ':mark['.length
      continue
    }
    if (letter.test(text[i])) return i
    i += 1
  }
  return -1
}

export function normaliseCase(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')

  // Paragraphs are separated by a blank line or a directive fence. The first
  // letter of each one is a sentence start, whatever came before it.
  let startsParagraph = true
  const out: string[] = []

  for (const line of lines) {
    if (line.trim() === '' || FENCE.test(line)) {
      out.push(line)
      startsParagraph = true
      continue
    }

    let next = lowerProse(line)

    if (startsParagraph) {
      const i = firstLetter(next, 0)
      if (i !== -1) next = capitaliseAt(next, i)
      startsParagraph = false
    }

    // After a full stop, question mark or exclamation mark and a space.
    // Capitalising never changes a string's length, so the regex's offsets
    // stay valid while `next` is rewritten underneath it.
    const sentenceEnd = /[.!?]\s+/g
    let match: RegExpExecArray | null
    while ((match = sentenceEnd.exec(next))) {
      const at = firstLetter(next, match.index + match[0].length)
      if (at !== -1) next = capitaliseAt(next, at)
    }

    // The English pronoun. Portuguese has no standalone "i" to trip over.
    next = next.replace(/(^|[^\p{L}'])i(?=$|[^\p{L}]|'[\p{L}])/gu, '$1I')

    out.push(next)
  }

  return out.join('\n')
}

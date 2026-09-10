/**
 * Wrapping a selection in a highlight directive.
 *
 * Typing `:mark[...]{c=important}` by hand around every passage is the
 * friction that stops people highlighting at all, so the editor does it. The
 * logic lives here, apart from the component, because the interesting cases
 * are all about text positions and none of them need a DOM to test.
 */

export type WrapResult =
  | {
      status: 'ok'
      value: string
      /** Where the caret should land afterwards. */
      selectionStart: number
      selectionEnd: number
    }
  | {
      status: 'refused'
      reason: 'nested'
      message: string
    }

/**
 * Wrap `[start, end)` of `value` in `:mark[…]{c=tag}`.
 *
 * With nothing selected, an empty directive is inserted and the caret lands
 * between the brackets, ready to type. That is more useful than doing
 * nothing, and it is a decision rather than an accident.
 *
 * A selection that already contains a directive is refused. Nesting `:mark`
 * inside `:mark` does not parse into anything sensible, and silently
 * producing broken markdown is worse than saying no.
 */
export function wrapSelection(
  value: string,
  start: number,
  end: number,
  tag: string,
): WrapResult {
  const from = Math.max(0, Math.min(start, end))
  const to = Math.min(value.length, Math.max(start, end))

  const selected = value.slice(from, to)

  if (selected.includes(':mark[')) {
    return {
      status: 'refused',
      reason: 'nested',
      message:
        'That selection already contains a highlight. Highlights cannot nest.',
    }
  }

  const opening = ':mark['
  const closing = `]{c=${tag}}`
  const next = value.slice(0, from) + opening + selected + closing + value.slice(to)

  // With a selection, keep it selected inside the brackets so it can be
  // replaced or extended. With none, the caret sits where the text goes.
  const caret = from + opening.length

  return {
    status: 'ok',
    value: next,
    selectionStart: caret,
    selectionEnd: caret + selected.length,
  }
}

export type PassageResult =
  | {
      status: 'ok'
      value: string
      selectionStart: number
      selectionEnd: number
    }
  | {
      status: 'refused'
      reason: 'nested' | 'empty'
      message: string
    }

/** Expand `[from, to)` out to whole lines. */
function toWholeLines(value: string, from: number, to: number) {
  const start = value.lastIndexOf('\n', Math.max(0, from - 1)) + 1
  const found = value.indexOf('\n', to)
  return { start, end: found === -1 ? value.length : found }
}

/**
 * Wrap the selected lines in `:::passage`, grouping them into one block.
 *
 * A container directive has to sit on its own lines, so the selection is
 * expanded outwards to whole ones rather than cutting a paragraph in half and
 * producing markdown that parses into something else entirely.
 */
export function wrapPassage(
  value: string,
  start: number,
  end: number,
): PassageResult {
  const from = Math.max(0, Math.min(start, end))
  const to = Math.min(value.length, Math.max(start, end))

  const lines = toWholeLines(value, from, to)
  const selected = value.slice(lines.start, lines.end)

  if (selected.trim() === '') {
    return {
      status: 'refused',
      reason: 'empty',
      message: 'Put the cursor in the passage you want to mark first.',
    }
  }

  if (selected.includes(':::passage')) {
    return {
      status: 'refused',
      reason: 'nested',
      message:
        'That selection is already inside a passage. Passages cannot nest.',
    }
  }

  const opening = ':::passage'
  const next =
    value.slice(0, lines.start) +
    `${opening}\n${selected}\n:::` +
    value.slice(lines.end)

  // The words stay selected inside the wrapper, so the region can be adjusted
  // and reapplied without hunting for them again.
  const selectionStart = lines.start + opening.length + 1

  return {
    status: 'ok',
    value: next,
    selectionStart,
    selectionEnd: selectionStart + selected.length,
  }
}

/** A paragraph break: a line with nothing on it. */
const PARAGRAPH_BREAK = /\n[ \t]*\n/g

/** Expand `[from, to)` out to whole paragraphs. */
function toWholeParagraphs(value: string, from: number, to: number) {
  let start = 0
  let end = value.length
  for (const match of value.matchAll(PARAGRAPH_BREAK)) {
    const after = match.index + match[0].length
    if (after <= from) start = after
    if (match.index >= to) {
      end = match.index
      break
    }
  }
  return { start, end }
}

export type ThemeResult =
  | {
      status: 'ok'
      value: string
      /** The label, selected, so typing replaces it. Empty means a caret. */
      selectionStart: number
      selectionEnd: number
    }
  | {
      status: 'refused'
      reason: 'empty' | 'nested' | 'partial'
      message: string
    }

const FENCE_OPEN = /^\s*:{3,}\s*([A-Za-z][\w-]*)/
const FENCE_CLOSE = /^\s*:{3,}\s*$/

/**
 * The container directives still open at the end of `lines`, innermost
 * last, or `null` if a fence closes something that was never opened.
 */
function openContainers(lines: string[]): string[] | null {
  const stack: string[] = []
  for (const line of lines) {
    const open = FENCE_OPEN.exec(line)
    if (open) {
      stack.push(open[1])
      continue
    }
    if (FENCE_CLOSE.test(line)) {
      if (stack.length === 0) return null
      stack.pop()
    }
  }
  return stack
}

/**
 * Wrap the selected lines in `:::theme{label="…"}`: the bracket down the
 * side, with a name beside it.
 *
 * Expanded out to whole paragraphs, because a container directive has to sit
 * on lines of its own, and a paragraph, or a highlight inside one, can run
 * over several lines. The label comes back selected —
 * or, when empty, as a caret between the quotes — because a theme is only as
 * useful as its name, and the name is the next thing to type.
 *
 * Refused, rather than written wrong:
 * - a theme inside a theme, which the renderer unwraps, so the bracket would
 *   silently not appear;
 * - a selection holding half of another block, one `:::` without its pair,
 *   which would close the wrong thing.
 */
export function wrapTheme(
  value: string,
  start: number,
  end: number,
  label = '',
): ThemeResult {
  const from = Math.max(0, Math.min(start, end))
  const to = Math.min(value.length, Math.max(start, end))

  // A blank line under the cursor is not something to group.
  const line = toWholeLines(value, from, to)
  if (value.slice(line.start, line.end).trim() === '') {
    return {
      status: 'refused',
      reason: 'empty',
      message: 'Put the cursor in the lines you want to group first.',
    }
  }

  // Whole paragraphs, not whole lines. A paragraph can run over several
  // lines and so can a highlight inside it: fencing off one line put `:::`
  // in the middle of a `:mark[…]`, which then rendered as plain text.
  const lines = toWholeParagraphs(value, from, to)
  const selected = value.slice(lines.start, lines.end)

  const around = openContainers(value.slice(0, lines.start).split('\n'))
  const inside = openContainers(selected.split('\n'))

  if (around?.includes('theme') || inside?.includes('theme') || /^\s*:{3,}\s*theme/m.test(selected)) {
    return {
      status: 'refused',
      reason: 'nested',
      message: 'That is already under a theme. Themes cannot nest.',
    }
  }

  if (inside === null || inside.length > 0) {
    return {
      status: 'refused',
      reason: 'partial',
      message:
        'That selection takes half of another block with it. Select the whole block, or none of it.',
    }
  }

  // A quote would end the attribute early.
  const name = label.replace(/"/g, "'")
  const before = ':::theme{label="'
  const next =
    value.slice(0, lines.start) +
    `${before}${name}"}\n${selected}\n:::` +
    value.slice(lines.end)

  const labelStart = lines.start + before.length

  return {
    status: 'ok',
    value: next,
    selectionStart: labelStart,
    selectionEnd: labelStart + name.length,
  }
}

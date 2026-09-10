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

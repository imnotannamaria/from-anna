/**
 * What a reader can answer a letter with.
 *
 * The id is what the database counts under; the emoji is only how it is drawn,
 * so one can be swapped for another without losing what was counted. The list
 * is closed on purpose: an emoji typed into a request is a string written into
 * a table by whoever has the link.
 *
 * No server imports in here — the reading view uses the same list.
 */
export const REACTIONS = [
  { id: 'heart', emoji: '❤️', label: 'Love' },
  { id: 'touched', emoji: '🥹', label: 'Touched' },
  { id: 'laugh', emoji: '😂', label: 'Made me laugh' },
  { id: 'clap', emoji: '👏', label: 'Bravo' },
  { id: 'sparkles', emoji: '✨', label: 'Lovely' },
  { id: 'thanks', emoji: '🙏', label: 'Thank you' },
] as const

export type ReactionId = (typeof REACTIONS)[number]['id']
export type ReactionCounts = Record<ReactionId, number>

const IDS: readonly string[] = REACTIONS.map((reaction) => reaction.id)

export function isReactionId(value: unknown): value is ReactionId {
  return typeof value === 'string' && IDS.includes(value)
}

export function emptyCounts(): ReactionCounts {
  return Object.fromEntries(
    REACTIONS.map((reaction) => [reaction.id, 0]),
  ) as ReactionCounts
}

/**
 * Rows from a `group by` into a count for every reaction, including the ones
 * nobody used. A row for a reaction that has since left the list is dropped
 * rather than trusted.
 */
export function countsFrom(
  rows: readonly { reaction: string; count: number }[],
): ReactionCounts {
  const counts = emptyCounts()
  for (const row of rows) {
    if (isReactionId(row.reaction)) counts[row.reaction] = Number(row.count)
  }
  return counts
}

export function totalOf(counts: ReactionCounts): number {
  return REACTIONS.reduce((total, { id }) => total + counts[id], 0)
}

/**
 * The body of a reaction request: which one, and whether it is being added or
 * taken back. Anything else is refused, extra fields included being ignored.
 */
export function parseReactionBody(
  body: unknown,
): { reaction: ReactionId; on: boolean } | null {
  if (!body || typeof body !== 'object') return null
  const { reaction, on } = body as Record<string, unknown>
  if (!isReactionId(reaction) || typeof on !== 'boolean') return null
  return { reaction, on }
}

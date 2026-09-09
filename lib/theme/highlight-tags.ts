/**
 * The highlight vocabulary this app uses.
 *
 * `remark-scanned-page` deliberately defines none of its own: it ships the
 * mechanism and three colour slots, and the words are the consumer's to
 * choose. These are generic on purpose, describing how a passage should be
 * read rather than what it is about.
 */
export const HIGHLIGHT_TAGS = ['important', 'note', 'ask'] as const

export type HighlightTag = (typeof HIGHLIGHT_TAGS)[number]

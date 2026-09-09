import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const letterStatus = pgEnum('letter_status', ['draft', 'published'])

/**
 * A letter. `mdContent` is the edited transcription for the whole letter,
 * with pages separated by `---` — the same separator the transcription
 * produces, which is what lets the reading view turn text and photo together.
 *
 * There is no `userId`. The app is single-user and Clerk owns identity, so a
 * column that would always hold the same value buys nothing.
 */
export const letters = pgTable(
  'letters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    /** Internal, never rendered on the published page. */
    title: text('title').notNull(),
    /** Internal, never rendered on the published page. */
    recipient: text('recipient'),
    mdContent: text('md_content').notNull().default(''),
    status: letterStatus('status').notNull().default('draft'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // The slug is the public identifier, so a collision has to fail at insert
    // time rather than be assumed away by the generator.
    uniqueIndex('letters_slug_idx').on(table.slug),
  ],
)

/**
 * One row per photographed sheet. A real handwritten letter is two or three
 * of these, which is why it is a table and not an `image` column on `letters`.
 *
 * `rawTranscription` is the model output, untouched. Keeping it apart from
 * `letters.mdContent` means over-editing a letter is recoverable: raw fact on
 * one side, interpretation on the other.
 */
export const pages = pgTable(
  'pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    letterId: uuid('letter_id')
      .notNull()
      .references(() => letters.id, { onDelete: 'cascade' }),
    /** Order within the letter, zero-based. */
    index: integer('index').notNull(),
    /**
     * Vercel Blob URL of the processed photo. The original is never stored.
     * The store is private, so this is not readable without a token — pages
     * are served through a Function that checks the letter's status.
     */
    blobUrl: text('blob_url').notNull(),
    /** Dimensions *after* the client-side resize, so the page reserves space. */
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    /**
     * Required, not optional. An image of text is invisible to a screen
     * reader, so a page without alt text is a page that cannot be published.
     */
    alt: text('alt').notNull(),
    /** Model output before any editing. Null until transcription has run. */
    rawTranscription: text('raw_transcription'),
    /** Which model produced `rawTranscription`. */
    transcriptionProvider: text('transcription_provider'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Two pages cannot share a position in the same letter. This also serves
    // the only read there is — every page of a letter, in order — so no
    // separate index on `letterId` is needed.
    uniqueIndex('pages_letter_id_index_idx').on(table.letterId, table.index),
  ],
)

/**
 * One row per opening of a published letter.
 *
 * This is the table the project exists for. A letter you send either gets
 * opened or it doesn't, and without this you never find out which — nor
 * whether someone opened it and stopped at the first paragraph.
 *
 * `reachedEnd` is what separates those two: no row means never opened, a row
 * without it means abandoned partway, a row with it means read.
 *
 * There is no IP column, and no IP in any log line. `country` comes from the
 * platform's geo header and `device` from the user agent, and between them
 * they answer everything this needs without holding personal data.
 */
export const views = pgTable(
  'views',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    letterId: uuid('letter_id')
      .notNull()
      .references(() => letters.id, { onDelete: 'cascade' }),
    /** From `?from=`. Null when the link was opened without one. */
    source: text('source'),
    /** Where the visit actually came from. A different fact from `source`. */
    referrer: text('referrer'),
    country: text('country'),
    device: text('device'),
    /** Set when the last block of the letter enters the viewport. */
    reachedEnd: boolean('reached_end').notNull().default(false),
    /**
     * Opaque per-session value from a cookie, used to avoid counting the same
     * reader twice and to let the end-of-letter event find its own row. Not
     * derived from anything about the person.
     */
    sessionId: text('session_id').notNull(),
    viewedAt: timestamp('viewed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // One row per session per letter: a refresh is not an audience.
    uniqueIndex('views_letter_id_session_id_idx').on(
      table.letterId,
      table.sessionId,
    ),
  ],
)

export const MAX_PAGES_PER_LETTER = 5

/** The separator the transcription prompt requires between pages. */
export const PAGE_SEPARATOR = '---'

export type Letter = typeof letters.$inferSelect
export type NewLetter = typeof letters.$inferInsert
export type Page = typeof pages.$inferSelect
export type NewPage = typeof pages.$inferInsert
export type View = typeof views.$inferSelect
export type NewView = typeof views.$inferInsert

export { sql }

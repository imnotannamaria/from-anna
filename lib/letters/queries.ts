import 'server-only'

import { and, asc, count, desc, eq, sql } from 'drizzle-orm'

import { getDb } from '../db/client'
import { letters, pages, reactions, views } from '../db/schema'
import {
  type ReactionCounts,
  type ReactionId,
  countsFrom,
  emptyCounts,
  isReactionId,
} from './reactions'

export async function getLetterBySlug(slug: string) {
  const [letter] = await getDb()
    .select()
    .from(letters)
    .where(eq(letters.slug, slug))
    .limit(1)

  if (!letter) return null

  const letterPages = await getDb()
    .select()
    .from(pages)
    .where(eq(pages.letterId, letter.id))
    .orderBy(asc(pages.index))

  return { letter, pages: letterPages }
}

/**
 * Record one opening.
 *
 * Deduplicated per session by a unique index, not by reading first: two tabs
 * opened at once would both pass a read-then-write check. The database is the
 * thing that can actually promise it.
 *
 * A failure here is swallowed on purpose. Analytics must never be the reason
 * a letter does not render — the letter is the product, the number is the
 * instrument.
 */
export async function recordView(input: {
  letterId: string
  sessionId: string
  source: string | null
  referrer: string | null
  country: string | null
  device: string | null
}): Promise<void> {
  try {
    await getDb()
      .insert(views)
      .values(input)
      .onConflictDoNothing({
        target: [views.letterId, views.sessionId],
      })
  } catch (error) {
    console.error('could not record view', error)
  }
}

/** How many of each reaction a letter has. Every reaction is in the result. */
async function countReactions(letterId: string): Promise<ReactionCounts> {
  const rows = await getDb()
    .select({ reaction: reactions.reaction, count: count() })
    .from(reactions)
    .where(eq(reactions.letterId, letterId))
    .groupBy(reactions.reaction)

  return countsFrom(rows)
}

/**
 * What a letter has been answered with, and which of those are this reader's.
 *
 * Read for the page, and a letter must render without it: if the lookup
 * fails the reactions are simply empty, the same way a failed view insert
 * never holds a letter up.
 */
export async function getReactions(
  letterId: string,
  sessionId: string | null,
): Promise<{ counts: ReactionCounts; mine: ReactionId[] }> {
  try {
    const [counts, own] = await Promise.all([
      countReactions(letterId),
      sessionId
        ? getDb()
            .select({ reaction: reactions.reaction })
            .from(reactions)
            .where(
              and(
                eq(reactions.letterId, letterId),
                eq(reactions.sessionId, sessionId),
              ),
            )
        : Promise.resolve([]),
    ])
    return {
      counts,
      mine: own.map((row) => row.reaction).filter(isReactionId),
    }
  } catch (error) {
    console.error('could not read reactions', error)
    return { counts: emptyCounts(), mine: [] }
  }
}

/**
 * Add a reader's reaction, or take it back, and return the new counts.
 *
 * Idempotent in both directions: the unique index makes adding twice a
 * no-op and deleting a row that is not there is too, so a double click or a
 * retried request cannot move a count by more than one. Unlike the view
 * insert this is allowed to throw — the reader asked for it, and the client
 * has to know it did not happen.
 */
export async function setReaction(input: {
  letterId: string
  sessionId: string
  reaction: ReactionId
  on: boolean
}): Promise<ReactionCounts> {
  const { letterId, sessionId, reaction, on } = input

  if (on) {
    await getDb()
      .insert(reactions)
      .values({ letterId, sessionId, reaction })
      .onConflictDoNothing({
        target: [reactions.letterId, reactions.sessionId, reactions.reaction],
      })
  } else {
    await getDb()
      .delete(reactions)
      .where(
        and(
          eq(reactions.letterId, letterId),
          eq(reactions.sessionId, sessionId),
          eq(reactions.reaction, reaction),
        ),
      )
  }

  return countReactions(letterId)
}

export type LetterStats = {
  opens: number
  /** Readers who answered with at least one reaction. */
  reacted: number
  reactions: ReactionCounts
  bySource: { source: string | null; opens: number; reacted: number }[]
}

/**
 * The numbers the project was started to get.
 *
 * Never opened, opened and said nothing, opened and answered. Each one points
 * at a different fix, which is why counting only opens was not enough. A
 * reaction is a better "answered" than reaching the bottom ever was: it is
 * something the reader did on purpose.
 */
export async function getLetterStats(letterId: string): Promise<LetterStats> {
  const [rows, counts] = await Promise.all([
    getDb()
      .select({
        source: views.source,
        opens: count(),
        reacted: sql<number>`sum(case when exists (
          select 1 from ${reactions}
          where ${reactions.letterId} = ${views.letterId}
            and ${reactions.sessionId} = ${views.sessionId}
        ) then 1 else 0 end)::int`,
      })
      .from(views)
      .where(eq(views.letterId, letterId))
      .groupBy(views.source)
      .orderBy(desc(count())),
    countReactions(letterId),
  ])

  return {
    opens: rows.reduce((total, row) => total + row.opens, 0),
    // Derived from the rows already fetched rather than a second query.
    reacted: rows.reduce((total, row) => total + Number(row.reacted), 0),
    reactions: counts,
    bySource: rows.map((row) => ({
      source: row.source,
      opens: row.opens,
      reacted: Number(row.reacted),
    })),
  }
}

export async function listLetters() {
  return getDb()
    .select({
      id: letters.id,
      slug: letters.slug,
      title: letters.title,
      recipient: letters.recipient,
      status: letters.status,
      expiresAt: letters.expiresAt,
      publishedAt: letters.publishedAt,
      updatedAt: letters.updatedAt,
    })
    .from(letters)
    .orderBy(desc(letters.updatedAt))
}

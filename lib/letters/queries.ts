import 'server-only'

import { and, asc, count, desc, eq, sql } from 'drizzle-orm'

import { getDb } from '../db/client'
import { letters, pages, views } from '../db/schema'

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

/**
 * Mark that the reader got to the end.
 *
 * Updates the session's existing row rather than inserting a second, so a
 * letter that was read still counts as one opening.
 */
export async function markReachedEnd(
  letterId: string,
  sessionId: string,
): Promise<void> {
  try {
    await getDb()
      .update(views)
      .set({ reachedEnd: true })
      .where(and(eq(views.letterId, letterId), eq(views.sessionId, sessionId)))
  } catch (error) {
    console.error('could not mark reached end', error)
  }
}

export type LetterStats = {
  opens: number
  reachedEnd: number
  bySource: { source: string | null; opens: number; reachedEnd: number }[]
}

/**
 * The three numbers the project was started to get.
 *
 * Never opened, opened and abandoned, read to the end. Each one points at a
 * different fix, which is why counting only opens was not enough.
 */
export async function getLetterStats(letterId: string): Promise<LetterStats> {
  const rows = await getDb()
    .select({
      source: views.source,
      opens: count(),
      reachedEnd: sql<number>`sum(case when ${views.reachedEnd} then 1 else 0 end)::int`,
    })
    .from(views)
    .where(eq(views.letterId, letterId))
    .groupBy(views.source)
    .orderBy(desc(count()))

  return {
    opens: rows.reduce((total, row) => total + row.opens, 0),
    reachedEnd: rows.reduce((total, row) => total + Number(row.reachedEnd), 0),
    // Derived from the rows already fetched rather than a second query.
    bySource: rows.map((row) => ({
      source: row.source,
      opens: row.opens,
      reachedEnd: Number(row.reachedEnd),
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

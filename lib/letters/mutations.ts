import 'server-only'

import { asc, eq } from 'drizzle-orm'

import { getDb } from '../db/client'
import { MAX_PAGES_PER_LETTER, letters, pages } from '../db/schema'
import { generateSlug } from '../slug'

export class TooManyPagesError extends Error {
  constructor(readonly attempted: number) {
    super(
      `A letter holds at most ${MAX_PAGES_PER_LETTER} pages; tried to add ${attempted}.`,
    )
    this.name = 'TooManyPagesError'
  }
}

/**
 * Create a draft letter.
 *
 * Slug collisions are astronomically unlikely but not impossible, so the
 * unique index is allowed to reject one and the insert is retried. The
 * database is the authority on uniqueness, not the generator.
 */
export async function createLetter(input: {
  title: string
  recipient?: string | null
}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const [row] = await getDb()
        .insert(letters)
        .values({
          slug: generateSlug(),
          title: input.title,
          recipient: input.recipient ?? null,
        })
        .returning()
      return row
    } catch (error) {
      const isDuplicate =
        error instanceof Error && /unique|duplicate/i.test(error.message)
      if (!isDuplicate || attempt === 4) throw error
    }
  }
  throw new Error('Could not allocate a unique slug')
}

export async function getLetterWithPages(letterId: string) {
  const [letter] = await getDb()
    .select()
    .from(letters)
    .where(eq(letters.id, letterId))
    .limit(1)

  if (!letter) return null

  const letterPages = await getDb()
    .select()
    .from(pages)
    .where(eq(pages.letterId, letterId))
    .orderBy(asc(pages.index))

  return { letter, pages: letterPages }
}

/**
 * Attach uploaded photos to a letter, in the order given.
 *
 * The cap is enforced here as well as in the form, because a client-side
 * limit is a convenience and a server-side one is a rule.
 */
export async function addPages(
  letterId: string,
  incoming: {
    blobUrl: string
    width: number
    height: number
    alt: string
  }[],
) {
  const existing = await getDb()
    .select({ index: pages.index })
    .from(pages)
    .where(eq(pages.letterId, letterId))

  const total = existing.length + incoming.length
  if (total > MAX_PAGES_PER_LETTER) throw new TooManyPagesError(total)

  const nextIndex = existing.length

  return getDb()
    .insert(pages)
    .values(
      incoming.map((page, offset) => ({
        letterId,
        index: nextIndex + offset,
        blobUrl: page.blobUrl,
        width: page.width,
        height: page.height,
        alt: page.alt,
      })),
    )
    .returning()
}

/**
 * Store one raw transcription per page. Reprocessing overwrites: a wrong
 * transcription has no historical value.
 */
export async function saveTranscriptions(
  entries: { pageId: string; raw: string; provider: string }[],
) {
  const now = new Date()
  for (const entry of entries) {
    await getDb()
      .update(pages)
      .set({
        rawTranscription: entry.raw,
        transcriptionProvider: entry.provider,
        updatedAt: now,
      })
      .where(eq(pages.id, entry.pageId))
  }
}

/**
 * Save edited markdown.
 *
 * Separate from `seedMdContent` on purpose: seeding refuses to touch content
 * that already exists, and this one is the only path allowed to replace it.
 * Keeping them apart is what makes the seeding guard meaningful.
 */
export async function saveMdContent(letterId: string, mdContent: string) {
  const [row] = await getDb()
    .update(letters)
    .set({ mdContent, updatedAt: new Date() })
    .where(eq(letters.id, letterId))
    .returning({ id: letters.id, updatedAt: letters.updatedAt })

  return row ?? null
}

/**
 * Seed the editor from the raws, once.
 *
 * Refuses to overwrite a letter that already has edited content. Silently
 * replacing `mdContent` is the data-loss bug in this feature, so it is a
 * guard rather than a convention.
 */
export async function seedMdContent(letterId: string, seeded: string) {
  const [letter] = await getDb()
    .select({ mdContent: letters.mdContent })
    .from(letters)
    .where(eq(letters.id, letterId))
    .limit(1)

  if (!letter) return { seeded: false, reason: 'not_found' as const }
  if (letter.mdContent.trim() !== '') {
    return { seeded: false, reason: 'already_edited' as const }
  }

  await getDb()
    .update(letters)
    .set({ mdContent: seeded, updatedAt: new Date() })
    .where(eq(letters.id, letterId))

  return { seeded: true, reason: null }
}

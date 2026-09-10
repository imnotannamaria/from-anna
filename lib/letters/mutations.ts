import 'server-only'

import { asc, eq } from 'drizzle-orm'

import { getDb } from '../db/client'
import { MAX_PAGES_PER_LETTER, letters, pages } from '../db/schema'
import { slugFromTitle, withSuffix } from '../slug'

export class TooManyPagesError extends Error {
  constructor(readonly attempted: number) {
    super(
      `A letter holds at most ${MAX_PAGES_PER_LETTER} pages; tried to add ${attempted}.`,
    )
    this.name = 'TooManyPagesError'
  }
}

/** A slug I typed myself is already in use. Never renamed behind my back. */
export class SlugTakenError extends Error {
  constructor(readonly slug: string) {
    super(`/${slug} is already taken by another letter.`)
    this.name = 'SlugTakenError'
  }
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && /unique|duplicate/i.test(error.message)
}

/**
 * Start a letter: a draft with no pages and no text.
 *
 * The slug is either one I typed, which is used exactly and refused if taken,
 * or one made from the title and today's date, which gets `-2`, `-3` if a
 * letter with the same title was already started today. The unique index is
 * the authority on collisions, not a read beforehand that two requests could
 * both pass.
 */
export async function createLetter(input: {
  title: string
  recipient?: string | null
  /** Already checked by `checkCustomSlug`. Omit to generate one. */
  slug?: string
}) {
  const insert = (slug: string) =>
    getDb()
      .insert(letters)
      .values({
        slug,
        title: input.title,
        recipient: input.recipient ?? null,
      })
      .returning()

  if (input.slug) {
    try {
      const [row] = await insert(input.slug)
      return row
    } catch (error) {
      if (isUniqueViolation(error)) throw new SlugTakenError(input.slug)
      throw error
    }
  }

  const base = slugFromTitle(input.title, new Date())
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      const [row] = await insert(withSuffix(base, attempt))
      return row
    } catch (error) {
      if (!isUniqueViolation(error)) throw error
    }
  }
  throw new Error(`Could not find a free slug starting with ${base}`)
}

/**
 * Delete a letter and everything under it.
 *
 * Pages and views go with it through `on delete cascade`. The photographs are
 * in the Blob store, which the database cannot reach, so their URLs are
 * returned for the caller to delete there.
 *
 * The row goes first. If the blob delete then fails, what is left is a
 * private file nothing points at — unreachable without the store token, and
 * cheap. The other order could leave a letter whose photographs are gone.
 */
export async function deleteLetter(
  letterId: string,
): Promise<{ deleted: boolean; blobUrls: string[] }> {
  const found = await getLetterWithPages(letterId)
  if (!found) return { deleted: false, blobUrls: [] }

  const blobUrls = found.pages.flatMap((page) =>
    [page.blobUrl, page.screenBlobUrl].filter((url): url is string => !!url),
  )

  await getDb().delete(letters).where(eq(letters.id, letterId))

  return { deleted: true, blobUrls }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Whether a string can be a letter id at all.
 *
 * Anything that is not a UUID cannot match a row, and sent to Postgres it
 * comes back as a type error, so `/api/letters/nope/pages/0` answered 500
 * where every other miss answers 404.
 */
export function isLetterId(value: string): boolean {
  return UUID.test(value)
}

export async function getLetterWithPages(letterId: string) {
  if (!isLetterId(letterId)) return null

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
    /** The narrow-screen output, null for pages uploaded before it existed. */
    screenBlobUrl: string | null
    screenWidth: number | null
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
        screenBlobUrl: page.screenBlobUrl,
        screenWidth: page.screenWidth,
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
 * Publish, unpublish, or set an expiry.
 *
 * Unpublishing takes the letter off the web immediately, and `expiresAt`
 * does the same on a timer. Both are checked by `isPubliclyReadable`, and
 * because the Blob store is private the photographs go with it — a public
 * blob URL would have kept working long after either.
 *
 * `publishedAt` is set the first time and never moved, so it stays the date
 * the letter was sent rather than the date it was last toggled.
 */
export async function setLetterStatus(
  letterId: string,
  input: { status?: 'draft' | 'published'; expiresAt?: Date | null },
) {
  if (!isLetterId(letterId)) return null

  const [existing] = await getDb()
    .select({ status: letters.status, publishedAt: letters.publishedAt })
    .from(letters)
    .where(eq(letters.id, letterId))
    .limit(1)

  if (!existing) return null

  const becomingPublished =
    input.status === 'published' && existing.status !== 'published'

  const [row] = await getDb()
    .update(letters)
    .set({
      ...(input.status ? { status: input.status } : {}),
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
      ...(becomingPublished && !existing.publishedAt
        ? { publishedAt: new Date() }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(letters.id, letterId))
    .returning()

  return row ?? null
}

/**
 * Save edited markdown.
 *
 * Separate from `seedMdContent` on purpose: seeding refuses to touch content
 * that already exists, and this one is the only path allowed to replace it.
 * Keeping them apart is what makes the seeding guard meaningful.
 */
export async function saveMdContent(letterId: string, mdContent: string) {
  if (!isLetterId(letterId)) return null

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

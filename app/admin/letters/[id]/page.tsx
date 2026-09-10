import Link from 'next/link'
import { notFound } from 'next/navigation'

import { TranscriptionEditor } from '@/components/editor/transcription-editor'
import { ScannedPage } from 'remark-scanned-page'
import { PageUploader } from '@/components/upload/page-uploader'
import { TranscribeButton } from '@/components/upload/transcribe-button'
import { NotAuthorizedError, requireAdmin } from '@/lib/auth/admin'
import { getLetterWithPages } from '@/lib/letters/mutations'
import { HIGHLIGHT_TAGS } from '@/lib/theme/highlight-tags'
import { splitBlocks } from '@/lib/transcription/split'

/** Reads the database, so it is never cached. */
export const dynamic = 'force-dynamic'

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function LetterAdminPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Checked here, in the page itself. A middleware matcher is not the gate:
  // a matcher can be edited wrong.
  try {
    await requireAdmin()
  } catch (error) {
    // 404, never 403 — a 403 confirms the letter exists.
    if (error instanceof NotAuthorizedError) notFound()
    throw error
  }

  const { id } = await params
  const letter = await getLetterWithPages(id)
  if (!letter) notFound()

  const transcribed = letter.pages.filter((page) => page.rawTranscription)

  // The letter is one markdown document split on `---`, so a page whose block
  // is missing still renders its photo rather than disappearing.
  const blocks = splitBlocks(letter.letter.mdContent)

  return (
    <main className="admin-shell admin-shell--wide">
      <header className="admin-masthead">
        <p className="meta">
          <Link href="/admin" className="admin-back">
            ← Letters
          </Link>
        </p>
        <h1 className="display admin-title">{letter.letter.title}</h1>
        <p className="admin-card-meta">
          <Link href={`/${letter.letter.slug}`} className="admin-slug">
            /{letter.letter.slug}
          </Link>
          <span aria-hidden="true"> · </span>
          {letter.pages.length} page{letter.pages.length === 1 ? '' : 's'}
          <span aria-hidden="true"> · </span>
          {transcribed.length} transcribed
          <span aria-hidden="true"> · </span>
          {letter.letter.status}
        </p>
        <span className="rule" aria-hidden="true" />
      </header>

      {letter.pages.length > 0 && (
        <section className="admin-section">
          <h2 className="meta">Pages</h2>
          {letter.pages.map((page, i) => (
            <ScannedPage
              key={page.id}
              imageSrc={`/api/letters/${letter.letter.id}/pages/${page.index}`}
              alt={page.alt}
              width={page.width}
              height={page.height}
              markdown={blocks[i] ?? ''}
              pageNumber={page.index + 1}
              totalPages={letter.pages.length}
              priority={i === 0}
              knownTags={HIGHLIGHT_TAGS}
              proseClassName="letter-prose"
            />
          ))}
        </section>
      )}

      <TranscribeButton
        letterId={letter.letter.id}
        pageCount={letter.pages.length}
        alreadyTranscribed={transcribed.length > 0}
      />

      {(letter.letter.mdContent.trim() !== '' || letter.pages.length > 0) && (
        <TranscriptionEditor
          letterId={letter.letter.id}
          initialMdContent={letter.letter.mdContent}
        />
      )}

      <PageUploader
        letterId={letter.letter.id}
        existingPageCount={letter.pages.length}
      />
    </main>
  )
}

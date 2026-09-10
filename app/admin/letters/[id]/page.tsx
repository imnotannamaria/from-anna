import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ScannedPage } from 'remark-scanned-page'

import { LetterControls } from '@/components/admin/letter-controls'
import { TranscriptionEditor } from '@/components/editor/transcription-editor'
import { PageUploader } from '@/components/upload/page-uploader'
import { TranscribeButton } from '@/components/upload/transcribe-button'
import { NotAuthorizedError, requireAdmin } from '@/lib/auth/admin'
import { isPubliclyReadable } from '@/lib/letters/access'
import { getLetterWithPages } from '@/lib/letters/mutations'
import { HIGHLIGHT_TAGS } from '@/lib/theme/highlight-tags'
import { blocksForSheets } from '@/lib/transcription/split'

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
  const blocks = blocksForSheets(letter.letter.mdContent, letter.pages.length)

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
          <span className="admin-slug">/{letter.letter.slug}</span>
          {letter.letter.recipient && (
            <>
              <span aria-hidden="true"> · </span>
              to {letter.letter.recipient}
            </>
          )}
          <span aria-hidden="true"> · </span>
          {letter.pages.length} page{letter.pages.length === 1 ? '' : 's'}
          <span aria-hidden="true"> · </span>
          {transcribed.length} transcribed
        </p>
        <span className="rule" aria-hidden="true" />
      </header>

      {/*
        In the order a letter is made: say whether it is out, add the
        photographs, read them, correct the reading. Publishing sits at the
        top because it is the thing I come back to this page for most.
      */}
      <LetterControls
        letterId={letter.letter.id}
        slug={letter.letter.slug}
        status={letter.letter.status}
        expiresAt={letter.letter.expiresAt?.toISOString() ?? null}
        live={isPubliclyReadable(letter.letter)}
      />

      <section className="admin-block" aria-labelledby="photographs">
        <h2 className="meta admin-block-title" id="photographs">
          Photographs
        </h2>

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

        <PageUploader
          letterId={letter.letter.id}
          existingPageCount={letter.pages.length}
        />
      </section>

      {letter.pages.length > 0 && (
        <section className="admin-block" aria-labelledby="transcription">
          <h2 className="meta admin-block-title" id="transcription">
            Transcription
          </h2>

          <TranscribeButton
            letterId={letter.letter.id}
            pageCount={letter.pages.length}
            alreadyTranscribed={transcribed.length > 0}
          />

          <TranscriptionEditor
            // Not keyed. A key that changed on every refresh remounted the
            // editor whenever a letter was published or given a date, and
            // lost whatever was being typed. The editor takes new text from
            // the server itself, and only when nothing in it is unsaved.
            letterId={letter.letter.id}
            initialMdContent={letter.letter.mdContent}
          />
        </section>
      )}
    </main>
  )
}

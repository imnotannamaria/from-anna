import { notFound } from 'next/navigation'
import { ScannedPhoto } from 'remark-scanned-page'
import { LetterWorkbench } from '@/components/admin/letter-workbench'
import { NotAuthorizedError, requireAdmin } from '@/lib/auth/admin'
import { isPubliclyReadable } from '@/lib/letters/access'
import { getLetterWithPages } from '@/lib/letters/mutations'
import { joinPages } from '@/lib/transcription/split'

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

  return (
    <LetterWorkbench
      letterId={letter.letter.id}
      title={letter.letter.title}
      recipient={letter.letter.recipient}
      slug={letter.letter.slug}
      status={letter.letter.status}
      expiresAt={letter.letter.expiresAt?.toISOString() ?? null}
      live={isPubliclyReadable(letter.letter)}
      initialMdContent={letter.letter.mdContent}
      transcribedCount={
        letter.pages.filter((page) => page.rawTranscription).length
      }
      rawTranscription={joinPages(
        letter.pages.map((page) => page.rawTranscription ?? ''),
      )}
      photos={letter.pages.map((page) => (
        <ScannedPhoto
          key={page.id}
          imageSrc={`/api/letters/${letter.letter.id}/pages/${page.index}`}
          screenSrc={
            page.screenBlobUrl
              ? `/api/letters/${letter.letter.id}/pages/${page.index}?size=screen`
              : undefined
          }
          screenWidth={page.screenWidth ?? undefined}
          alt={page.alt}
          width={page.width}
          height={page.height}
          priority={false}
          sizes="(min-width: 900px) 28rem, calc(100vw - 3rem)"
        />
      ))}
    />
  )
}

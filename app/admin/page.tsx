import Link from 'next/link'
import { notFound } from 'next/navigation'

import { NotAuthorizedError, requireAdmin } from '@/lib/auth/admin'
import { isPubliclyReadable } from '@/lib/letters/access'
import { getLetterStats, listLetters } from '@/lib/letters/queries'

export const dynamic = 'force-dynamic'

export const metadata = {
  robots: { index: false, follow: false },
}

/**
 * Where the numbers live.
 *
 * They are here rather than only in the database because data I have to open
 * a SQL client to see is data I will not look at, and the whole point of
 * collecting it was to change what I write next.
 */
export default async function AdminPage() {
  try {
    await requireAdmin()
  } catch (error) {
    if (error instanceof NotAuthorizedError) notFound()
    throw error
  }

  const letters = await listLetters()
  const stats = await Promise.all(
    letters.map(async (letter) => ({
      letter,
      stats: await getLetterStats(letter.id),
    })),
  )

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-medium">Letters</h1>

      {letters.length === 0 && (
        <p className="opacity-80">No letters yet.</p>
      )}

      <ul className="flex list-none flex-col gap-4 p-0">
        {stats.map(({ letter, stats }) => {
          const live = isPubliclyReadable(letter)
          return (
            <li key={letter.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={`/admin/letters/${letter.id}`}
                  className="font-medium underline"
                >
                  {letter.title}
                </Link>
                <span className="text-xs opacity-70">
                  {live ? 'live' : letter.status}
                  {letter.expiresAt
                    ? ` · expires ${letter.expiresAt.toISOString().slice(0, 10)}`
                    : ''}
                </span>
              </div>

              <p className="mt-1 text-sm opacity-70">
                {letter.recipient ? `${letter.recipient} · ` : ''}
                <code>/{letter.slug}</code>
              </p>

              {/*
                The three cases the project was started to tell apart. Opens
                without ends means the letter was abandoned partway, which
                needs a different fix from never being opened at all.
              */}
              <dl className="mt-3 flex flex-wrap gap-6 text-sm">
                <div>
                  <dt className="text-xs opacity-70">Opened</dt>
                  <dd className="text-lg">{stats.opens}</dd>
                </div>
                <div>
                  <dt className="text-xs opacity-70">Read to the end</dt>
                  <dd className="text-lg">{stats.reachedEnd}</dd>
                </div>
                <div>
                  <dt className="text-xs opacity-70">Left partway</dt>
                  <dd className="text-lg">{stats.opens - stats.reachedEnd}</dd>
                </div>
              </dl>

              {stats.bySource.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">
                      Opens by source for {letter.title}
                    </caption>
                    <thead>
                      <tr className="opacity-70">
                        <th scope="col" className="pr-4 font-normal">Source</th>
                        <th scope="col" className="pr-4 font-normal">Opened</th>
                        <th scope="col" className="font-normal">Read</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.bySource.map((row) => (
                        <tr key={row.source ?? 'direct'}>
                          <td className="pr-4">{row.source ?? 'no ?from='}</td>
                          <td className="pr-4">{row.opens}</td>
                          <td>{row.reachedEnd}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </main>
  )
}

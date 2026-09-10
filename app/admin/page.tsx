import Link from 'next/link'
import { notFound } from 'next/navigation'

import { NewLetter } from '@/components/admin/new-letter'
import { NotAuthorizedError, requireAdmin } from '@/lib/auth/admin'
import { isPubliclyReadable } from '@/lib/letters/access'
import { getLetterStats, listLetters } from '@/lib/letters/queries'

export const dynamic = 'force-dynamic'

export const metadata = {
  robots: { index: false, follow: false },
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    // An expiry is the end of a UTC day, so it is shown as one. In the
    // server's own zone it could read as the day before or after.
    timeZone: 'UTC',
  })
}

/**
 * Where the numbers live.
 *
 * They are here rather than only in the database because data I have to open
 * a SQL client to see is data I will not look at, and the whole point of
 * collecting it was to change what I write next.
 *
 * The three figures are given equal weight on purpose. "Opened" alone is the
 * number that flatters; the one worth looking at is the gap between opened
 * and read.
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
    <main className="admin-shell">
      <header className="admin-masthead">
        <p className="meta">Desk</p>
        <h1 className="display admin-title">Letters</h1>
        <span className="rule" aria-hidden="true" />
      </header>

      <NewLetter />

      {letters.length === 0 ? (
        <p className="admin-empty">
          Nothing written yet. Start one, photograph a page, and it will
          appear here.
        </p>
      ) : (
        <ul className="admin-list">
          {stats.map(({ letter, stats }, i) => {
            const live = isPubliclyReadable(letter)
            const unread = stats.opens - stats.reachedEnd

            return (
              <li
                key={letter.id}
                className="admin-card"
                /* One orchestrated entrance, staggered by position. */
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <div className="admin-card-head">
                  <Link href={`/admin/letters/${letter.id}`} className="admin-card-title">
                    {letter.title}
                  </Link>
                  <span className="status" data-live={live ? 'true' : 'false'}>
                    <span className="status-dot" aria-hidden="true" />
                    {live ? 'live' : letter.status}
                  </span>
                </div>

                <p className="admin-card-meta">
                  {letter.recipient && (
                    <>
                      <span className="admin-recipient">{letter.recipient}</span>
                      <span aria-hidden="true"> · </span>
                    </>
                  )}
                  <Link href={`/${letter.slug}`} className="admin-slug">
                    /{letter.slug}
                  </Link>
                  {letter.expiresAt && (
                    <>
                      <span aria-hidden="true"> · </span>
                      expires {formatDate(letter.expiresAt)}
                    </>
                  )}
                </p>

                {/*
                  The three cases the project was started to tell apart.
                  Opens without ends means the letter was abandoned partway,
                  which needs a different fix from never being opened at all.
                */}
                <dl className="figures">
                  <div>
                    <dt>Opened</dt>
                    <dd>{stats.opens}</dd>
                  </div>
                  <div>
                    <dt>Read to the end</dt>
                    <dd data-good={stats.reachedEnd > 0 ? 'true' : 'false'}>
                      {stats.reachedEnd}
                    </dd>
                  </div>
                  <div>
                    <dt>Left partway</dt>
                    <dd>{unread}</dd>
                  </div>
                </dl>

                {stats.bySource.length > 0 && (
                  <div className="source-table-wrap">
                    <table className="source-table">
                      <caption className="sr-only">
                        Opens by source for {letter.title}
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Source</th>
                          <th scope="col">Opened</th>
                          <th scope="col">Read</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.bySource.map((row) => (
                          <tr key={row.source ?? 'direct'}>
                            <td>{row.source ?? 'no ?from='}</td>
                            <td>{row.opens}</td>
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
      )}
    </main>
  )
}

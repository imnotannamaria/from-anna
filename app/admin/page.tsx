import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/app/components/entrepta/accordion'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import Link from 'next/link'
import { BrandMark } from '@/components/ui/brand-mark'
import { LetterList } from '@/components/admin/letter-list'
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
    <main id="main-content" className="admin-shell surface">
      <header className="admin-masthead">
        <ThemeToggle />
        <p className="desk-wordmark">
          <BrandMark size={40} />
          from anna <span>/ the writing desk</span>
        </p>
        <h1 className="display admin-title">Your letters</h1>
        <p className="editor-hint">
          A place for the words you want to send. Pick up a draft, or start with
          a fresh sheet.
        </p>
        <span className="rule" aria-hidden="true" />
      </header>

      <NewLetter />

      <LetterList
        counts={{
          all: letters.length,
          published: letters.filter((letter) => isPubliclyReadable(letter))
            .length,
          draft: letters.filter((letter) => letter.status === 'draft').length,
          expired: letters.filter(
            (letter) =>
              letter.status === 'published' && !isPubliclyReadable(letter),
          ).length,
        }}
      >
        <ul className="admin-list">
          {stats.map(({ letter, stats }, i) => {
            const live = isPubliclyReadable(letter)
            const unread = stats.opens - stats.reachedEnd

            return (
              <li
                key={letter.id}
                className="admin-card"
                data-status={
                  live
                    ? 'published'
                    : letter.status === 'published'
                      ? 'expired'
                      : 'draft'
                }
                /* One orchestrated entrance, staggered by position. */
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <div className="admin-card-head">
                  <Link
                    href={`/admin/letters/${letter.id}`}
                    className="admin-card-title"
                  >
                    {letter.title}
                  </Link>
                  <span className="status" data-live={live ? 'true' : 'false'}>
                    <span className="status-dot" aria-hidden="true" />
                    {live
                      ? 'Published'
                      : letter.status === 'published'
                        ? 'Expired'
                        : 'Draft'}
                  </span>
                </div>

                <p className="admin-card-meta">
                  {letter.recipient && (
                    <>
                      <span className="admin-recipient">
                        {letter.recipient}
                      </span>
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

                <div className="editor-bar">
                  <Link className="pill" href={`/admin/letters/${letter.id}`}>
                    Edit letter →
                  </Link>
                </div>
                <Accordion
                  type="single"
                  collapsible
                  className="activity-accordion"
                >
                  <AccordionItem value="activity" className="letter-insights">
                    <AccordionTrigger>
                      Reading activity · {stats.opens}{' '}
                      {stats.opens === 1 ? 'open' : 'opens'}
                    </AccordionTrigger>
                    <AccordionContent>
                      <dl className="figures">
                        <div>
                          <dt>Opened</dt>
                          <dd>{stats.opens}</dd>
                        </div>
                        <div>
                          <dt>Read to the end</dt>
                          <dd
                            data-good={stats.reachedEnd > 0 ? 'true' : 'false'}
                          >
                            {stats.reachedEnd}
                          </dd>
                        </div>
                        <div>
                          <dt>Not recorded as finished</dt>
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
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </li>
            )
          })}
        </ul>
      </LetterList>
    </main>
  )
}

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  letterId: string
  slug: string
  status: 'draft' | 'published'
  /** ISO string, or null when it never expires. */
  expiresAt: string | null
  /** Published and not expired: what a stranger with the link would see. */
  live: boolean
}

type Busy = 'status' | 'expiry' | 'delete' | null

/**
 * Publishing, unpublishing, expiry and deletion, in one place.
 *
 * All of it existed on the server — `PATCH /api/letters/[id]` has taken a
 * status and an expiry date since the first version — and none of it had a
 * control, so a letter could be started and never sent.
 *
 * Deleting asks twice. It takes the photographs with it, and there is no
 * undo: the original photo is thrown away on upload, so the stored one is the
 * only copy there is.
 */
export function LetterControls({ letterId, slug, status, expiresAt, live }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<Busy>(null)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  // A bare `YYYY-MM-DD` from a date input, kept as text until it is sent.
  const [expiry, setExpiry] = useState(expiresAt ? expiresAt.slice(0, 10) : '')

  async function patch(body: Record<string, unknown>, kind: Busy, done: string) {
    setBusy(kind)
    setFailed(false)
    setMessage('')
    try {
      const response = await fetch(`/api/letters/${letterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => null)
        setFailed(true)
        setMessage(result?.error ?? `That did not work (${response.status}).`)
        return
      }
      setMessage(done)
      router.refresh()
    } catch {
      setFailed(true)
      setMessage('Could not reach the server. Nothing changed.')
    } finally {
      setBusy(null)
    }
  }

  function saveExpiry(value: string) {
    // The end of that day, in UTC. A bare date parsed as midnight would expire
    // the letter the evening before, for anyone west of Greenwich.
    const iso = value ? new Date(`${value}T23:59:59.999Z`).toISOString() : null
    return patch(
      { expiresAt: iso },
      'expiry',
      value ? `It stops opening after ${value}.` : 'It no longer expires.',
    )
  }

  async function remove() {
    setBusy('delete')
    setFailed(false)
    setMessage('')
    try {
      const response = await fetch(`/api/letters/${letterId}`, { method: 'DELETE' })
      if (!response.ok) {
        setFailed(true)
        setMessage(`Could not delete it (${response.status}).`)
        setBusy(null)
        return
      }
      router.push('/admin')
      router.refresh()
    } catch {
      setFailed(true)
      setMessage('Could not reach the server. Nothing was deleted.')
      setBusy(null)
    }
  }

  const published = status === 'published'

  return (
    <section className="admin-controls" aria-label="Publishing">
      <div className="admin-controls-row">
        <p className="admin-controls-state">
          <span className="status" data-live={live ? 'true' : 'false'}>
            <span className="status-dot" aria-hidden="true" />
            {live ? 'live' : published ? 'expired' : 'draft'}
          </span>
          <span>
            {live
              ? 'Anyone with the link can open it.'
              : published
                ? 'Published, but past its date. Nobody can open it.'
                : 'Only you can open it.'}
          </span>
        </p>

        <div className="editor-bar">
          <Link href={`/${slug}`} className="pill" target="_blank" rel="noopener">
            Open it <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </Link>

          <button
            type="button"
            className={published ? 'pill' : 'pill pill--solid'}
            disabled={busy !== null}
            data-busy={busy === 'status' ? 'true' : 'false'}
            aria-busy={busy === 'status'}
            onClick={() =>
              patch(
                { status: published ? 'draft' : 'published' },
                'status',
                published
                  ? 'Unpublished. The link is a 404 again, photographs too.'
                  : 'Published. The link works now.',
              )
            }
          >
            {busy === 'status'
              ? published
                ? 'Unpublishing…'
                : 'Publishing…'
              : published
                ? 'Unpublish'
                : 'Publish'}
          </button>
        </div>
      </div>

      <div className="admin-controls-row">
        <div className="admin-controls-expiry">
          <label htmlFor="expiry" className="meta field-label">
            Stops opening after <span className="admin-new-optional">optional</span>
          </label>
          <div className="editor-bar">
            <input
              id="expiry"
              type="date"
              className="field admin-controls-date"
              value={expiry}
              onChange={(event) => setExpiry(event.target.value)}
            />
            <button
              type="button"
              className="pill"
              disabled={busy !== null || expiry === (expiresAt?.slice(0, 10) ?? '')}
              data-busy={busy === 'expiry' ? 'true' : 'false'}
              aria-busy={busy === 'expiry'}
              onClick={() => saveExpiry(expiry)}
            >
              {busy === 'expiry' ? 'Saving…' : 'Save date'}
            </button>
            {expiresAt && (
              <button
                type="button"
                className="pill"
                disabled={busy !== null}
                onClick={() => {
                  setExpiry('')
                  saveExpiry('')
                }}
              >
                Never expire
              </button>
            )}
          </div>
        </div>

        <div className="admin-controls-danger">
          {!confirming ? (
            <button
              type="button"
              className="pill pill--danger"
              disabled={busy !== null}
              onClick={() => setConfirming(true)}
            >
              Delete letter
            </button>
          ) : (
            <div className="admin-confirm" role="group" aria-label="Confirm delete">
              <p className="editor-hint">
                This deletes the letter, its photographs and its numbers. There
                is no undo.
              </p>
              <div className="editor-bar">
                <button
                  type="button"
                  className="pill pill--danger-solid"
                  disabled={busy !== null}
                  data-busy={busy === 'delete' ? 'true' : 'false'}
                  aria-busy={busy === 'delete'}
                  onClick={remove}
                >
                  {busy === 'delete' ? 'Deleting…' : 'Delete for good'}
                </button>
                <button
                  type="button"
                  className="pill"
                  disabled={busy === 'delete'}
                  onClick={() => setConfirming(false)}
                >
                  Keep it
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="editor-status"
        data-failed={failed ? 'true' : 'false'}
      >
        {message}
      </p>
    </section>
  )
}

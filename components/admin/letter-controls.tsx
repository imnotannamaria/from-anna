'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type Props = {
  onDirtyChange?: (dirty: boolean) => void
  title: string
  recipient: string | null
  canPublish: boolean
  hasUnsavedChanges: boolean
  letterId: string
  slug: string
  status: 'draft' | 'published'
  /** ISO string, or null when it never expires. */
  expiresAt: string | null
  /** Published and not expired: what a stranger with the link would see. */
  live: boolean
}

type Busy = 'status' | 'expiry' | 'delete' | 'details' | null

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
export function LetterControls({
  letterId,
  slug,
  status,
  expiresAt,
  live,
  title,
  recipient,
  canPublish,
  onDirtyChange,
  hasUnsavedChanges,
}: Props) {
  const router = useRouter()
  const [copying, setCopying] = useState(false)
  const [name, setName] = useState(title)
  const [to, setTo] = useState(recipient ?? '')
  const [savedDetails, setSavedDetails] = useState({
    title,
    recipient: recipient ?? '',
  })
  const detailsDirty =
    name !== savedDetails.title || to !== savedDetails.recipient
  useEffect(() => {
    onDirtyChange?.(detailsDirty)
  }, [detailsDirty, onDirtyChange])
  useEffect(() => {
    if (!detailsDirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [detailsDirty])
  async function copyLink() {
    if (copying) return
    setCopying(true)
    try {
      await navigator.clipboard.writeText(
        new URL('/' + slug, window.location.origin).href,
      )
      setFailed(false)
      setMessage('Link copied. Ready to send.')
    } catch {
      setFailed(true)
      setMessage(
        'Could not copy automatically. Open the preview and copy its address.',
      )
    } finally {
      setCopying(false)
    }
  }
  const [busy, setBusy] = useState<Busy>(null)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  // A bare `YYYY-MM-DD` from a date input, kept as text until it is sent.
  const [expiry, setExpiry] = useState(expiresAt ? expiresAt.slice(0, 10) : '')

  async function patch(
    body: Record<string, unknown>,
    kind: Busy,
    done: string,
  ) {
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
      if (kind === 'details') setSavedDetails({ title: name, recipient: to })
      setMessage(done)
      router.refresh()
    } catch {
      setFailed(true)
      setMessage(
        'Could not reach the server. Check the current state before retrying.',
      )
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
      const response = await fetch(`/api/letters/${letterId}`, {
        method: 'DELETE',
      })
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
      setMessage(
        'Could not reach the server. Refresh to check whether the letter was deleted.',
      )
      setBusy(null)
    }
  }

  const published = status === 'published'

  return (
    <section className="admin-controls" aria-label="Publishing">
      <form
        className="letter-details"
        onSubmit={(event) => {
          event.preventDefault()
          void patch(
            { title: name, recipient: to },
            'details',
            'Letter details saved. The link stays the same.',
          )
        }}
      >
        <h3>The envelope</h3>
        <div className="admin-new-fields">
          <div>
            <label className="field-label" htmlFor="letter-title">
              Title for your desk
            </label>
            <input
              id="letter-title"
              className="field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={200}
              disabled={busy !== null}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="letter-recipient">
              To <span className="admin-new-optional">optional</span>
            </label>
            <input
              id="letter-recipient"
              className="field"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              maxLength={200}
              disabled={busy !== null}
            />
          </div>
        </div>
        <button
          className="pill"
          type="submit"
          disabled={busy !== null || !detailsDirty || !name.trim()}
          data-busy={busy === 'details'}
          aria-busy={busy === 'details'}
        >
          {busy === 'details' ? 'Saving details…' : 'Save details'}
        </button>
      </form>
      <div className="admin-controls-row">
        <p className="admin-controls-state">
          <span className="status" data-live={live ? 'true' : 'false'}>
            <span className="status-dot" aria-hidden="true" />
            {live ? 'Published' : published ? 'Expired' : 'Draft'}
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
          {hasUnsavedChanges || detailsDirty ? (
            <span className="editor-hint">Save changes before previewing.</span>
          ) : (
            <Link
              href={`/${slug}`}
              className="pill"
              target="_blank"
              rel="noopener"
            >
              Preview letter <span aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </Link>
          )}
          {live && (
            <button
              type="button"
              className="pill"
              onClick={copyLink}
              disabled={copying}
              data-busy={copying}
              aria-busy={copying}
            >
              {copying ? 'Copying…' : 'Copy link'}
            </button>
          )}

          <button
            type="button"
            className={published ? 'pill' : 'pill pill--solid'}
            disabled={
              busy !== null || (!published && (!canPublish || detailsDirty))
            }
            data-busy={busy === 'status' ? 'true' : 'false'}
            aria-busy={busy === 'status'}
            onClick={() =>
              patch(
                { status: published ? 'draft' : 'published' },
                'status',
                published
                  ? 'Moved to drafts. Only you can open it.'
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
                : 'Publish letter'}
          </button>
        </div>
      </div>

      <details className="writing-extras">
        <summary>Expiry & deletion</summary>
        <div className="admin-controls-row">
          <div className="admin-controls-expiry">
            <label htmlFor="expiry" className="meta field-label">
              Stops opening after{' '}
              <span className="admin-new-optional">optional</span>
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
                disabled={
                  busy !== null || expiry === (expiresAt?.slice(0, 10) ?? '')
                }
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
              <div
                className="admin-confirm"
                role="group"
                aria-label="Confirm delete"
              >
                <p className="editor-hint">
                  This deletes the letter, its photographs and its numbers.
                  There is no undo.
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
      </details>
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

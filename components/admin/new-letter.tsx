'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

/**
 * Starting a letter.
 *
 * There was no way to do this until now: `createLetter()` existed and nothing
 * called it, so the only letter in the database had been inserted by hand
 * through Drizzle Studio.
 *
 * `title` is how I find it in this list and is never shown on the published
 * page, but the default link is made from it, so the hint says so.
 * `recipient` is shown: the reading bar says *from anna to <recipient>*.
 * The link is optional; left empty, it is made from the title and today's
 * date.
 *
 * It creates a **draft with no pages**, and goes straight to it. A letter
 * exists so photographs have somewhere to go, so the useful next screen is
 * always the one with the upload on it.
 */
export function NewLetter() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [recipient, setRecipient] = useState('')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function create(event: React.FormEvent) {
    event.preventDefault()
    if (saving) return

    setSaving(true)
    setError('')

    try {
      const response = await fetch('/api/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, recipient, slug }),
      })

      const body = await response.json().catch(() => null)

      if (!response.ok) {
        setSaving(false)
        setError(body?.error ?? `Could not create it (${response.status}).`)
        return
      }

      // Straight to the workbench: an empty letter is only useful once it has
      // photographs in it.
      router.push(`/admin/letters/${body.id}`)
    } catch {
      setSaving(false)
      setError(
        'Could not reach the server. Check your letters before trying again.',
      )
    }
  }

  if (!open) {
    return (
      <div className="editor-bar admin-new">
        <button
          type="button"
          className="pill pill--solid"
          onClick={() => setOpen(true)}
        >
          Start a letter
        </button>
      </div>
    )
  }

  return (
    <form className="admin-new admin-new--open" onSubmit={create}>
      <h2>A new letter</h2>
      <p className="editor-hint">
        Start a private draft. Next, add your photographs and make the text your
        own.
      </p>
      <div className="admin-new-fields">
        <div>
          <label htmlFor="new-title" className="meta field-label">
            Title for your desk
          </label>
          <input
            id="new-title"
            className="field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={saving}
            maxLength={200}
            required
            autoFocus
            placeholder="How you will find it again"
          />
        </div>

        <div>
          <label htmlFor="new-recipient" className="meta field-label">
            Recipient <span className="admin-new-optional">optional</span>
          </label>
          <input
            id="new-recipient"
            className="field"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            disabled={saving}
            maxLength={200}
            placeholder="Who you wrote it for"
          />
        </div>
      </div>

      <details className="admin-new-slug">
        <summary>Customize the link</summary>
        <label htmlFor="new-slug" className="meta field-label">
          Link <span className="admin-new-optional">optional</span>
        </label>
        <div className="admin-new-slug-field">
          <span className="admin-new-slug-prefix" aria-hidden="true">
            /
          </span>
          <input
            id="new-slug"
            className="field"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            disabled={saving}
            maxLength={80}
            placeholder="made from the title and today’s date"
            aria-describedby="new-slug-hint"
          />
        </div>
      </details>

      <p className="editor-hint" id="new-slug-hint">
        The title is for you, but the link is made from it unless you type one,
        so keep it something you would not mind in an address. The recipient
        shows at the top of the letter as “from anna to …”. It starts as a
        draft, which only you can open.
      </p>

      <div className="editor-bar">
        <button
          type="submit"
          className="pill pill--solid"
          disabled={saving || title.trim() === ''}
          data-busy={saving ? 'true' : 'false'}
          aria-busy={saving}
        >
          {saving ? 'Starting…' : 'Create draft'}
        </button>
        <button
          type="button"
          className="pill"
          disabled={saving}
          onClick={() => {
            setOpen(false)
            setError('')
          }}
        >
          Cancel
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="editor-status"
        data-failed={error ? 'true' : 'false'}
      >
        {error && `Failed: ${error}`}
      </p>
    </form>
  )
}

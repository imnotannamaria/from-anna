'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { renderMarkdown, wrapPassage, wrapSelection } from 'remark-scanned-page'

import { RegionPicker, type PickerPage } from '@/components/editor/region-picker'
import { HIGHLIGHT_TAGS } from '@/lib/theme/highlight-tags'
import {
  findIllegibleMarks,
  nextIllegibleMark,
} from '@/lib/transcription/illegible'
import { sheetIndexAt } from '@/lib/transcription/split'

type Props = {
  letterId: string
  initialMdContent: string
  /** The photographed sheets, for the region picker. Empty until they exist. */
  pages: PickerPage[]
}

/** Long enough that a fast typist never waits on a parse mid-word. */
const PREVIEW_DELAY_MS = 250

/**
 * The transcription editor.
 *
 * A textarea, because the markdown *is* the format: highlights live inside it
 * as directives, so anything that hides the syntax would be hiding the
 * content. The preview beside it is what makes that bearable — and it is also
 * where a malformed directive shows up, which is why there is no separate
 * validation step.
 *
 * The `[?]` jump is not a nicety. Those marks are what the model said it
 * could not read, and checking them against the photo is the step that
 * catches hallucination, which comes back plausible and survives a quick
 * reread. Hunting for them by eye is exactly the task that gets skipped.
 */
export function TranscriptionEditor({
  letterId,
  initialMdContent,
  pages,
}: Props) {
  const [value, setValue] = useState(initialMdContent)
  const [caret, setCaret] = useState(0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Parsing runs behind a delay rather than on every keystroke: a full
  // unified pipeline per character on a long letter is a visible stutter.
  const [previewSource, setPreviewSource] = useState(initialMdContent)
  useEffect(() => {
    const timer = setTimeout(() => setPreviewSource(value), PREVIEW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [value])

  const html = useMemo(() => renderMarkdown(previewSource, {
    knownTags: HIGHLIGHT_TAGS,
  }), [previewSource])

  const dirty = value !== initialMdContent
  const marks = findIllegibleMarks(value)

  // Closing the tab mid-edit loses the corrections, and there is no draft
  // anywhere else. The browser's own prompt is enough.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function applyHighlight(tag: string) {
    const textarea = textareaRef.current
    if (!textarea) return

    const result = wrapSelection(
      value,
      textarea.selectionStart,
      textarea.selectionEnd,
      tag,
    )

    if (result.status === 'refused') {
      setFailed(true)
      setMessage(result.message)
      return
    }

    setFailed(false)
    setMessage('')
    setValue(result.value)

    // The DOM value updates on the next render, so the caret is restored
    // after it, not before.
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd)
    })
  }

  function applyPassage(at?: string) {
    const textarea = textareaRef.current
    if (!textarea) return

    const result = wrapPassage(
      value,
      textarea.selectionStart,
      textarea.selectionEnd,
      at,
    )

    if (result.status === 'refused') {
      setFailed(true)
      setMessage(result.message)
      return
    }

    setFailed(false)
    setMessage(at ? `Passage marked at ${at}.` : 'Passage marked.')
    setValue(result.value)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd)
    })
  }

  function jumpToNextMark() {
    const textarea = textareaRef.current
    if (!textarea) return

    const mark = nextIllegibleMark(value, textarea.selectionEnd)
    if (!mark) return

    textarea.focus()
    textarea.setSelectionRange(mark.start, mark.end)

    const ratio = mark.start / Math.max(1, value.length)
    textarea.scrollTop = ratio * textarea.scrollHeight - textarea.clientHeight / 2
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Ctrl/Cmd+Shift+H. Deliberately not Cmd+E or Cmd+H, which are taken by
    // the browser and the OS. The buttons below do the same thing, so the
    // shortcut is a shortcut and never the only route.
    if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
      const key = event.key.toLowerCase()
      if (key === 'h') {
        event.preventDefault()
        applyHighlight(HIGHLIGHT_TAGS[0])
      }
    }
  }

  async function save() {
    setSaving(true)
    setFailed(false)
    setMessage('Saving…')

    try {
      const response = await fetch(`/api/letters/${letterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mdContent: value }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setFailed(true)
        setMessage(body?.error ?? `Could not save (${response.status}).`)
        return
      }

      setMessage('Saved.')
      // Deliberately no router.refresh(): re-rendering the server component
      // would hand the textarea a new `initialMdContent` and fight whatever
      // is being typed.
    } catch {
      setFailed(true)
      setMessage('Could not reach the server. Nothing was saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-section">
      <div className="admin-card-head">
        <label htmlFor="md" className="meta">
          Transcription
        </label>
        <span className="meta">
          {dirty ? 'Unsaved changes' : 'Saved'}
        </span>
      </div>

      <div className="editor-bar">
        <span className="meta">Highlight as</span>
        {HIGHLIGHT_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            data-tag={tag}
            onClick={() => applyHighlight(tag)}
            className="tag-button"
          >
            {tag}
          </button>
        ))}
        <span className="meta">or ⌘⇧H</span>
      </div>

      <div className="editor-grid">
        <textarea
          ref={textareaRef}
          id="md"
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setCaret(event.target.selectionStart)
          }}
          onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          className="editor-surface"
        />

        <div
          aria-label="Preview"
          className="letter-prose editor-preview"
          data-revealed="true"
          // Safe: sanitized by the schema in the package.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      <div className="editor-bar">
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="pill"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>

        <button
          type="button"
          onClick={jumpToNextMark}
          disabled={marks.length === 0}
          className="pill"
        >
          Next [?]
        </button>

        <span className="count-chip">
          {marks.length === 0
            ? 'nothing unreadable'
            : `${marks.length} to check against the photo`}
        </span>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="editor-status"
        data-failed={failed ? 'true' : 'false'}
      >
        {failed && 'Failed: '}
        {message}
      </p>

      {pages.length > 0 && (
        <RegionPicker
          pages={pages}
          // Which photograph to show is decided by the `---` before the
          // caret, which is the same separator that paginates the letter.
          sheetIndex={sheetIndexAt(value, caret)}
          onMark={applyPassage}
        />
      )}
    </section>
  )
}

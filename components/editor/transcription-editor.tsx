'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { HIGHLIGHT_TAGS } from '@/components/letter/scanned-page'
import { renderMarkdown } from '@/lib/markdown/render'
import { wrapSelection } from '@/lib/markdown/wrap-selection'
import {
  findIllegibleMarks,
  nextIllegibleMark,
} from '@/lib/transcription/illegible'

type Props = {
  letterId: string
  initialMdContent: string
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
export function TranscriptionEditor({ letterId, initialMdContent }: Props) {
  const [value, setValue] = useState(initialMdContent)
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
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label htmlFor="md" className="font-medium">
          Transcription
        </label>
        <span className="text-sm opacity-70">
          {dirty ? 'Unsaved changes' : 'No unsaved changes'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs opacity-70">Highlight selection as</span>
        {HIGHLIGHT_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => applyHighlight(tag)}
            className="rounded border px-2 py-1 text-xs"
          >
            {tag}
          </button>
        ))}
        <span className="text-xs opacity-60">or ⌘⇧H for the first</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <textarea
          ref={textareaRef}
          id="md"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          rows={20}
          className="w-full rounded-lg border p-3 font-mono text-sm"
        />

        <div
          aria-label="Preview"
          className="letter-prose min-h-40 rounded-lg border p-3"
          // Safe: sanitized by the schema in lib/markdown/render.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>

        <button
          type="button"
          onClick={jumpToNextMark}
          disabled={marks.length === 0}
          className="rounded border px-4 py-2 disabled:opacity-50"
        >
          Go to next [?]
        </button>

        <span className="text-sm opacity-80">
          {marks.length === 0
            ? 'Nothing left marked unreadable.'
            : `${marks.length} passage${marks.length === 1 ? '' : 's'} the model could not read. Check each one against the photo.`}
        </span>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`text-sm ${failed ? 'font-medium' : 'opacity-80'}`}
      >
        {failed && 'Failed: '}
        {message}
      </p>
    </section>
  )
}

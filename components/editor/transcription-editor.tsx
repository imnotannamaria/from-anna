'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { renderMarkdown, wrapSelection, wrapTheme } from 'remark-scanned-page'

import { HIGHLIGHT_TAGS } from '@/lib/theme/highlight-tags'
import { normaliseCase } from '@/lib/transcription/normalize-case'
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

  // What the server holds, as far as this editor knows: the text it loaded,
  // or the text it last saved. "Unsaved" is measured against this and not
  // against the prop, which only changes on a refresh. Measured against the
  // prop, a saved letter kept saying "Unsaved changes" and kept warning on
  // closing the tab.
  const [saved, setSaved] = useState(initialMdContent)
  const [fromServer, setFromServer] = useState(initialMdContent)

  // The server handed over something new: a transcription seeded the letter,
  // or the page refreshed after publishing. It replaces the text only when
  // nothing here is unsaved. The editor used to be remounted on every
  // refresh instead, which threw away whatever was being typed the moment
  // anything else on the page was clicked.
  if (initialMdContent !== fromServer) {
    setFromServer(initialMdContent)
    setSaved(initialMdContent)
    if (value === saved) setValue(initialMdContent)
  }

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

  const dirty = value !== saved
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

  /*
    The bracket down the side, with a name beside it. This button used to
    group lines into a `:::passage`, which drew nothing once the passage
    numbers went, so it looked broken. A theme is the grouping you can see.
  */
  function applyTheme() {
    const textarea = textareaRef.current
    if (!textarea) return

    const result = wrapTheme(
      value,
      textarea.selectionStart,
      textarea.selectionEnd,
    )

    if (result.status === 'refused') {
      setFailed(true)
      setMessage(result.message)
      return
    }

    setFailed(false)
    setMessage('Grouped. Type the theme’s name between the quotes.')
    setValue(result.value)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd)
    })
  }

  function applyNormalise() {
    const next = normaliseCase(value)
    if (next === value) {
      setFailed(false)
      setMessage('Nothing to change: it is already in ordinary case.')
      return
    }
    setValue(next)
    setFailed(false)
    // It cannot know which words are names. Say so, every time.
    setMessage(
      'Capitals normalised. Check names and places: it can’t tell those apart. Nothing is saved until you save.',
    )
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
    // What was sent, not what is in the box when the answer comes back:
    // anything typed while saving is still unsaved.
    const sent = value
    setSaving(true)
    setFailed(false)
    setMessage('Saving…')

    try {
      const response = await fetch(`/api/letters/${letterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mdContent: sent }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setFailed(true)
        setMessage(body?.error ?? `Could not save (${response.status}).`)
        return
      }

      setSaved(sent)
      setMessage('Saved.')
      // No router.refresh(): nothing else on the page depends on the text.
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
        <button type="button" onClick={applyTheme} className="pill">
          Group under a theme
        </button>
        {/*
          On the edited text, never in the prompt: the raw transcription is
          what was on the page, and a letter written in capitals was written
          in capitals.
        */}
        <button type="button" onClick={applyNormalise} className="pill">
          Normalise capitals
        </button>
      </div>

      <div className="editor-grid">
        <textarea
          ref={textareaRef}
          id="md"
          value={value}
          onChange={(event) => setValue(event.target.value)}
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
          data-busy={saving ? 'true' : 'false'}
          aria-busy={saving}
          className="pill pill--solid"
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

    </section>
  )
}

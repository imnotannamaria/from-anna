'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  changeHighlight,
  renderEditorMarkdown,
  wrapSelection,
  wrapTheme,
} from 'remark-scanned-page'
import { PhotoFrame } from '@/components/ui/photo-frame'
import { HIGHLIGHT_TAGS } from '@/lib/theme/highlight-tags'
import { normaliseCase } from '@/lib/transcription/normalize-case'
import {
  findIllegibleMarks,
  nextIllegibleMark,
} from '@/lib/transcription/illegible'

type Props = {
  letterId: string
  initialMdContent: string
  photos?: React.ReactNode[]
  published?: boolean
  onDirtyChange?: (dirty: boolean) => void
  onSaved?: (content: string) => void
}
type Selection = { start: number; end: number; text: string; mark: boolean }

/** Markdown stays authoritative; the package supplies exact visual-edit offsets. */
export function TranscriptionEditor({
  letterId,
  initialMdContent,
  photos = [],
  published = false,
  onDirtyChange,
  onSaved,
}: Props) {
  const [value, setValue] = useState(initialMdContent)
  const [saved, setSaved] = useState(initialMdContent)
  const [fromServer, setFromServer] = useState(initialMdContent)
  const [past, setPast] = useState<string[]>([])
  const [future, setFuture] = useState<string[]>([])
  const [mode, setMode] = useState<'write' | 'mark'>('write')
  const [selection, setSelection] = useState<Selection | null>(null)
  const [themeName, setThemeName] = useState('')
  const [themeOpen, setThemeOpen] = useState(false)
  const [photo, setPhoto] = useState(0)
  const [showPhoto, setShowPhoto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const saveLock = useRef(false)
  const stickyRef = useRef<HTMLDivElement>(null)

  // The sticky block changes height — a hint appears, the theme form opens,
  // the toolbar wraps — so its height is measured, never assumed.
  useEffect(() => {
    const bar = stickyRef.current
    const host = bar?.parentElement
    if (!bar || !host) return
    const observer = new ResizeObserver(() => {
      host.style.setProperty('--desk-sticky-h', `${bar.offsetHeight}px`)
    })
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])

  if (initialMdContent !== fromServer) {
    setFromServer(initialMdContent)
    setSaved(initialMdContent)
    if (value === saved) {
      setValue(initialMdContent)
      setPast([])
      setFuture([])
      setSelection(null)
    }
  }
  const [previewSource, setPreviewSource] = useState(initialMdContent)
  useEffect(() => {
    const timer = setTimeout(() => setPreviewSource(value), 250)
    return () => clearTimeout(timer)
  }, [value])
  const html = useMemo(
    () => renderEditorMarkdown(previewSource, { knownTags: HIGHLIGHT_TAGS }),
    [previewSource],
  )
  const dirty = value !== saved
  const marks = findIllegibleMarks(value)
  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function edit(next: string) {
    if (next === value) return
    setPast((items) => [...items.slice(-59), value])
    setFuture([])
    setValue(next)
    setSelection(null)
    setFailed(false)
    setMessage('')
  }
  function undo() {
    const previous = past.at(-1)
    if (previous === undefined) return
    setFuture((items) => [...items, value])
    setPast(past.slice(0, -1))
    setValue(previous)
    setSelection(null)
  }
  function redo() {
    const next = future.at(-1)
    if (next === undefined) return
    setPast((items) => [...items, value])
    setFuture(future.slice(0, -1))
    setValue(next)
    setSelection(null)
  }
  function selectSource(start: number, end: number) {
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(start, end)
    })
  }
  function captureText() {
    const input = textareaRef.current
    if (!input) return
    const start = input.selectionStart,
      end = input.selectionEnd
    setSelection(
      start === end
        ? null
        : { start, end, text: value.slice(start, end), mark: false },
    )
  }
  function captureVisual() {
    if (value !== previewSource) return
    const current = window.getSelection()
    if (!current || current.isCollapsed || !current.rangeCount) return
    const range = current.getRangeAt(0)
    if (!previewRef.current?.contains(range.commonAncestorContainer)) return
    const startNode = range.startContainer,
      endNode = range.endContainer
    const first = startNode.parentElement?.closest<HTMLElement>(
      '[data-source-start]',
    )
    const last = endNode.parentElement?.closest<HTMLElement>(
      '[data-source-start]',
    )
    if (
      startNode.nodeType !== Node.TEXT_NODE ||
      endNode.nodeType !== Node.TEXT_NODE ||
      !first ||
      !last
    ) {
      setSelection(null)
      setMessage(
        'Select the words themselves. For code or escaped characters, use Edit text.',
      )
      return
    }
    const start = Number(first.dataset.sourceStart) + range.startOffset
    const end = Number(last.dataset.sourceStart) + range.endOffset
    const text = range.toString()
    if (value.slice(start, end) !== text || /\n\s*\n/.test(text)) {
      setSelection(null)
      setMessage(
        'Select one passage of plain text at a time. Use Edit text for selections across formatting.',
      )
      return
    }
    setSelection({ start, end, text, mark: false })
    setMessage('')
  }
  function highlight(tag: string | null) {
    if (!selection) {
      setMessage('Select a few words first, then choose a colour.')
      return
    }
    if (selection.mark) {
      const next = changeHighlight(value, selection.start, selection.end, tag)
      if (next !== null) {
        edit(next)
        setMessage(
          tag ? 'Highlight updated.' : 'Highlight removed. The words are kept.',
        )
      }
      return
    }
    if (!tag) return
    const result = wrapSelection(value, selection.start, selection.end, tag)
    if (result.status === 'refused') {
      setFailed(true)
      setMessage(result.message)
      return
    }
    edit(result.value)
    setMessage('Highlight added. You can undo it or select another passage.')
    if (mode === 'write')
      selectSource(result.selectionStart, result.selectionEnd)
    else window.getSelection()?.removeAllRanges()
  }
  function groupTheme(event: React.FormEvent) {
    event.preventDefault()
    if (!selection || !themeName.trim()) return
    const result = wrapTheme(
      value,
      selection.start,
      selection.end,
      themeName.trim(),
    )
    if (result.status === 'refused') {
      setFailed(true)
      setMessage(result.message)
      return
    }
    edit(result.value)
    setThemeOpen(false)
    setThemeName('')
    setMessage('Theme added around the selected paragraphs.')
  }
  function jumpToMark() {
    const mark = nextIllegibleMark(
      value,
      textareaRef.current?.selectionEnd ?? 0,
    )
    if (!mark) return
    setMode('write')
    selectSource(mark.start, mark.end)
    requestAnimationFrame(() => {
      const input = textareaRef.current
      if (input)
        input.scrollTop =
          (mark.start / Math.max(1, value.length)) * input.scrollHeight -
          input.clientHeight / 2
    })
  }
  async function save() {
    if (saveLock.current || !dirty) return
    saveLock.current = true
    const sent = value
    setSaving(true)
    setFailed(false)
    setMessage('Saving your changes…')
    try {
      const response = await fetch(`/api/letters/${letterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mdContent: sent }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setFailed(true)
        setMessage(
          body?.error ??
            'Could not save. Your edits are still here; try again.',
        )
        return
      }
      setSaved(sent)
      onSaved?.(sent)
      setMessage('Changes saved.')
    } catch {
      setFailed(true)
      setMessage(
        'Connection lost. Your edits are still here. Reconnect and try Save changes again.',
      )
    } finally {
      saveLock.current = false
      setSaving(false)
    }
  }

  return (
    <section
      className="writing-editor"
      aria-label="Letter editor"
      onKeyDown={(event) => {
        if (!(event.ctrlKey || event.metaKey)) return
        const key = event.key.toLowerCase()
        if (key === 's') {
          event.preventDefault()
          void save()
        }
        if (key === 'z' && !(event.target instanceof HTMLInputElement)) {
          event.preventDefault()
          if (event.shiftKey) redo()
          else undo()
        }
        if (key === 'h' && event.shiftKey) {
          event.preventDefault()
          highlight('important')
        }
      }}
    >
      <div className="writing-tools">
        <div className="segmented" role="group" aria-label="Editing mode">
          <button
            className="pill"
            type="button"
            aria-pressed={mode === 'write'}
            onClick={() => {
              setMode('write')
              setSelection(null)
            }}
          >
            Edit text
          </button>
          <button
            className="pill"
            type="button"
            aria-pressed={mode === 'mark'}
            onClick={() => {
              setMode('mark')
              setSelection(null)
              setPreviewSource(value)
            }}
          >
            Mark & preview
          </button>
        </div>
        <div className="editor-bar">
          <button
            className="pill"
            type="button"
            disabled={!past.length}
            onClick={undo}
          >
            Undo
          </button>
          <button
            className="pill"
            type="button"
            disabled={!future.length}
            onClick={redo}
          >
            Redo
          </button>
          {photos.length > 0 && (
            <button
              className="pill photo-reference-toggle"
              type="button"
              aria-expanded={showPhoto}
              onClick={() => setShowPhoto(!showPhoto)}
            >
              {showPhoto ? 'Hide photo' : 'Show photo'}
            </button>
          )}
        </div>
      </div>
      {/*
        One sticky block, not two. The save bar and the mark toolbar used to
        stick separately at guessed offsets (0.5rem and 7rem), so the text
        showed through the gap between them and the reference photograph,
        stuck at the same 7rem, sat behind the toolbar. Its real height is
        measured below and the photograph sticks under it.
      */}
      <div className="writing-sticky" ref={stickyRef}>
        <div className="writing-savebar" data-dirty={dirty}>
          <div>
            <span className="save-state" data-dirty={dirty}>
              {saving
                ? 'Saving…'
                : dirty
                  ? 'Unsaved changes'
                  : 'All changes saved'}
            </span>
            <p className="editor-hint">
              {published
                ? 'Saving updates the letter your recipient can read.'
                : 'Only you can see this draft.'}
            </p>
          </div>
          <button
            className="pill pill--solid"
            type="button"
            disabled={saving || !dirty}
            data-busy={saving}
            aria-busy={saving}
            onClick={save}
          >
            {/* Disabled with nothing to save, and it says so: a solid button
                that reads "Save changes" but will not click looks broken. */}
            {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </button>
        </div>
        <div className="mark-toolbar" aria-label="Mark selected words">
          <span className="editor-hint">
            {selection?.mark
              ? 'Selected highlight'
              : selection
                ? 'Selected words'
                : 'Select words to mark'}
          </span>
          {HIGHLIGHT_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className="pill tag-button"
              data-tag={tag}
              disabled={
                !selection || (value !== previewSource && mode === 'mark')
              }
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => highlight(tag)}
            >
              <span className="tag-swatch" aria-hidden="true" />
              {tag === 'important'
                ? 'Important'
                : tag === 'note'
                  ? 'Note'
                  : 'Question'}
            </button>
          ))}
          {selection?.mark ? (
            <button
              className="pill"
              type="button"
              onClick={() => highlight(null)}
            >
              Remove highlight
            </button>
          ) : (
            <button
              className="pill"
              type="button"
              disabled={!selection}
              onClick={() => setThemeOpen(!themeOpen)}
            >
              Group paragraphs
            </button>
          )}
        </div>
        {themeOpen && (
          <form className="theme-form" onSubmit={groupTheme}>
            <label htmlFor="theme-name">Name this theme</label>
            <input
              id="theme-name"
              className="field"
              value={themeName}
              onChange={(event) => setThemeName(event.target.value)}
              maxLength={100}
              required
              placeholder="For example: a small thing to remember"
            />
            <button
              className="pill pill--solid"
              disabled={!selection}
              type="submit"
            >
              Add theme
            </button>
            <button
              className="pill"
              type="button"
              onClick={() => setThemeOpen(false)}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
      <p className="editor-status" role="status" data-failed={failed}>
        {message}
      </p>
      {marks.length > 0 && (
        <div className="review-notice">
          <span>
            {marks.length} unclear {marks.length === 1 ? 'word' : 'words'} to
            check against the photo.
          </span>
          <button className="pill" type="button" onClick={jumpToMark}>
            Review next [?]
          </button>
        </div>
      )}
      <div className="writing-grid" data-has-photos={photos.length > 0}>
        <div className="writing-page">
          <div className="writing-page-heading">
            <span className="meta">
              {mode === 'write' ? 'Your transcription' : 'Your letter'}
            </span>
            <span className="meta">
              {value.trim() ? value.trim().split(/\s+/).length : 0} words
            </span>
          </div>
          <textarea
            hidden={mode !== 'write'}
            ref={textareaRef}
            id="md"
            aria-label="Your transcription"
            className="writing-source"
            value={value}
            onChange={(event) => edit(event.target.value)}
            onSelect={captureText}
            spellCheck
            placeholder="Your transcription will appear here. You can also type it yourself."
            aria-describedby="writing-help"
          />
          <div
            hidden={mode !== 'mark'}
            ref={previewRef}
            className="letter-prose writing-preview"
            data-revealed="true"
            onMouseUp={captureVisual}
            onTouchEnd={captureVisual}
            onKeyUp={captureVisual}
            tabIndex={0}
            aria-label="Select words to highlight; use the highlights list below to edit existing marks"
            onClick={(event) => {
              const target = (event.target as HTMLElement).closest<HTMLElement>(
                'mark[data-mark-start]',
              )
              if (
                target &&
                window.getSelection()?.isCollapsed &&
                value === previewSource
              )
                setSelection({
                  start: Number(target.dataset.markStart),
                  end: Number(target.dataset.markEnd),
                  text: target.textContent ?? '',
                  mark: true,
                })
              if ((event.target as HTMLElement).closest('a'))
                event.preventDefault()
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <p className="editor-hint" id="writing-help">
            {mode === 'write'
              ? 'Correct the words here. Separate sheets with a line containing ---. Switch to Mark & preview to see the finished letter.'
              : 'Select words and choose a colour above. Click a highlight to change or remove it.'}
          </p>
        </div>
        {photos.length > 0 && (
          <aside
            className="writing-reference"
            data-show={showPhoto}
            aria-label="Original photograph"
          >
            <div className="writing-page-heading">
              <span className="meta">Original · sheet {photo + 1}</span>
              {/* Pills, not a native `<select>`: a letter is two or three
                  sheets, and a menu for three numbers hides the choice behind
                  a click and draws in the browser's style, not this one. */}
              {photos.length > 1 && (
                <div
                  className="segmented"
                  role="group"
                  aria-label="Reference sheet"
                >
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className="pill pill--icon"
                      aria-pressed={photo === i}
                      aria-label={`Sheet ${i + 1} of ${photos.length}`}
                      onClick={() => setPhoto(i)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="reference-photo">
              {/* Keyed, so choosing another sheet starts its own loading
                  state instead of inheriting "loaded" from the last one. */}
              <PhotoFrame key={photo} warm>
                {photos[photo] ?? photos[0]}
              </PhotoFrame>
            </div>
            <p className="editor-hint">
              Compare the handwriting while you correct the text.
            </p>
          </aside>
        )}
      </div>
      <details className="writing-extras">
        <summary>Highlights & text tools</summary>
        <p className="editor-hint">
          Every highlight can also be selected here with the keyboard.
        </p>
        <div className="highlight-list">
          {[
            ...html.matchAll(
              /<mark\b[^>]*data-mark-start="(\d+)"[^>]*data-mark-end="(\d+)"[^>]*>([\s\S]*?)<\/mark>/g,
            ),
          ].map((match, index) => (
            <button
              className="pill"
              type="button"
              key={match[1]}
              onClick={() => {
                setSelection({
                  start: Number(match[1]),
                  end: Number(match[2]),
                  text: '',
                  mark: true,
                })
                setMode('mark')
              }}
            >
              Highlight {index + 1} · edit or remove
            </button>
          ))}
        </div>
        <button
          className="pill"
          type="button"
          onClick={() => {
            const next = normaliseCase(value)
            edit(next)
            setMessage(
              'Capitalization adjusted. Check names and places before saving. You can undo this change.',
            )
          }}
        >
          Convert ALL CAPS to sentence case
        </button>
        <p className="editor-hint">
          Ctrl / ⌘ S to save · Ctrl / ⌘ Z to undo · Ctrl / ⌘ Shift H to
          highlight.
        </p>
      </details>
    </section>
  )
}

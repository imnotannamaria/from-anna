'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  MAX_PAGES_PER_LETTER,
  type ProcessedImage,
  processImages,
} from '@/lib/images/process'

type Item = {
  key: string
  name: string
  status: 'pending' | 'processing' | 'ready' | 'failed'
  error?: string
  image?: ProcessedImage
  previewUrl?: string
  alt: string
  /** Why this one did not go up, when it was the one that stopped the batch. */
  uploadError?: string
}

type Props = {
  letterId: string
  existingPageCount: number
}

const STATE_LABEL: Record<Item['status'], string> = {
  pending: 'waiting',
  processing: 'preparing',
  ready: 'ready',
  failed: 'couldn’t open',
}

/**
 * Adding photographs to a letter.
 *
 * Drop them on the box or pick them; either way they are resized and
 * re-encoded here, in the browser, before anything leaves the tab. A HEIC
 * straight off an iPhone is converted on the way — that is our job, not the
 * person uploading's.
 *
 * Every photo gets its own card with its own state, because one spinner for
 * the lot hides which of five photos failed. And every one needs alt text
 * before anything uploads: the transcription is the letter's content, and the
 * alt text is what describes the photograph itself.
 */
export function PageUploader({ letterId, existingPageCount }: Props) {
  const [items, setItems] = useState<Item[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Previews hold the processed blobs open. Five of them is real memory on a
  // phone, so they are revoked when the component goes away.
  const previewUrls = useRef<string[]>([])
  useEffect(() => {
    const urls = previewUrls.current
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const remaining = MAX_PAGES_PER_LETTER - existingPageCount

  const onSelect = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return

      const files = Array.from(fileList)
      setFailed(false)

      if (files.length > remaining) {
        setFailed(true)
        setMessage(
          `This letter has room for ${remaining} more page${remaining === 1 ? '' : 's'}, and you picked ${files.length}.`,
        )
        return
      }

      // Order comes from selection order: filenames off a phone do not sort
      // reliably.
      setItems(
        files.map((file, i) => ({
          key: `${Date.now()}-${i}-${file.name}`,
          name: file.name,
          status: i === 0 ? 'processing' : 'pending',
          alt: '',
        })),
      )
      setMessage(`Preparing ${files.length} photo${files.length === 1 ? '' : 's'}…`)

      let done = 0
      await processImages(files, (result) => {
        done += 1
        setItems((current) =>
          current.map((item, i) => {
            // The next one in line is the one being worked on now.
            if (i === result.index + 1 && item.status === 'pending') {
              return { ...item, status: 'processing' }
            }
            if (i !== result.index) return item
            if (result.status === 'failed') {
              return { ...item, status: 'failed', error: result.error.message }
            }
            const previewUrl = URL.createObjectURL(result.image.blob)
            previewUrls.current.push(previewUrl)
            return { ...item, status: 'ready', image: result.image, previewUrl }
          }),
        )
        setMessage(`Prepared ${done} of ${files.length}.`)
      })

      setMessage('Add a short description to each one, then upload.')
    },
    [remaining],
  )

  const ready = items.filter((item) => item.status === 'ready')
  const anyFailed = items.some((item) => item.status === 'failed')
  const everyAltFilled = ready.every((item) => item.alt.trim() !== '')
  const canUpload =
    ready.length > 0 && everyAltFilled && !uploading && !anyFailed

  function clear() {
    setItems([])
    setMessage('')
    setFailed(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  /** Upload one card. Returns what went wrong, or null when it went up. */
  async function uploadOne(item: Item): Promise<string | null> {
    if (!item.image) return 'That photo is not ready yet.'

    const form = new FormData()
    form.append('page', item.image.blob, `${item.name}.jpg`)
    // The same photograph again, small enough for a phone. Both go up
    // together: a page with only one of them cannot offer the browser a
    // choice, and half a letter able to choose is worse than none of it.
    form.append('screen', item.image.screen.blob, `${item.name}-screen.jpg`)
    form.append('alt', item.alt.trim())
    form.append('width', String(item.image.width))
    form.append('height', String(item.image.height))
    form.append('screenWidth', String(item.image.screen.width))

    try {
      const response = await fetch(`/api/letters/${letterId}/pages`, {
        method: 'POST',
        body: form,
      })
      if (response.ok) return null

      const body = await response.json().catch(() => null)
      return body?.error ?? `The upload was refused (${response.status}).`
    } catch {
      // A network failure is a different problem from a rejection, and the
      // message has to say which.
      return 'Could not reach the server. Check your connection and try again.'
    }
  }

  async function onUpload() {
    setUploading(true)
    setFailed(false)
    setItems((current) => current.map((item) => ({ ...item, uploadError: undefined })))

    // One photograph per request, in order. A Vercel Function refuses a body
    // over 4.5MB, and three sheets at 2400px can pass that together when
    // none of them does alone. It also means a failure belongs to one card
    // rather than to the whole batch.
    const queue = ready
    const done = new Set<string>()
    let error: string | null = null

    for (const [i, item] of queue.entries()) {
      setMessage(`Uploading ${i + 1} of ${queue.length}…`)
      error = await uploadOne(item)
      if (error) break
      done.add(item.key)
    }

    setUploading(false)

    if (error) {
      const reason = error
      const failedKey = queue[done.size]?.key
      setFailed(true)
      setMessage(done.size > 0 ? `${done.size} uploaded, then: ${reason}` : reason)
      // What went up stays up and leaves the list, so what is left on screen
      // is exactly what still has to go.
      setItems((current) =>
        current
          .filter((item) => !done.has(item.key))
          .map((item) =>
            item.key === failedKey ? { ...item, uploadError: reason } : item,
          ),
      )
    } else {
      setItems([])
      if (inputRef.current) inputRef.current.value = ''
      setMessage(`Uploaded ${done.size} photo${done.size === 1 ? '' : 's'}.`)
    }

    // `existingPageCount` comes from the server. Without this the remaining
    // count stays stale and the form would offer room the server refuses.
    if (done.size > 0) router.refresh()
  }

  if (remaining <= 0 && items.length === 0) {
    return (
      <p className="editor-hint">
        This letter has all {MAX_PAGES_PER_LETTER} pages it can hold.
      </p>
    )
  }

  return (
    <div className="upload">
      <label
        className="upload-drop"
        data-dragging={dragging ? 'true' : 'false'}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          if (!uploading) onSelect(event.dataTransfer.files)
        }}
      >
        {/*
          Visually hidden, not `display: none`: it stays focusable, so the box
          is reachable by keyboard and a screen reader announces a file input.
          Dropping is the fast route and never the only one.
        */}
        <input
          ref={inputRef}
          id="pages"
          type="file"
          multiple
          // `.heic` spelled out: desktop Chrome does not count it as image/*.
          accept="image/*,.heic,.heif"
          disabled={uploading}
          onChange={(event) => onSelect(event.target.files)}
          className="sr-only"
        />
        <span className="upload-drop-title">
          Drop photos here, or <u>choose them</u>
        </span>
        <span className="upload-drop-hint">
          Up to {remaining} more · straight off the phone is fine, HEIC included
        </span>
      </label>

      {items.length > 0 && (
        <ol className="upload-grid">
          {items.map((item, index) => (
            <li key={item.key} className="upload-card" data-status={item.status}>
              <div className="upload-card-head">
                <span className="upload-card-title">
                  Page {existingPageCount + index + 1}
                </span>
                <span className="upload-card-state">{STATE_LABEL[item.status]}</span>
              </div>

              <div className="upload-card-photo">
                {item.previewUrl ? (
                  // A blob URL for a local preview that never leaves the tab.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.previewUrl}
                    alt=""
                    width={item.image?.width}
                    height={item.image?.height}
                  />
                ) : (
                  <span className="skeleton upload-card-skeleton" aria-hidden="true" />
                )}
              </div>

              {item.status === 'failed' && (
                <p className="upload-card-error">{item.error}</p>
              )}

              {item.uploadError && (
                <p className="upload-card-error">{item.uploadError}</p>
              )}

              {item.status === 'ready' && (
                <div>
                  <label htmlFor={`alt-${item.key}`} className="meta field-label">
                    Describe the photo
                  </label>
                  <input
                    id={`alt-${item.key}`}
                    type="text"
                    required
                    value={item.alt}
                    placeholder="A notebook page in blue ink"
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((other, i) =>
                          i === index ? { ...other, alt: event.target.value } : other,
                        ),
                      )
                    }
                    className="field"
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {/* Progress is announced, not just drawn. */}
      <p
        role="status"
        aria-live="polite"
        className="editor-status"
        data-failed={failed ? 'true' : 'false'}
      >
        {message}
      </p>

      {items.length > 0 && (
        <div className="editor-bar">
          <button
            type="button"
            onClick={onUpload}
            disabled={!canUpload}
            data-busy={uploading ? 'true' : 'false'}
            aria-busy={uploading}
            className="pill pill--solid"
          >
            {uploading
              ? 'Uploading…'
              : `Upload ${ready.length} photo${ready.length === 1 ? '' : 's'}`}
          </button>
          <button
            type="button"
            className="pill"
            onClick={clear}
            disabled={uploading}
          >
            {anyFailed ? 'Start over' : 'Clear'}
          </button>
          {anyFailed && (
            <span className="editor-hint">
              Remove the one that couldn’t open by starting over without it.
            </span>
          )}
        </div>
      )}
    </div>
  )
}

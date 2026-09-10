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
}

type Props = {
  letterId: string
  existingPageCount: number
}

export function PageUploader({ letterId, existingPageCount }: Props) {
  const [items, setItems] = useState<Item[]>([])
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
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

      if (files.length > remaining) {
        setMessage(
          `This letter has room for ${remaining} more page${remaining === 1 ? '' : 's'}. You picked ${files.length}.`,
        )
        return
      }

      // Order comes from selection order: filenames off a phone do not sort
      // reliably.
      setItems(
        files.map((file, i) => ({
          key: `${i}-${file.name}`,
          name: file.name,
          status: 'pending',
          alt: '',
        })),
      )
      setMessage(`Processing ${files.length} page${files.length === 1 ? '' : 's'}…`)

      let done = 0
      await processImages(files, (result) => {
        done += 1
        setItems((current) =>
          current.map((item, i) => {
            if (i !== result.index) return item
            if (result.status === 'failed') {
              return { ...item, status: 'failed', error: result.error.message }
            }
            const previewUrl = URL.createObjectURL(result.image.blob)
            previewUrls.current.push(previewUrl)
            return {
              ...item,
              status: 'ready',
              image: result.image,
              previewUrl,
            }
          }),
        )
        setMessage(`Processed ${done} of ${files.length}.`)
      })

      setMessage(`Finished processing ${files.length} page${files.length === 1 ? '' : 's'}.`)
    },
    [remaining],
  )

  const ready = items.filter((item) => item.status === 'ready')
  const everyAltFilled = ready.every((item) => item.alt.trim() !== '')
  const canUpload =
    ready.length > 0 && everyAltFilled && !uploading && ready.length === items.length

  async function onUpload() {
    setUploading(true)
    setMessage('Uploading…')

    const form = new FormData()
    for (const item of ready) {
      if (!item.image) continue
      form.append('page', item.image.blob, `${item.name}.jpg`)
      // The same photograph again, small enough for a phone. Both go up
      // together: a page with only one of them cannot offer the browser a
      // choice, and half a letter able to choose is worse than none of it.
      form.append('screen', item.image.screen.blob, `${item.name}-screen.jpg`)
      form.append('alt', item.alt.trim())
      form.append('width', String(item.image.width))
      form.append('height', String(item.image.height))
      form.append('screenWidth', String(item.image.screen.width))
    }

    try {
      const response = await fetch(`/api/letters/${letterId}/pages`, {
        method: 'POST',
        body: form,
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        setMessage(body?.error ?? `Upload failed (${response.status}).`)
        return
      }

      setMessage('Pages uploaded.')
      setItems([])
      if (inputRef.current) inputRef.current.value = ''
      // `existingPageCount` comes from the server. Without this the remaining
      // count stays stale and the form would offer room the server refuses.
      router.refresh()
    } catch {
      // A network failure is a different problem from a rejection, and the
      // message has to say which.
      setMessage('Could not reach the server. Check your connection and try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="admin-section">
      <div className="flex flex-col gap-2">
        <label htmlFor="pages" className="meta field-label">
          Photographed pages
        </label>
        <input
          ref={inputRef}
          id="pages"
          name="pages"
          type="file"
          multiple
          accept="image/*"
          disabled={uploading || remaining <= 0}
          onChange={(event) => onSelect(event.target.files)}
          className="file-field"
        />
        <p className="editor-hint">
          Up to {remaining} more page{remaining === 1 ? '' : 's'}. They are
          resized and compressed here, before anything is uploaded. Pages keep
          the order you picked them in.
        </p>
      </div>

      {/* Progress is announced, not just drawn. */}
      <p role="status" aria-live="polite" className="editor-status">
        {message}
      </p>

      {items.length > 0 && (
        <ol className="grid grid-cols-[repeat(auto-fill,minmax(min(220px,100%),1fr))] gap-4 p-0">
          {items.map((item, index) => (
            <li
              key={item.key}
              className="flex list-none flex-col gap-2 rounded-lg border p-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">Page {index + 1}</span>
                <span className="text-xs opacity-70">
                  {item.status === 'ready' && item.image
                    ? `${item.image.width}×${item.image.height}`
                    : item.status}
                </span>
              </div>

              {item.previewUrl && (
                // A blob URL for a local preview that never leaves the tab.
                // next/image cannot optimise it and would only add a request.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.previewUrl}
                  alt=""
                  width={item.image?.width}
                  height={item.image?.height}
                  className="h-auto w-full rounded"
                />
              )}

              {item.status === 'failed' && (
                <p className="text-sm">
                  <strong>Could not read this file.</strong> {item.error}
                </p>
              )}

              {item.status === 'ready' && (
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor={`alt-${item.key}`}
                    className="meta field-label"
                  >
                    Alt text (required)
                  </label>
                  <input
                    id={`alt-${item.key}`}
                    type="text"
                    required
                    value={item.alt}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((other, i) =>
                          i === index
                            ? { ...other, alt: event.target.value }
                            : other,
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

      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onUpload}
            disabled={!canUpload}
            data-busy={uploading ? 'true' : 'false'}
            aria-busy={uploading}
            className="pill pill--solid self-start"
          >
            {uploading ? 'Uploading…' : 'Upload pages'}
          </button>
          {!everyAltFilled && (
            <p className="editor-hint">
              Every page needs alt text before it can be uploaded. The
              transcription is the content of the letter, and the alt text is
              what describes the photo itself.
            </p>
          )}
        </div>
      )}
    </section>
  )
}

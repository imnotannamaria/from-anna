'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  letterId: string
  pageCount: number
  alreadyTranscribed: boolean
}

/**
 * Runs the transcription for every page in one call.
 *
 * Deliberately a button rather than something that fires when an upload
 * finishes: it leaves room to look at the photos and retake a blurry one
 * before spending a call on it.
 *
 * There is no automatic retry. A failed request is not billed, so retrying is
 * cheap — but it is a decision made out loud, not one that happens invisibly.
 */
export function TranscribeButton({
  letterId,
  pageCount,
  alreadyTranscribed,
}: Props) {
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'idle' | 'warning' | 'error' | 'done'>('idle')
  const router = useRouter()

  async function onTranscribe() {
    setRunning(true)
    setTone('idle')
    setMessage(
      `Transcribing ${pageCount} page${pageCount === 1 ? '' : 's'}. This can take a while.`,
    )

    try {
      const response = await fetch(`/api/letters/${letterId}/transcribe`, {
        method: 'POST',
      })
      const body = await response.json().catch(() => null)

      if (!response.ok) {
        setTone('error')
        setMessage(body?.error ?? `Transcription failed (${response.status}).`)
        return
      }

      if (body?.warning === 'mismatch') {
        setTone('warning')
        setMessage(body.message)
      } else {
        setTone('done')
        setMessage(
          `Transcribed ${body?.pages} page${body?.pages === 1 ? '' : 's'} with ${body?.provider}.` +
            (body?.seededEditor === false
              ? ' The editor was left alone because it already has edited text.'
              : ''),
        )
      }

      router.refresh()
    } catch {
      setTone('error')
      setMessage('Could not reach the server. Nothing was transcribed.')
    } finally {
      setRunning(false)
    }
  }

  if (pageCount === 0) return null

  return (
    <section className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={onTranscribe}
        disabled={running}
        className="rounded border px-4 py-2 disabled:opacity-50"
      >
        {running
          ? 'Transcribing…'
          : alreadyTranscribed
            ? 'Transcribe again'
            : 'Transcribe'}
      </button>

      {alreadyTranscribed && !running && (
        <p className="text-sm opacity-80">
          Running again replaces the raw transcription of every page.
        </p>
      )}

      <p
        role="status"
        aria-live="polite"
        className={`text-sm ${tone === 'error' || tone === 'warning' ? 'font-medium' : 'opacity-80'}`}
      >
        {tone === 'error' && 'Failed: '}
        {tone === 'warning' && 'Check this: '}
        {message}
      </p>
    </section>
  )
}

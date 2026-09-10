'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { TypeLine } from '@/components/ui/type-line'

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
    <section className="admin-section">
      <div className="editor-bar">
        <button
          type="button"
          onClick={onTranscribe}
          disabled={running}
          data-busy={running ? 'true' : 'false'}
          aria-busy={running}
          className="pill pill--solid"
        >
          {running
            ? 'Transcribing…'
            : alreadyTranscribed
              ? 'Transcribe again'
              : 'Transcribe'}
        </button>
      </div>

      {alreadyTranscribed && !running && (
        <p className="editor-hint">
          Running again replaces the raw transcription of every page.
        </p>
      )}

      {running && (
        <p className="meta transcribing" aria-hidden="true">
          {/*
            It is a vision model reading handwriting and writing it out, and
            this is the one place in the project where a loading state can say
            what is happening rather than that something is. The real message
            is announced by the live region below.
          */}
          <TypeLine duration={2200}>reading the handwriting…</TypeLine>
        </p>
      )}

      <p
        role="status"
        aria-live="polite"
        className="editor-status"
        data-failed={tone === 'error' ? 'true' : 'false'}
      >
        {tone === 'error' && 'Failed: '}
        {tone === 'warning' && 'Check this: '}
        {message}
      </p>
    </section>
  )
}

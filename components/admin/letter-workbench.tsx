'use client'

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/app/components/entrepta/accordion'

import { ThemeToggle } from '@/components/ui/theme-toggle'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useReducedMotion } from '@/lib/use-reduced-motion'
import { SegmentTrack } from '@/components/ui/segment-track'
import { BrandMark } from '@/components/ui/brand-mark'
import { LetterControls } from './letter-controls'
import { TranscriptionEditor } from '@/components/editor/transcription-editor'
import { PageUploader } from '@/components/upload/page-uploader'
import { TranscribeButton } from '@/components/upload/transcribe-button'
import { PhotoFrame } from '@/components/ui/photo-frame'

type Props = {
  letterId: string
  title: string
  recipient: string | null
  slug: string
  status: 'draft' | 'published'
  expiresAt: string | null
  live: boolean
  initialMdContent: string
  photos: React.ReactNode[]
  transcribedCount: number
  rawTranscription: string
}
const steps = ['Photographs', 'Write & mark', 'Share']

export function LetterWorkbench(props: Props) {
  const [step, setStep] = useState(props.initialMdContent.trim() ? 1 : 0)
  const root = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    if (reducedMotion) return
    const panel = root.current?.querySelector<HTMLElement>(`#workbench-${step}`)
    const animation = panel?.animate(
      [{ transform: 'translateY(12px)' }, { transform: 'none' }],
      { duration: 280, easing: 'cubic-bezier(.16,1,.3,1)' },
    )
    return () => animation?.cancel()
  }, [step, reducedMotion])
  const [detailsDirty, setDetailsDirty] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [pendingPhotos, setPendingPhotos] = useState(false)
  const [savedContent, setSavedContent] = useState(props.initialMdContent)
  const [serverContent, setServerContent] = useState(props.initialMdContent)
  if (serverContent !== props.initialMdContent) {
    setServerContent(props.initialMdContent)
    setSavedContent(props.initialMdContent)
  }
  const ready = props.photos.length > 0 && savedContent.trim().length > 0
  const blocked = dirty || pendingPhotos
  return (
    <main
      id="main-content"
      ref={root}
      className="admin-shell admin-shell--wide writing-desk surface"
    >
      <header className="desk-header">
        <Link
          href="/admin"
          className="admin-back"
          onClick={(event) => {
            if (
              (blocked || detailsDirty) &&
              !window.confirm(
                'You have unsaved changes or photos waiting to upload. Leave this letter?',
              )
            )
              event.preventDefault()
          }}
        >
          ← All letters
        </Link>
        <span className="desk-wordmark">
          <BrandMark size={34} />
          from anna <span> / the writing desk</span>
        </span>
        <ThemeToggle />
      </header>
      <div className="desk-title-row">
        <div>
          <p className="meta">
            {props.recipient
              ? `A letter to ${props.recipient}`
              : 'A letter, in the making'}
          </p>
          <h1 className="display admin-title">{props.title}</h1>
        </div>
        <span className="status" data-live={props.live}>
          <span className="status-dot" aria-hidden="true" />
          {props.live
            ? 'Published'
            : props.status === 'published'
              ? 'Expired'
              : 'Draft'}
        </span>
      </div>
      <nav className="workbench-steps island" aria-label="Make your letter">
        <SegmentTrack label="Make your letter">
          {steps.map((name, index) => (
            <button
              key={name}
              type="button"
              className="pill workbench-step"
              aria-current={step === index ? 'step' : undefined}
              aria-controls={`workbench-${index}`}
              onClick={() => setStep(index)}
            >
              <span className="step-number" aria-hidden="true">
                0{index + 1}
              </span>
              <span>
                {name}
                <small>
                  {index === 0
                    ? `${props.photos.length} ${props.photos.length === 1 ? 'sheet' : 'sheets'} added`
                    : index === 1
                      ? dirty
                        ? 'Unsaved changes'
                        : savedContent.trim()
                          ? 'Ready to review'
                          : 'Correct & highlight'
                      : props.live
                        ? 'Your link is live'
                        : 'Preview & publish'}
                </small>
              </span>
            </button>
          ))}
        </SegmentTrack>
      </nav>
      <section
        id="workbench-0"
        hidden={step !== 0}
        aria-label="Photographs"
        className="workbench-panel"
      >
        <div className="step-intro">
          <div>
            <p className="meta">01 / Begin with the paper</p>
            <h2>Add your photographs</h2>
            <p>
              One photo per sheet, in reading order. Give each one a short
              description, then turn the handwriting into text.
            </p>
          </div>
          <span className="desk-paper-icon" aria-hidden="true">
            ✎
          </span>
        </div>
        {props.photos.length > 0 && (
          <div className="desk-photo-gallery">
            {props.photos.map((photo, index) => (
              <figure key={index}>
                <PhotoFrame warm>{photo}</PhotoFrame>
                <figcaption>Sheet {index + 1} </figcaption>
              </figure>
            ))}
          </div>
        )}
        <PageUploader
          letterId={props.letterId}
          existingPageCount={props.photos.length}
          onPendingChange={setPendingPhotos}
        />
        {props.photos.length > 0 && (
          <div className="transcription-next">
            <TranscribeButton
              letterId={props.letterId}
              pageCount={props.photos.length}
              alreadyTranscribed={props.transcribedCount > 0}
              blocked={blocked}
              onComplete={() => setStep(1)}
            />
            <button className="pill" type="button" onClick={() => setStep(1)}>
              {savedContent.trim()
                ? 'Continue editing →'
                : 'Type the text myself →'}
            </button>
          </div>
        )}
      </section>
      <section
        id="workbench-1"
        hidden={step !== 1}
        aria-label="Write and mark"
        className="workbench-panel"
      >
        <div className="step-intro">
          <div>
            <p className="meta">02 / Make it sound like you</p>
            <h2>Read it. Fix it. Mark what matters.</h2>
            <p>
              Keep the original beside you as you edit. Select words in the
              preview to add a highlight.
            </p>
          </div>
        </div>
        <TranscriptionEditor
          letterId={props.letterId}
          initialMdContent={props.initialMdContent}
          photos={props.photos}
          published={props.live}
          onDirtyChange={setDirty}
          onSaved={setSavedContent}
        />
        {props.rawTranscription && (
          <Accordion type="single" collapsible className="writing-extras">
            <AccordionItem value="original">
              <AccordionTrigger>
                Original machine transcription
              </AccordionTrigger>
              <AccordionContent className="writing-tools-content">
                <p className="editor-hint">
                  Kept separately from your edits. Copy a passage from here if
                  you need to recover it.
                </p>
                <pre className="raw-transcription">
                  {props.rawTranscription}
                </pre>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        <div className="step-footer">
          <span className="editor-hint">
            {dirty
              ? 'Save your changes before sharing.'
              : 'Happy with the letter? See what your recipient will open.'}
          </span>
          <button className="pill" type="button" onClick={() => setStep(2)}>
            Review & share →
          </button>
        </div>
      </section>
      <section
        id="workbench-2"
        hidden={step !== 2}
        aria-label="Share your letter"
        className="workbench-panel"
      >
        <div className="step-intro">
          <div>
            <p className="meta">03 / Ready for its recipient</p>
            <h2>One letter. One link.</h2>
            <p>
              Preview the saved letter before publishing. When it is ready, copy
              its link and send it yourself.
            </p>
          </div>
        </div>
        {(!ready || blocked) && (
          <div className="review-notice">
            <span>
              {dirty
                ? 'Your latest edits are not saved yet.'
                : pendingPhotos
                  ? 'Some photos are still waiting to upload.'
                  : 'Add a photograph and save the transcription before publishing.'}
            </span>
            <button
              className="pill"
              type="button"
              onClick={() =>
                setStep(
                  dirty ? 1 : pendingPhotos || !props.photos.length ? 0 : 1,
                )
              }
            >
              Finish the letter →
            </button>
          </div>
        )}
        <LetterControls
          letterId={props.letterId}
          slug={props.slug}
          status={props.status}
          expiresAt={props.expiresAt}
          live={props.live}
          title={props.title}
          recipient={props.recipient}
          onDirtyChange={setDetailsDirty}
          canPublish={ready && !blocked}
          hasUnsavedChanges={blocked}
        />
      </section>
    </main>
  )
}

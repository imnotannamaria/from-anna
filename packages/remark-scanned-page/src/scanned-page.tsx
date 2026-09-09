import { renderMarkdown } from './render'
import type { RemarkMarkDirectiveOptions } from './remark-mark-directive'

type PhotoProps = {
  /** Where the photo is served from. Private blob, behind a route. */
  imageSrc: string
  /**
   * A second, smaller output of the same photo, if there is one.
   *
   * A sheet stored large enough to zoom into is far more than a phone needs,
   * and `sizes` cannot help when there is only one file to choose from.
   */
  screenSrc?: string
  screenWidth?: number
  /** Describes the photograph. Required — never empty, never decorative. */
  alt: string
  /** Post-resize dimensions, so the page reserves the space. */
  width: number
  height: number
  /** Photos below the fold should not block the first paint. */
  priority?: boolean
  className?: string
}

/**
 * The photograph on its own.
 *
 * Separate from the transcription because a reading layout may want to pin
 * one while the other scrolls, and a component that always emits both side by
 * side cannot be pinned. `ScannedPage` composes the two back together for the
 * plain case.
 */
export function ScannedPhoto({
  imageSrc,
  screenSrc,
  screenWidth,
  alt,
  width,
  height,
  priority = false,
  className,
}: PhotoProps) {
  /*
    The Blob store is private, so this is a route rather than a CDN URL.
    An image optimizer would fetch it without the reader's session and cache
    the result past an unpublish, which is exactly what a private store is
    for — so the file is served as it was stored, and the sizes are chosen at
    upload instead.
  */
  const srcSet =
    screenSrc && screenWidth
      ? `${screenSrc} ${screenWidth}w, ${imageSrc} ${width}w`
      : undefined

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageSrc}
      srcSet={srcSet}
      // A sheet is one column of the reading layout at most, and full width on
      // a phone. Without this the browser assumes 100vw and picks the large
      // file for a 390px screen.
      sizes={srcSet ? '(min-width: 900px) 50vw, 100vw' : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      className={['scanned-photo', className].filter(Boolean).join(' ')}
      // Width and height are the post-resize values, so the box is reserved
      // before the bytes arrive and nothing jumps.
      style={{ aspectRatio: `${width} / ${height}` }}
    />
  )
}

type TranscriptionProps = {
  /** The transcription for this page, in markdown. */
  markdown: string
  /** Extra classes for the rendered transcription. */
  className?: string
} & RemarkMarkDirectiveOptions

/**
 * The transcription on its own, rendered on the server.
 *
 * **This is the content.** An image of text is invisible to a screen reader,
 * unreadable to a crawler, and gone entirely for anyone whose images failed
 * to load. The photograph is the visual layer over the top of it, not the
 * other way round — which is also why this is never the hidden half of a
 * toggle that only exists after hydration.
 */
export function ScannedTranscription({
  markdown,
  className,
  knownTags,
  onUnknownTag,
}: TranscriptionProps) {
  // Sanitized by `renderMarkdown` — the schema is the contract, and the
  // transcription is model output, so it is treated as untrusted throughout.
  const html = renderMarkdown(markdown, { knownTags, onUnknownTag })

  return (
    <div
      className={['scanned-transcription', className].filter(Boolean).join(' ')}
      // Safe: the HTML came out of the sanitize schema in ./render.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export type ScannedPageProps = PhotoProps &
  RemarkMarkDirectiveOptions & {
    markdown: string
    /** 1-based, for the label. */
    pageNumber: number
    totalPages: number
    proseClassName?: string
  }

/**
 * One photographed page and its transcription, side by side.
 *
 * A server component on purpose: the markdown is rendered here and ships in
 * the HTML. Both halves are always in the DOM; CSS decides which is on screen
 * at a given width, never hydration.
 */
export function ScannedPage({
  markdown,
  pageNumber,
  totalPages,
  proseClassName,
  knownTags,
  onUnknownTag,
  ...photo
}: ScannedPageProps) {
  return (
    <article
      className="scanned-page"
      aria-label={`Page ${pageNumber} of ${totalPages}`}
    >
      <figure className="scanned-figure">
        <ScannedPhoto {...photo} />
        <figcaption className="scanned-caption">
          Page {pageNumber} of {totalPages}
        </figcaption>
      </figure>

      <ScannedTranscription
        markdown={markdown}
        className={proseClassName}
        knownTags={knownTags}
        onUnknownTag={onUnknownTag}
      />
    </article>
  )
}

import { renderMarkdown } from './render'

export type ScannedPageProps = {
  /** Where the photo is served from. Private blob, behind a route. */
  imageSrc: string
  /** Describes the photograph. Required — never empty, never decorative. */
  alt: string
  /** Post-resize dimensions, so the page reserves the space. */
  width: number
  height: number
  /** The transcription for this page, in markdown. */
  markdown: string
  /** 1-based, for the label. */
  pageNumber: number
  totalPages: number
  /** Photos below the fold should not block the first paint. */
  priority?: boolean
  /** Tags this project has styling for. Anything else warns and renders neutral. */
  knownTags?: readonly string[]
  onUnknownTag?: (tag: string) => void
  /** Extra classes for the rendered transcription. */
  proseClassName?: string
}

/**
 * One photographed page and its transcription.
 *
 * A server component on purpose. The markdown is rendered here and ships in
 * the HTML, because **the transcription is the content** — an image of text is
 * invisible to a screen reader, unreadable to a crawler, and gone entirely for
 * anyone whose images failed to load. The photograph is the visual layer over
 * the top of it, not the other way round.
 *
 * That is also why the text is never the hidden half of a toggle that only
 * exists after hydration. Both halves are in the DOM; CSS decides which is on
 * screen at a given width.
 */
export function ScannedPage({
  imageSrc,
  alt,
  width,
  height,
  markdown,
  pageNumber,
  totalPages,
  priority = false,
  knownTags,
  onUnknownTag,
  proseClassName,
}: ScannedPageProps) {
  // Sanitized by `renderMarkdown` — the schema is the contract, and the
  // transcription is model output, so it is treated as untrusted throughout.
  const html = renderMarkdown(markdown, { knownTags, onUnknownTag })

  return (
    <article
      className="grid gap-6 md:grid-cols-2 md:items-start"
      aria-label={`Page ${pageNumber} of ${totalPages}`}
    >
      <figure className="m-0">
        {/*
          The Blob store is private, so this is a route rather than a CDN URL.
          next/image cannot read it and would add nothing: the file is already
          resized and re-encoded before it was ever uploaded.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          // Width and height are the post-resize values, so the box is
          // reserved before the bytes arrive and nothing jumps.
          className="h-auto w-full rounded-lg border"
          style={{ aspectRatio: `${width} / ${height}` }}
        />
        <figcaption className="mt-2 text-xs opacity-70">
          Page {pageNumber} of {totalPages}
        </figcaption>
      </figure>

      <div
        className={proseClassName}
        // Safe: the HTML came out of the sanitize schema in lib/markdown.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  )
}

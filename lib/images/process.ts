/**
 * Client-side image processing, run before a photo ever leaves the browser.
 *
 * Only the processed image is stored: the 4MB original off a phone has no
 * consumer, and the processed one is what people see on the published page.
 * Colour is kept — ink on paper is half the point, and JPEG already
 * compresses chroma hard, so grayscale saved little and made the page look
 * like a photocopy.
 */

/** Longest side, in pixels, after processing. */
export const MAX_DIMENSION = 1500

/** JPEG quality. Handwriting needs contrast, not fidelity. */
export const JPEG_QUALITY = 0.8

export const MAX_PAGES_PER_LETTER = 5

export const OUTPUT_TYPE = 'image/jpeg'

export type ProcessedImage = {
  blob: Blob
  width: number
  height: number
}

export class ImageDecodeError extends Error {
  constructor(readonly fileName: string) {
    super(
      `Could not read "${fileName}". If it is a HEIC file, convert it to JPEG first.`,
    )
    this.name = 'ImageDecodeError'
  }
}

/**
 * Scale `width` × `height` so the longest side is at most `max`, keeping the
 * aspect ratio. Images already within the limit are returned untouched rather
 * than upscaled.
 *
 * Dimensions are rounded and floored at 1: a very long, thin image would
 * otherwise round its short side to zero, and a zero-width canvas throws.
 */
export function fitWithin(
  width: number,
  height: number,
  max: number = MAX_DIMENSION,
): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new RangeError('Image dimensions must be finite numbers')
  }
  if (width <= 0 || height <= 0) {
    throw new RangeError('Image dimensions must be positive')
  }

  const longest = Math.max(width, height)
  if (longest <= max) return { width: Math.round(width), height: Math.round(height) }

  const scale = max / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

/**
 * Decode a file the way the browser wants to.
 *
 * `createImageBitmap` is the fast path and does the decode off the main
 * thread. Safari has historically not accepted every source through it, so an
 * `<img>` + object URL is the fallback. A file neither path can decode — a
 * `.heic` dropped into desktop Chrome, mostly — raises `ImageDecodeError`,
 * which the caller shows against that one file while the others carry on.
 */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      // Fall through to the <img> path.
    }
  }

  const url = URL.createObjectURL(file)
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new ImageDecodeError(file.name))
      img.src = url
    })
  } finally {
    // Revoked as soon as the decode settles. Five previews holding their
    // originals open is a real amount of memory on a phone.
    URL.revokeObjectURL(url)
  }
}

function sourceSize(source: ImageBitmap | HTMLImageElement) {
  return source instanceof HTMLImageElement
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height }
}

/**
 * Resize and re-encode one photo. Returns the blob to upload alongside the
 * dimensions *after* the resize — those are what the published page uses to
 * reserve space, so storing the pre-resize numbers would reintroduce the
 * layout shift they exist to prevent.
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  const source = await decode(file)

  try {
    const natural = sourceSize(source)
    if (natural.width === 0 || natural.height === 0) {
      throw new ImageDecodeError(file.name)
    }

    const { width, height } = fitWithin(natural.width, natural.height)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new ImageDecodeError(file.name)

    ctx.drawImage(source, 0, 0, width, height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, OUTPUT_TYPE, JPEG_QUALITY),
    )
    if (!blob) throw new ImageDecodeError(file.name)

    return { blob, width, height }
  } finally {
    if ('close' in source) source.close()
  }
}

/**
 * Process files one at a time, reporting each result as it lands.
 *
 * Sequential on purpose: decoding five full-resolution photos at once will
 * freeze a phone. Awaiting between files also yields to the event loop, so
 * the thumbnails keep painting.
 *
 * One file failing never takes the others with it.
 */
export async function processImages(
  files: File[],
  onResult: (
    result:
      | { status: 'done'; index: number; file: File; image: ProcessedImage }
      | { status: 'failed'; index: number; file: File; error: Error },
  ) => void,
): Promise<void> {
  for (const [index, file] of files.entries()) {
    try {
      const image = await processImage(file)
      onResult({ status: 'done', index, file, image })
    } catch (error) {
      onResult({
        status: 'failed',
        index,
        file,
        error:
          error instanceof Error ? error : new ImageDecodeError(file.name),
      })
    }
  }
}

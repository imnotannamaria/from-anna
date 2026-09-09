import 'server-only'

import { get } from '@vercel/blob'

/**
 * Reading from the private Blob store.
 *
 * The store is private, so nothing here is reachable by URL alone. Every read
 * goes through a Function, which is exactly what makes unpublishing and
 * expiry mean something: the photo is the letter's content, and a public blob
 * URL would outlive both.
 */

export class BlobNotFoundError extends Error {
  constructor(readonly url: string) {
    super('Blob not found')
    this.name = 'BlobNotFoundError'
  }
}

/** Guard against a stored row pointing at something absurdly large. */
const MAX_BYTES = 12 * 1024 * 1024

export async function readBlob(url: string) {
  const result = await get(url, { access: 'private' })
  if (!result || result.statusCode !== 200) throw new BlobNotFoundError(url)
  return result
}

/**
 * Read a page photo as a `data:` URL.
 *
 * OpenRouter fetches image URLs itself, which a private blob will refuse, so
 * the bytes have to travel in the request body instead. Base64 inflates by
 * about a third: a ~300KB processed page becomes ~400KB, and the five-page
 * cap is what keeps the whole request inside a Function's body limit.
 */
export async function readBlobAsDataUrl(url: string): Promise<string> {
  const result = await readBlob(url)

  const buffer = Buffer.from(await new Response(result.stream).arrayBuffer())
  if (buffer.byteLength > MAX_BYTES) {
    throw new Error(`Blob at ${url} is larger than the ${MAX_BYTES} byte limit`)
  }

  const contentType = result.blob.contentType || 'image/jpeg'
  return `data:${contentType};base64,${buffer.toString('base64')}`
}

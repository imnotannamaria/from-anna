export function validateLetterDetails(body: {
  title?: unknown
  recipient?: unknown
}):
  | { ok: true; title: string; recipient: string | null | undefined }
  | { ok: false; error: string } {
  if (
    typeof body.title !== 'string' ||
    !body.title.trim() ||
    body.title.trim().length > 200
  )
    return { ok: false, error: 'Use a title between 1 and 200 characters.' }
  // Missing means unchanged, not empty: a caller that sends only a title
  // must neither get a 400 nor wipe the recipient it left out.
  if (
    body.recipient !== null &&
    body.recipient !== undefined &&
    (typeof body.recipient !== 'string' || body.recipient.trim().length > 200)
  )
    return {
      ok: false,
      error: 'Use a recipient name of up to 200 characters, or leave it empty.',
    }
  return {
    ok: true,
    title: body.title.trim(),
    recipient:
      body.recipient === undefined
        ? undefined
        : typeof body.recipient === 'string'
          ? body.recipient.trim() || null
          : null,
  }
}

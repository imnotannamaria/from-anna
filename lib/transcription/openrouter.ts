import 'server-only'

import { maxOutputTokens, transcribePrompt } from './prompt'

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

export class TranscriptionError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'not_configured'
      | 'no_image_support'
      | 'reasoning_required'
      | 'unauthorized'
      | 'rate_limited'
      | 'upstream'
      | 'empty_response',
  ) {
    super(message)
    this.name = 'TranscriptionError'
  }
}

export type TranscriptionResult = {
  /** The raw response, before any splitting or editing. */
  text: string
  /** Which model produced it, stored alongside the raw. */
  provider: string
}

/**
 * Transcribe every page of a letter in one call.
 *
 * The images arrive as `data:` URLs: the Blob store is private, so OpenRouter
 * could not fetch a blob URL itself. The text part comes first, which is the
 * ordering OpenRouter's docs recommend.
 *
 * There is no retry. A hidden retry spends a call without anyone seeing it,
 * and a failed request is not billed, so retrying is the caller's decision to
 * make out loud.
 */
export async function transcribe(
  imageUrls: string[],
  signal?: AbortSignal,
): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_MODEL

  if (!apiKey || !model) {
    throw new TranscriptionError(
      'OPENROUTER_API_KEY and OPENROUTER_MODEL must both be set. See .env.example.',
      'not_configured',
    )
  }

  if (imageUrls.length === 0) {
    throw new TranscriptionError('No pages to transcribe.', 'upstream')
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxOutputTokens(imageUrls.length),
      provider: {
        // Transcription has to be reproducible. Without this a request can
        // land on a different provider with different handwriting behaviour
        // and nothing says so.
        allow_fallbacks: false,
        // Refuse providers that train on the data, per request. The account
        // setting at openrouter.ai/settings/privacy already does this; this
        // is the second lock, so a change to the account cannot silently
        // start sending photographs of personal letters to a trainer.
        data_collection: 'deny',
      },
      // Transcribing needs no reasoning, and reasoning tokens are where the
      // cost actually runs away.
      //
      // `effort: 'none'` and not `enabled: false`: the latter is documented
      // only as a way to turn reasoning *on*, and on a model that mandates
      // reasoning it has no effect at all — so it would silently bill for
      // thinking on a job that requires none. `none` is rejected outright by
      // mandatory-reasoning models, which is the better failure: loud, and
      // caught below.
      reasoning: { effort: 'none' },
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: transcribePrompt(imageUrls.length) },
            ...imageUrls.map((url) => ({
              type: 'image_url' as const,
              image_url: { url },
            })),
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    // The provider's body can echo the request and is not ours to forward to
    // a browser. It is read only to tell the failures apart.
    const body = await response.text().catch(() => '')

    if (/no endpoints found that support image input/i.test(body)) {
      throw new TranscriptionError(
        `The model "${model}" does not accept images. Check its input_modalities on OpenRouter before setting OPENROUTER_MODEL.`,
        'no_image_support',
      )
    }
    if (/reasoning/i.test(body) && response.status === 400) {
      throw new TranscriptionError(
        `The model "${model}" requires reasoning, which transcription does not need and would be billed for. Pick a model that allows reasoning to be turned off.`,
        'reasoning_required',
      )
    }
    if (response.status === 401 || response.status === 403) {
      throw new TranscriptionError(
        'OpenRouter rejected the API key.',
        'unauthorized',
      )
    }
    if (response.status === 429) {
      throw new TranscriptionError(
        'OpenRouter rate limit reached. Try again in a moment.',
        'rate_limited',
      )
    }
    throw new TranscriptionError(
      `OpenRouter returned ${response.status}.`,
      'upstream',
    )
  }

  const payload = (await response.json()) as {
    model?: string
    choices?: { message?: { content?: string } }[]
  }

  const text = payload.choices?.[0]?.message?.content?.trim()
  if (!text) {
    throw new TranscriptionError(
      'OpenRouter returned no text. The letter was not transcribed.',
      'empty_response',
    )
  }

  // The model actually used, which can differ from the one requested. It is
  // stored next to the raw so comparing transcriptions later is not guesswork.
  return { text, provider: payload.model ?? model }
}

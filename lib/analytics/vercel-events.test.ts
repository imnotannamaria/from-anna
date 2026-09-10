import { describe, expect, it } from 'vitest'

import { LETTER_PATH, scrubEvent } from './vercel-events'

const view = (url: string) => ({ type: 'pageview', url })

describe('scrubEvent', () => {
  it('drops the desk entirely', () => {
    expect(scrubEvent(view('https://from-anna.vercel.app/admin'))).toBeNull()
    expect(
      scrubEvent(view('https://from-anna.vercel.app/admin/letters/abc')),
    ).toBeNull()
  })

  it('reports every letter as the same path, without its title', () => {
    expect(
      scrubEvent(view('https://from-anna.vercel.app/carta-pro-joao-2026-09-10')),
    ).toEqual(view(`https://from-anna.vercel.app${LETTER_PATH}`))
  })

  it('never sends the name in ?from=', () => {
    const result = scrubEvent(
      view('https://from-anna.vercel.app/carta-pro-joao-2026-09-10?from=joao#end'),
    )
    expect(result?.url).toBe(`https://from-anna.vercel.app${LETTER_PATH}`)
  })

  it('keeps the front page as it is, minus the query', () => {
    expect(scrubEvent(view('https://from-anna.vercel.app/?utm_source=x'))).toEqual(
      view('https://from-anna.vercel.app/'),
    )
  })

  it('does not mistake a slug that starts with "admin" for the desk', () => {
    expect(
      scrubEvent(view('https://from-anna.vercel.app/administrative-note'))?.url,
    ).toBe(`https://from-anna.vercel.app${LETTER_PATH}`)
  })

  it('keeps the rest of the event', () => {
    const event = { type: 'event', url: 'https://from-anna.vercel.app/', name: 'x' }
    expect(scrubEvent(event)).toEqual(event)
  })
})

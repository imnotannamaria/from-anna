import { describe, expect, it } from 'vitest'
import { validateLetterDetails } from './details'
describe('letter details', () => {
  it('trims names and permits an empty recipient', () => {
    expect(
      validateLetterDetails({ title: '  Olá  ', recipient: '  ' }),
    ).toEqual({ ok: true, title: 'Olá', recipient: null })
  })
  it('leaves a missing recipient unchanged rather than clearing it', () => {
    expect(validateLetterDetails({ title: 'Olá' })).toEqual({
      ok: true,
      title: 'Olá',
      recipient: undefined,
    })
  })
  it('rejects blank titles, oversized names and non-string values', () => {
    for (const body of [
      { title: ' ', recipient: null },
      { title: 'x'.repeat(201), recipient: null },
      { title: 'x', recipient: 42 },
      { title: [], recipient: null },
    ]) {
      expect(validateLetterDetails(body).ok).toBe(false)
    }
  })
})

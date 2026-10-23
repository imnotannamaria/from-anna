import { describe, expect, it } from 'vitest'

import { isCrossSiteWrite } from './origin'

const base = {
  method: 'POST',
  host: 'from-anna.vercel.app',
  origin: 'https://from-anna.vercel.app',
  fetchSite: 'same-origin',
}

describe('isCrossSiteWrite', () => {
  it('lets a same-origin write through', () => {
    expect(isCrossSiteWrite(base)).toBe(false)
  })

  it('never refuses a safe method', () => {
    expect(
      isCrossSiteWrite({ ...base, method: 'GET', fetchSite: 'cross-site' }),
    ).toBe(false)
  })

  it('refuses a write another site started', () => {
    expect(isCrossSiteWrite({ ...base, fetchSite: 'cross-site' })).toBe(true)
  })

  it('refuses a write from another origin when fetch metadata is missing', () => {
    expect(
      isCrossSiteWrite({
        ...base,
        fetchSite: null,
        origin: 'https://example.com',
      }),
    ).toBe(true)
  })

  it('refuses an opaque origin', () => {
    expect(isCrossSiteWrite({ ...base, fetchSite: null, origin: 'null' })).toBe(
      true,
    )
  })

  it('lets a client with no browser headers through', () => {
    expect(
      isCrossSiteWrite({ ...base, origin: null, fetchSite: null }),
    ).toBe(false)
  })

  it('compares the port too', () => {
    expect(
      isCrossSiteWrite({
        ...base,
        host: 'localhost:3000',
        origin: 'http://localhost:3001',
        fetchSite: null,
      }),
    ).toBe(true)
  })
})

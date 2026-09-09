import { describe, expect, it } from 'vitest'

import { type AdminContext, isAdminAllowed } from './admin'

const base: AdminContext = {
  isProduction: false,
  bypassEnabled: false,
  userId: null,
  allowlist: [],
}

describe('isAdminAllowed', () => {
  it('denies by default', () => {
    expect(isAdminAllowed(base)).toBe(false)
  })

  it('denies a signed-out user in production', () => {
    expect(isAdminAllowed({ ...base, isProduction: true })).toBe(false)
  })

  it('denies a signed-in user who is not on the allowlist', () => {
    expect(
      isAdminAllowed({ ...base, isProduction: true, userId: 'user_stranger' }),
    ).toBe(false)
  })

  it('allows a signed-in user on the allowlist', () => {
    expect(
      isAdminAllowed({
        ...base,
        isProduction: true,
        userId: 'user_anna',
        allowlist: ['user_anna'],
      }),
    ).toBe(true)
  })

  it('ignores the dev bypass in production, even when it is set', () => {
    // The whole point of the flag existing. If this ever passes, an open
    // endpoint is one stray environment variable away.
    expect(
      isAdminAllowed({ ...base, isProduction: true, bypassEnabled: true }),
    ).toBe(false)
  })

  it('honours the dev bypass outside production', () => {
    expect(isAdminAllowed({ ...base, bypassEnabled: true })).toBe(true)
  })

  it('still denies in development when the bypass is off', () => {
    expect(isAdminAllowed({ ...base, userId: 'user_anna' })).toBe(false)
  })

  it('an empty allowlist lets nobody in', () => {
    expect(
      isAdminAllowed({ ...base, isProduction: true, userId: 'user_anna' }),
    ).toBe(false)
  })
})

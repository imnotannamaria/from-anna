import { describe, expect, it } from 'vitest'

import { isPubliclyReadable } from './access'

const now = new Date('2026-09-09T12:00:00Z')

describe('isPubliclyReadable', () => {
  it('allows a published letter with no expiry', () => {
    expect(
      isPubliclyReadable({ status: 'published', expiresAt: null }, now),
    ).toBe(true)
  })

  it('refuses a draft', () => {
    expect(isPubliclyReadable({ status: 'draft', expiresAt: null }, now)).toBe(
      false,
    )
  })

  it('allows a published letter whose expiry is still ahead', () => {
    expect(
      isPubliclyReadable(
        { status: 'published', expiresAt: new Date('2026-09-10T12:00:00Z') },
        now,
      ),
    ).toBe(true)
  })

  it('refuses a published letter past its expiry', () => {
    expect(
      isPubliclyReadable(
        { status: 'published', expiresAt: new Date('2026-09-08T12:00:00Z') },
        now,
      ),
    ).toBe(false)
  })

  it('refuses at the exact expiry instant', () => {
    // The boundary decides in favour of the letter being closed. For a link
    // whose whole job is to stop working, that is the right way to be wrong.
    expect(
      isPubliclyReadable({ status: 'published', expiresAt: now }, now),
    ).toBe(false)
  })

  it('refuses a draft even when its expiry is in the future', () => {
    expect(
      isPubliclyReadable(
        { status: 'draft', expiresAt: new Date('2030-01-01T00:00:00Z') },
        now,
      ),
    ).toBe(false)
  })
})

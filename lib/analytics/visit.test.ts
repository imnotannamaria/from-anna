import { describe, expect, it } from 'vitest'

import {
  deviceFrom,
  isAutomated,
  normaliseReferrer,
  normaliseSource,
} from './visit'

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const MAC_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const IPAD =
  'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/604.1'

describe('isAutomated', () => {
  it('lets a real phone through', () => {
    expect(isAutomated(IPHONE)).toBe(false)
  })

  it('lets a real desktop browser through', () => {
    expect(isAutomated(MAC_CHROME)).toBe(false)
  })

  it('catches the link previews that would fake the first view', () => {
    // These fetch the URL the moment the link is pasted, before any person
    // has seen it. Without the filter, every letter starts at 1.
    expect(isAutomated('WhatsApp/2.23.20.0')).toBe(true)
    expect(isAutomated('facebookexternalhit/1.1')).toBe(true)
    expect(isAutomated('LinkedInBot/1.0')).toBe(true)
    expect(isAutomated('TelegramBot (like TwitterBot)')).toBe(true)
    expect(isAutomated('Slackbot-LinkExpanding 1.0')).toBe(true)
    expect(isAutomated('Discordbot/2.0')).toBe(true)
  })

  it('catches crawlers and scripts', () => {
    expect(isAutomated('Googlebot/2.1')).toBe(true)
    expect(isAutomated('curl/8.4.0')).toBe(true)
    expect(isAutomated('python-requests/2.31.0')).toBe(true)
    expect(isAutomated('node-fetch/1.0')).toBe(true)
  })

  it('treats a missing user agent as automated', () => {
    // A browser always sends one. Nothing is a script.
    expect(isAutomated(null)).toBe(true)
    expect(isAutomated('')).toBe(true)
    expect(isAutomated(undefined)).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isAutomated('WHATSAPP/2.0')).toBe(true)
  })
})

describe('deviceFrom', () => {
  it('classifies a phone', () => {
    expect(deviceFrom(IPHONE)).toBe('mobile')
  })

  it('classifies a tablet, not a phone', () => {
    expect(deviceFrom(IPAD)).toBe('tablet')
  })

  it('classifies a desktop', () => {
    expect(deviceFrom(MAC_CHROME)).toBe('desktop')
  })

  it('says unknown rather than guessing', () => {
    expect(deviceFrom(null)).toBe('unknown')
  })
})

describe('normaliseSource', () => {
  it('keeps a plain name', () => {
    expect(normaliseSource('yonatan')).toBe('yonatan')
  })

  it('lowercases and trims', () => {
    expect(normaliseSource('  Yonatan  ')).toBe('yonatan')
  })

  it('is null when the parameter is absent', () => {
    // Opened without ?from=. Null, not the empty string, because "no source"
    // and "a source that is empty" would look the same in a count.
    expect(normaliseSource(null)).toBeNull()
    expect(normaliseSource('')).toBeNull()
    expect(normaliseSource('   ')).toBeNull()
  })

  it('replaces anything that is not name-shaped', () => {
    expect(normaliseSource('anna maria')).toBe('anna-maria')
    expect(normaliseSource('a/b?c=1')).toBe('a-b-c-1')
  })

  it('collapses runs and trims the edges', () => {
    expect(normaliseSource('--a???b--')).toBe('a-b')
  })

  it('is null when nothing usable survives', () => {
    expect(normaliseSource('???')).toBeNull()
  })

  it('caps the length so a query string cannot write an essay', () => {
    expect(normaliseSource('x'.repeat(500))!.length).toBeLessThanOrEqual(64)
  })
})

describe('normaliseReferrer', () => {
  it('keeps only the hostname', () => {
    // A full referrer can carry a query string with anything in it.
    expect(normaliseReferrer('https://www.linkedin.com/feed/?x=secret')).toBe(
      'www.linkedin.com',
    )
  })

  it('is null for an empty or malformed referrer', () => {
    expect(normaliseReferrer('')).toBeNull()
    expect(normaliseReferrer('not a url')).toBeNull()
    expect(normaliseReferrer(null)).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'

import {
  isLocale,
  isPagePath,
  localeFrom,
  localeOfPath,
  localePath,
  otherLocale,
  routePage,
  stripLocale,
} from './locales'

describe('localeFrom', () => {
  it('prefers the visitor’s own choice over the browser', () => {
    expect(localeFrom('en', 'pt-BR,pt;q=0.9')).toBe('en')
    expect(localeFrom('pt', 'en-US')).toBe('pt')
  })

  it('ignores a cookie that is not a language of the site', () => {
    expect(localeFrom('fr', 'pt-BR')).toBe('pt')
    expect(localeFrom('', null)).toBe('en')
  })

  it('takes the first language the browser asks for that the site speaks', () => {
    expect(localeFrom(undefined, 'fr-FR,pt-BR;q=0.8,en;q=0.5')).toBe('pt')
    expect(localeFrom(undefined, 'en-US,pt;q=0.9')).toBe('en')
  })

  it('weighs by q and keeps the browser’s order between equals', () => {
    expect(localeFrom(undefined, 'en;q=0.4,pt;q=0.9')).toBe('pt')
    expect(localeFrom(undefined, 'pt,en')).toBe('pt')
  })

  it('reads English when nothing says otherwise', () => {
    expect(localeFrom(undefined, null)).toBe('en')
    expect(localeFrom(undefined, 'de,fr;q=0.8')).toBe('en')
    expect(localeFrom(undefined, 'pt;q=0')).toBe('en')
  })
})

describe('paths', () => {
  it('writes English at the root and Portuguese under /pt', () => {
    expect(localePath('en', '/')).toBe('/')
    expect(localePath('pt', '/')).toBe('/pt')
    expect(localePath('en', '/a-letter')).toBe('/a-letter')
    expect(localePath('pt', '/a-letter')).toBe('/pt/a-letter')
    expect(localePath('pt', 'a-letter')).toBe('/pt/a-letter')
  })

  it('strips a language and nothing else', () => {
    expect(stripLocale('/pt')).toBe('/')
    expect(stripLocale('/pt/a-letter')).toBe('/a-letter')
    expect(stripLocale('/en/a-letter')).toBe('/a-letter')
    expect(stripLocale('/a-letter')).toBe('/a-letter')
    expect(stripLocale('/pt-letter')).toBe('/pt-letter')
  })

  it('cannot be made to point off the site', () => {
    expect(stripLocale('/pt//evil.example')).toBe('/evil.example')
    expect(stripLocale('/pt///evil.example')).toBe('/evil.example')
  })

  it('reads the language an address is written in', () => {
    expect(localeOfPath('/pt/a-letter')).toBe('pt')
    expect(localeOfPath('/en')).toBe('en')
    expect(localeOfPath('/a-letter')).toBeNull()
    expect(localeOfPath('/ptolemy')).toBeNull()
  })

  it('knows the other language', () => {
    expect(otherLocale('en')).toBe('pt')
    expect(otherLocale('pt')).toBe('en')
    expect(isLocale('pt')).toBe(true)
    expect(isLocale('es')).toBe(false)
  })
})

describe('routePage', () => {
  it('serves Portuguese as it is', () => {
    expect(routePage('/pt', undefined, 'en')).toEqual({ kind: 'serve' })
    expect(routePage('/pt/a-letter', undefined, 'en')).toEqual({
      kind: 'serve',
    })
  })

  it('sends /en to the same page without it, for good', () => {
    expect(routePage('/en', undefined, null)).toEqual({
      kind: 'redirect',
      to: '/',
      permanent: true,
    })
    expect(routePage('/en/a-letter', undefined, null)).toEqual({
      kind: 'redirect',
      to: '/a-letter',
      permanent: true,
    })
  })

  it('serves a preview image where it is, for a scraper that will not follow a redirect', () => {
    expect(routePage('/en/opengraph-image', undefined, null)).toEqual({
      kind: 'serve',
    })
    expect(routePage('/en/a-letter/opengraph-image', undefined, null)).toEqual({
      kind: 'serve',
    })
    expect(routePage('/en/a-letter/opengraph-image-1abc', undefined, null)).toEqual({
      kind: 'serve',
    })
    // …and only that: a letter that happens to be called this is still a letter.
    expect(routePage('/en/opengraph-image/extra', undefined, null).kind).toBe(
      'redirect',
    )
  })

  it('serves English from /en under the same address', () => {
    expect(routePage('/', undefined, 'en-US')).toEqual({
      kind: 'rewrite',
      to: '/en',
    })
    expect(routePage('/a-letter', undefined, null)).toEqual({
      kind: 'rewrite',
      to: '/en/a-letter',
    })
  })

  it('sends the front page to Portuguese for a visitor who prefers it', () => {
    expect(routePage('/', undefined, 'pt-BR,pt;q=0.9')).toEqual({
      kind: 'redirect',
      to: '/pt',
      permanent: false,
    })
    expect(routePage('/', 'pt', 'en')).toEqual({
      kind: 'redirect',
      to: '/pt',
      permanent: false,
    })
  })

  it('lets someone who chose English stay on it', () => {
    expect(routePage('/', 'en', 'pt-BR')).toEqual({
      kind: 'rewrite',
      to: '/en',
    })
  })

  it('never chooses for a letter: its link is its language', () => {
    expect(routePage('/a-letter', 'pt', 'pt-BR')).toEqual({
      kind: 'rewrite',
      to: '/en/a-letter',
    })
  })
})

describe('isPagePath', () => {
  it('is true for a page, in either language', () => {
    expect(isPagePath('/')).toBe(true)
    expect(isPagePath('/pt')).toBe(true)
    expect(isPagePath('/a-letter-2026-10-09')).toBe(true)
    expect(isPagePath('/pt/a-letter-2026-10-09')).toBe(true)
  })

  it('leaves a file alone, so public/ is served as it is', () => {
    expect(isPagePath('/sounds/paper-tear.mp3')).toBe(false)
    expect(isPagePath('/from-anna.png')).toBe(false)
    expect(isPagePath('/robots.txt')).toBe(false)
  })

  it('leaves the desk, the API and the services alone', () => {
    expect(isPagePath('/admin')).toBe(false)
    expect(isPagePath('/admin/letters/x')).toBe(false)
    expect(isPagePath('/api/letters/x/react')).toBe(false)
    expect(isPagePath('/__clerk/handshake')).toBe(false)
    expect(isPagePath('/_vercel/insights/view')).toBe(false)
  })
})


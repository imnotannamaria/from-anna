import { describe, expect, it } from 'vitest'

import { guessLanguage } from './language'

describe('guessLanguage', () => {
  it('recognises a letter in Portuguese', () => {
    expect(
      guessLanguage(
        'Oi, Marina. Achei o caderno que você me deu e escrevi nele. Foi estranho no começo, mas também foi bom. :mark[Ainda tem o seu?]{c=ask}',
      ),
    ).toBe('pt')
  })

  it('recognises a letter in English', () => {
    expect(
      guessLanguage(
        'Dear Marina, I found the notebook you gave me and I finally wrote in it. It was strange at first, but it was good. :mark[Do you still have yours?]{c=ask}',
      ),
    ).toBe('en')
  })

  it('says nothing about a letter too short to tell', () => {
    expect(guessLanguage('Oi, Marina.')).toBeNull()
  })

  it('says nothing when the two are close', () => {
    expect(
      guessLanguage(
        'I wrote this for you. Escrevi isso para você. The notebook is mine. O caderno é meu, e é seu também. This was it.',
      ),
    ).toBeNull()
  })

  it('does not count directive syntax as words', () => {
    expect(guessLanguage(':::theme{label="the and the and the and the and"}\n:::')).toBeNull()
  })

  it('is null for an empty letter', () => {
    expect(guessLanguage('')).toBeNull()
  })
})

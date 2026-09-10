import { describe, expect, it } from 'vitest'

import { normaliseCase } from './normalize-case'

describe('normaliseCase', () => {
  it('turns block capitals into a sentence', () => {
    expect(normaliseCase('FULL-STACK SOFTWARE ENGINEER.')).toBe(
      'Full-stack software engineer.',
    )
  })

  it('capitalises each sentence, not each word', () => {
    expect(normaliseCase('HELLO THERE. HOW ARE YOU? FINE!')).toBe(
      'Hello there. How are you? Fine!',
    )
  })

  it('starts every paragraph with a capital', () => {
    expect(normaliseCase('ONE THING\n\nANOTHER THING')).toBe(
      'One thing\n\nAnother thing',
    )
  })

  it('does not capitalise a line that continues a sentence', () => {
    expect(normaliseCase('WITH A PEN\nAND A NOTEBOOK')).toBe(
      'With a pen\nand a notebook',
    )
  })

  it('fixes the English pronoun', () => {
    expect(normaliseCase("I THINK I'M DONE, SAID I.")).toBe(
      "I think I'm done, said I.",
    )
  })

  it('leaves directive attributes exactly as they were', () => {
    expect(normaliseCase('A :mark[GOOD WEEK]{c=important} INDEED.')).toBe(
      'A :mark[good week]{c=important} indeed.',
    )
  })

  it('capitalises the first word even when it is inside a highlight', () => {
    expect(normaliseCase(':mark[WRITTEN BY HAND]{c=important} (LOL).')).toBe(
      ':mark[Written by hand]{c=important} (lol).',
    )
  })

  it('never touches a link target, because URLs are case-sensitive', () => {
    expect(normaliseCase('SEE [THIS](https://Example.com/Path).')).toBe(
      'See [this](https://Example.com/Path).',
    )
  })

  it('keeps [?] markers and does not treat them as a word', () => {
    expect(normaliseCase('[?] WAS HERE. [?] TOO.')).toBe('[?] Was here. [?] Too.')
  })

  it('treats a directive fence as a paragraph boundary', () => {
    expect(normaliseCase(':::theme{label="A NAME"}\nINSIDE IT\n:::')).toBe(
      ':::theme{label="A NAME"}\nInside it\n:::',
    )
  })

  it('leaves text that is already ordinary alone', () => {
    const text = 'Already fine. Nothing to do.'
    expect(normaliseCase(text)).toBe(text)
  })
})

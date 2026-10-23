/**
 * Which language a letter is written in, when that is obvious.
 *
 * The site is in English and `<html lang="en">` says so. A letter can be in
 * any language, and a screen reader reads Portuguese with English
 * pronunciation unless the text says otherwise — which turns the one part of
 * the page that exists to be read aloud into noise.
 *
 * There is no language column. A letter is one markdown document, written by
 * one person in one or two languages, so this counts function words: short,
 * frequent, and hardly ever shared between the two. It answers only when one
 * side clearly wins, and says nothing otherwise. A missing `lang` falls back to
 * the page's English, which is what every letter got before; a wrong one would
 * be worse than that, so the bar is high.
 */

const PORTUGUESE = new Set([
  'não', 'que', 'você', 'vocês', 'uma', 'para', 'com', 'mas', 'isso', 'eu',
  'muito', 'também', 'está', 'são', 'meu', 'minha', 'por', 'como', 'dos',
  'das', 'nos', 'nas', 'pelo', 'pela', 'já', 'quando', 'ainda', 'sobre', 'é',
  'foi', 'tem', 'era', 'seu', 'sua', 'aqui', 'então', 'obrigada', 'obrigado',
])

const ENGLISH = new Set([
  'the', 'and', 'you', 'to', 'of', 'is', 'it', 'that', 'was', 'for', 'with',
  'this', 'my', 'are', 'have', 'not', 'but', 'i', 'your', 'what', 'when',
  'about', 'still', 'there', 'would', 'been', 'just', 'from', 'thank',
])

const MIN_EVIDENCE = 8
const MARGIN = 3

export type LetterLanguage = 'pt' | 'en'

export function guessLanguage(markdown: string): LetterLanguage | null {
  const words = markdown
    // The directives are syntax, not words: `{c=important}`, `:::theme`.
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/:{1,3}[a-z]+/g, ' ')
    .toLowerCase()
    .match(/\p{L}+/gu)

  if (!words) return null

  let pt = 0
  let en = 0
  for (const word of words) {
    if (PORTUGUESE.has(word)) pt++
    else if (ENGLISH.has(word)) en++
  }

  if (pt + en < MIN_EVIDENCE) return null
  if (pt >= en * MARGIN) return 'pt'
  if (en >= pt * MARGIN) return 'en'
  return null
}

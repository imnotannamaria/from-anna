import { describe, expect, it } from 'vitest'

import en from '../../messages/en.json'
import pt from '../../messages/pt.json'

const leaves = (node: unknown, path = ''): [string, string][] =>
  typeof node === 'string'
    ? [[path, node]]
    : Object.entries(node as object).flatMap(([key, value]) =>
        leaves(value, path ? `${path}.${key}` : key),
      )

/**
 * A message of four words or more is a sentence. A label can be the same in
 * both languages (a name, a file); a sentence that is the same in both is one
 * nobody translated.
 */
const isSentence = (text: string) => text.trim().split(/\s+/).length >= 4

/** The tags of a sentence, `<em>` and `<readme>`: the page gives each one a component. */
const tags = (text: string) =>
  [...text.matchAll(/<(\w+)>/g)].map((match) => match[1]).sort()

/**
 * The values a sentence is given: `{name}`, `{count, plural, …}`. Only the name
 * before a comma or a closing brace, so the words inside a plural's branches
 * are not mistaken for one.
 */
const args = (text: string) =>
  [...text.matchAll(/\{(\w+)\s*[,}]/g)].map((match) => match[1]).sort()

describe('the two message files', () => {
  const english = new Map(leaves(en))
  const portuguese = new Map(leaves(pt))

  it('have the same keys', () => {
    expect([...portuguese.keys()].sort()).toEqual([...english.keys()].sort())
  })

  it('leave no English sentence in the Portuguese one', () => {
    const untranslated = [...english]
      .filter(([key, text]) => isSentence(text) && portuguese.get(key) === text)
      .map(([key]) => key)
    expect(untranslated).toEqual([])
  })

  it('keep the same tags in every sentence', () => {
    for (const [key, text] of english) {
      expect(tags(portuguese.get(key) ?? ''), key).toEqual(tags(text))
    }
  })

  it('give every sentence the same values to fill in', () => {
    for (const [key, text] of english) {
      expect(args(portuguese.get(key) ?? ''), key).toEqual(args(text))
    }
  })

  it('leave no message empty', () => {
    for (const [key, text] of [...english, ...portuguese]) {
      expect(text.trim(), key).not.toBe('')
    }
  })
})

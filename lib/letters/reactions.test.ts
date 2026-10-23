import { describe, expect, it } from 'vitest'

import {
  REACTIONS,
  countsFrom,
  emptyCounts,
  isReactionId,
  parseReactionBody,
  totalOf,
} from './reactions'

describe('reactions', () => {
  it('has a unique id and emoji for every reaction', () => {
    expect(new Set(REACTIONS.map((r) => r.id)).size).toBe(REACTIONS.length)
    expect(new Set(REACTIONS.map((r) => r.emoji)).size).toBe(REACTIONS.length)
  })

  it('only accepts ids from the list', () => {
    expect(isReactionId('heart')).toBe(true)
    expect(isReactionId('😂')).toBe(false)
    expect(isReactionId('__proto__')).toBe(false)
    expect(isReactionId(undefined)).toBe(false)
  })

  it('fills in a zero for a reaction nobody used', () => {
    const counts = countsFrom([{ reaction: 'heart', count: 3 }])
    expect(counts.heart).toBe(3)
    expect(counts.clap).toBe(0)
    expect(totalOf(counts)).toBe(3)
  })

  it('drops a row for a reaction that is no longer offered', () => {
    const counts = countsFrom([{ reaction: 'retired', count: 9 }])
    expect(counts).toEqual(emptyCounts())
  })

  it('reads a well-formed body', () => {
    expect(parseReactionBody({ reaction: 'thanks', on: false })).toEqual({
      reaction: 'thanks',
      on: false,
    })
  })

  it('refuses a body that is not exactly a reaction and a boolean', () => {
    expect(parseReactionBody(null)).toBeNull()
    expect(parseReactionBody('heart')).toBeNull()
    expect(parseReactionBody({ reaction: 'heart' })).toBeNull()
    expect(parseReactionBody({ reaction: 'heart', on: 'yes' })).toBeNull()
    expect(parseReactionBody({ reaction: 'nope', on: true })).toBeNull()
  })
})

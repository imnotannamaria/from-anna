import { describe, expect, it } from 'vitest'

import { findIllegibleMarks, nextIllegibleMark } from './illegible'

describe('findIllegibleMarks', () => {
  it('finds nothing in a clean transcription', () => {
    expect(findIllegibleMarks('A letter with no doubts in it')).toEqual([])
  })

  it('finds a single mark and its bounds', () => {
    const marks = findIllegibleMarks('I went to the [?] yesterday')
    expect(marks).toEqual([{ start: 14, end: 17 }])
    expect('I went to the [?] yesterday'.slice(14, 17)).toBe('[?]')
  })

  it('finds every mark, in order', () => {
    expect(findIllegibleMarks('[?] middle [?] end [?]')).toHaveLength(3)
  })

  it('finds adjacent marks without skipping one', () => {
    // Two unread words in a row is common in rushed handwriting.
    expect(findIllegibleMarks('[?][?]')).toEqual([
      { start: 0, end: 3 },
      { start: 3, end: 6 },
    ])
  })

  it('does not match a markdown link or an ordinary bracket', () => {
    expect(findIllegibleMarks('[a link](https://x.com) and [x] and [ ? ]')).toEqual(
      [],
    )
  })
})

describe('nextIllegibleMark', () => {
  const text = 'one [?] two [?] three'

  it('returns null when there is nothing to find', () => {
    expect(nextIllegibleMark('nothing here', 0)).toBeNull()
  })

  it('finds the first mark from the start', () => {
    expect(nextIllegibleMark(text, 0)?.start).toBe(4)
  })

  it('finds the next mark after the cursor', () => {
    expect(nextIllegibleMark(text, 5)?.start).toBe(12)
  })

  it('wraps back to the first mark instead of dead-ending', () => {
    // Repeated presses should cycle, so the button never stops working.
    expect(nextIllegibleMark(text, 100)?.start).toBe(4)
  })

  it('treats a cursor exactly on a mark as finding that mark', () => {
    expect(nextIllegibleMark(text, 4)?.start).toBe(4)
  })
})

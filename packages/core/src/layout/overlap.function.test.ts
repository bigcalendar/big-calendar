import { describe, expect, it } from 'vitest'
import type { DayLayoutEvent } from './layout.type'
import { overlap } from './overlap.function'

/** Quick event builder. `top`/`height` mirror `start`/`end` as fractions of a 60-min day. */
function ev(id: number, start: number, end: number): DayLayoutEvent {
  return { id, start, end, top: start / 60, height: (end - start) / 60 }
}

const min = 1

describe('overlap', () => {
  it('gives a lone event the full column', () => {
    const [box] = overlap({ events: [ev(1, 0, 30)], minimumStartDifference: min })
    expect(box).toMatchObject({ id: 1, left: 0, width: 1, top: 0, zIndex: 0 })
  })

  it('passes top/height straight through', () => {
    const [box] = overlap({ events: [ev(1, 15, 45)], minimumStartDifference: min })
    expect(box?.top).toBeCloseTo(0.25)
    expect(box?.height).toBeCloseTo(0.5)
  })

  it('keeps sequential (non-overlapping) events at full width', () => {
    const boxes = overlap({ events: [ev(1, 0, 20), ev(2, 30, 50)], minimumStartDifference: min })
    expect(boxes).toHaveLength(2)
    for (const box of boxes) expect(box.width).toBe(1)
  })

  it('splits two overlapping events into a grown container + a side row', () => {
    const boxes = overlap({ events: [ev(1, 0, 30), ev(2, 0, 30)], minimumStartDifference: min })
    const first = boxes.find((b) => b.id === 1)
    const second = boxes.find((b) => b.id === 2)
    // container: starts at 0, base 1/2 grown ×1.7
    expect(first?.left).toBe(0)
    expect(first?.width).toBeCloseTo(0.85)
    // row: starts where the container's base width ends, no grow (no leaves)
    expect(second?.left).toBeCloseTo(0.5)
    expect(second?.width).toBeCloseTo(0.5)
  })

  it('arranges three overlapping events as container → row → leaf', () => {
    const boxes = overlap({
      events: [ev(1, 0, 30), ev(2, 0, 30), ev(3, 0, 30)],
      minimumStartDifference: min,
    })
    const container = boxes.find((b) => b.id === 1)
    const row = boxes.find((b) => b.id === 2)
    const leaf = boxes.find((b) => b.id === 3)
    // three columns → base width 1/3; the container grows over its rows
    expect(container?.left).toBe(0)
    expect(container?.width).toBeCloseTo((1 / 3) * 1.7)
    expect(row?.left).toBeCloseTo(1 / 3)
    expect(row?.width).toBeCloseTo((1 / 3) * 1.7) // row grows: it has a leaf
    expect(leaf?.left).toBeCloseTo(2 / 3)
    expect(leaf?.width).toBeCloseTo(1 / 3) // last leaf in its row → no grow
  })

  it('grows every leaf in a row except the last one', () => {
    // four mutually-overlapping events → one container, one row holding two leaves
    const boxes = overlap({
      events: [ev(1, 0, 30), ev(2, 0, 30), ev(3, 0, 30), ev(4, 0, 30)],
      minimumStartDifference: min,
    })
    const leafA = boxes.find((b) => b.id === 3) // first leaf in the row → grows
    const leafB = boxes.find((b) => b.id === 4) // last leaf in the row → no grow
    const base = 1 / 4 // four columns
    expect(leafA?.width).toBeCloseTo(base * 1.7)
    expect(leafB?.width).toBeCloseTo(base)
  })

  it('groups a later-starting event into a row via the start-inside-end test', () => {
    // starts differ by ≥ minimumStartDifference, so they pair up via the
    // "b starts inside a" clause of onSameRow, not the "same start" clause.
    const boxes = overlap({
      events: [ev(1, 0, 30), ev(2, 10, 40), ev(3, 15, 45)],
      minimumStartDifference: 5,
    })
    expect(boxes).toHaveLength(3)
    // 1 is the container; 2 is its row; 3 lands as 2's leaf (15 is inside 2's 10–40).
    expect(boxes.find((b) => b.id === 3)?.left).toBeGreaterThan(0)
  })

  it('opens a second row when a later event shares no row with the first', () => {
    // 2 and 3 both live under container 1 but don't overlap each other,
    // so onSameRow returns false and 3 starts a fresh row beside 2.
    const boxes = overlap({
      events: [ev(1, 0, 100), ev(2, 0, 10), ev(3, 50, 60)],
      minimumStartDifference: 5,
    })
    expect(boxes).toHaveLength(3)
    const row2 = boxes.find((b) => b.id === 2)
    const row3 = boxes.find((b) => b.id === 3)
    // both are rows of container 1 → both offset to the same lane start
    expect(row2?.left).toBeCloseTo(row3?.left ?? -1)
  })

  it('raises zIndex with paint order so later events stack on top', () => {
    const boxes = overlap({ events: [ev(1, 0, 30), ev(2, 5, 30)], minimumStartDifference: min })
    const first = boxes.find((b) => b.id === 1)
    const second = boxes.find((b) => b.id === 2)
    expect(second?.zIndex).toBeGreaterThan(first?.zIndex ?? 0)
  })

  it('pulls a non-adjacent next group forward to stay contiguous', () => {
    // 1 & 2 overlap (one group); 3 is a separate later group but sorts before 2 by end.
    const boxes = overlap({
      events: [ev(1, 0, 50), ev(2, 5, 50), ev(3, 60, 70)],
      minimumStartDifference: min,
    })
    expect(boxes).toHaveLength(3)
    const third = boxes.find((b) => b.id === 3)
    // 3 doesn't overlap the first group → it's its own lone, full-width container.
    expect(third?.width).toBe(1)
    expect(third?.left).toBe(0)
  })
})

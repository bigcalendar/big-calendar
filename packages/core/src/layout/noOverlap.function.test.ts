import { describe, expect, it } from 'vitest'
import type { DayLayoutEvent } from './layout.type'
import { noOverlap } from './noOverlap.function'

/** Build an event directly from fraction `top`/`height` (start/end unused by no-overlap). */
function ev(id: number, top: number, height: number): DayLayoutEvent {
  return { id, start: top, end: top + height, top, height }
}

const min = 1

describe('noOverlap', () => {
  it('gives a lone event the full column', () => {
    const [box] = noOverlap({ events: [ev(1, 0, 0.5)], minimumStartDifference: min })
    expect(box).toMatchObject({ id: 1, left: 0, width: 1 })
  })

  it('stacks vertically-separate events at full width', () => {
    const boxes = noOverlap({
      events: [ev(1, 0, 0.4), ev(2, 0.5, 0.4)],
      minimumStartDifference: min,
    })
    for (const box of boxes) {
      expect(box.left).toBe(0)
      expect(box.width).toBe(1)
    }
  })

  it('splits two overlapping events into two equal columns', () => {
    const boxes = noOverlap({
      events: [ev(1, 0, 0.5), ev(2, 0.25, 0.5)],
      minimumStartDifference: min,
    })
    const first = boxes.find((b) => b.id === 1)
    const second = boxes.find((b) => b.id === 2)
    expect(first?.left).toBeCloseTo(0)
    expect(first?.width).toBeCloseTo(0.5)
    expect(second?.left).toBeCloseTo(0.5)
    expect(second?.width).toBeCloseTo(0.5)
  })

  it('packs three mutually-overlapping events into three columns', () => {
    const boxes = noOverlap({
      events: [ev(1, 0, 0.9), ev(2, 0.1, 0.8), ev(3, 0.2, 0.7)],
      minimumStartDifference: min,
    })
    const lefts = boxes.map((b) => b.left).sort((a, b) => a - b)
    expect(lefts[0]).toBeCloseTo(0)
    expect(lefts[1]).toBeCloseTo(1 / 3)
    expect(lefts[2]).toBeCloseTo(2 / 3)
    for (const box of boxes) expect(box.width).toBeCloseTo(1 / 3)
  })

  it('stretches an event past its column when none of its friends sit higher', () => {
    // A is tall and spans the whole column; B,C form a 3-wide clique with A (idx 0,1,2).
    // D overlaps only A, lands in column 1, but its sole friend (A) is in column 0 —
    // so with no friend above it, D stretches to fill the rest of the column.
    const boxes = noOverlap({
      events: [ev(1, 0, 1), ev(2, 0, 0.3), ev(3, 0, 0.3), ev(4, 0.5, 0.4)],
      minimumStartDifference: min,
    })
    const d = boxes.find((b) => b.id === 4)
    expect(d?.left).toBeCloseTo(1 / 3)
    expect(d?.width).toBeCloseTo(2 / 3) // stretched: 1 − 1·(1/3)
  })

  it('passes top/height through unchanged', () => {
    const [box] = noOverlap({ events: [ev(7, 0.2, 0.35)], minimumStartDifference: min })
    expect(box?.top).toBeCloseTo(0.2)
    expect(box?.height).toBeCloseTo(0.35)
  })
})

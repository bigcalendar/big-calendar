import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { resizeEvent } from './resizeEvent.function'

describe.each(LOCALIZER_CASES)('resizeEvent [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    localizer = await create()
  })

  const start = '2026-06-15T09:00:00.000Z'
  const end = '2026-06-15T10:00:00.000Z'
  const step = 30

  describe("start edge (snap the start, keep the end)", () => {
    it('moves the start to the dropped slot and leaves the end', () => {
      const target = '2026-06-15T08:30:00.000Z'
      const resized = resizeEvent({ localizer, start, end, allDay: false, edge: 'start', target, step })
      expect(resized.start).toBe(target)
      expect(resized.end).toBe(end)
      expect(localizer.diff({ a: resized.end, b: resized.start, unit: 'minute' })).toBe(90)
    })

    it('clamps to a one-slot minimum when dragged past the end', () => {
      // Target is at/after the end — the event would invert; clamp to end − step.
      const resized = resizeEvent({ localizer, start, end, allDay: false, edge: 'start', target: end, step })
      expect(resized.start).toBe(localizer.add({ value: end, amount: -step, unit: 'minute' }))
      expect(localizer.diff({ a: resized.end, b: resized.start, unit: 'minute' })).toBe(step)
    })

    it('resizes across a day boundary when the target is in another day column', () => {
      const target = '2026-06-14T22:00:00.000Z'
      const resized = resizeEvent({ localizer, start, end, allDay: false, edge: 'start', target, step })
      expect(resized.start).toBe(target)
      // 22:00 (Jun 14) → 10:00 (Jun 15) keeps the end = 12h span.
      expect(localizer.diff({ a: end, b: resized.start, unit: 'minute' })).toBe(12 * 60)
    })
  })

  describe('end edge (snap the end, keep the start)', () => {
    it('moves the end to the dropped slot END (target + step) and leaves the start', () => {
      const target = '2026-06-15T11:00:00.000Z'
      const resized = resizeEvent({ localizer, start, end, allDay: false, edge: 'end', target, step })
      expect(resized.start).toBe(start)
      // Inclusive end: covers through the hovered slot.
      expect(resized.end).toBe(localizer.add({ value: target, amount: step, unit: 'minute' }))
      expect(localizer.diff({ a: resized.end, b: resized.start, unit: 'minute' })).toBe(150)
    })

    it('clamps to a one-slot minimum when dragged above the start', () => {
      const target = '2026-06-15T08:00:00.000Z'
      const resized = resizeEvent({ localizer, start, end, allDay: false, edge: 'end', target, step })
      expect(resized.end).toBe(localizer.add({ value: start, amount: step, unit: 'minute' }))
      expect(localizer.diff({ a: resized.end, b: resized.start, unit: 'minute' })).toBe(step)
    })

    it('extends across a day boundary when dropped in the next day column', () => {
      const target = '2026-06-16T01:00:00.000Z'
      const resized = resizeEvent({ localizer, start, end, allDay: false, edge: 'end', target, step })
      expect(resized.end).toBe(localizer.add({ value: target, amount: step, unit: 'minute' }))
      expect(localizer.diff({ a: resized.end, b: start, unit: 'minute' })).toBe(16 * 60 + step)
    })
  })

  it('preserves the allDay flag', () => {
    const resized = resizeEvent({
      localizer,
      start,
      end,
      allDay: true,
      edge: 'end',
      target: '2026-06-15T12:00:00.000Z',
      step,
    })
    expect(resized.allDay).toBe(true)
  })
})

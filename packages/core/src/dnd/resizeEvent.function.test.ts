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

  describe("day mode (month multi-day resize)", () => {
    // A 3-day all-day event: 15th 00:00 → 17th 23:59:59.999.
    const adStart = '2026-06-15T00:00:00.000Z'
    const sameDay = (a: string, b: string): void =>
      expect(localizer.startOf({ value: a, unit: 'day' })).toBe(localizer.startOf({ value: b, unit: 'day' }))
    let adEnd: string
    beforeAll(() => {
      adEnd = localizer.endOf({ value: '2026-06-17T00:00:00.000Z', unit: 'day' })
    })

    it('moves the start to the dropped day, keeping the end (start edge)', () => {
      const target = '2026-06-13T00:00:00.000Z'
      const resized = resizeEvent({ localizer, start: adStart, end: adEnd, allDay: true, edge: 'start', target, mode: 'day', step })
      sameDay(resized.start, target)
      expect(resized.end).toBe(adEnd)
    })

    it('moves the end to the dropped day, keeping the start (end edge)', () => {
      const target = '2026-06-20T00:00:00.000Z'
      const resized = resizeEvent({ localizer, start: adStart, end: adEnd, allDay: true, edge: 'end', target, mode: 'day', step })
      expect(resized.start).toBe(adStart)
      sameDay(resized.end, target)
    })

    it('preserves time-of-day on a timed multi-day event (start edge)', () => {
      const tStart = '2026-06-15T09:00:00.000Z'
      const tEnd = '2026-06-17T11:00:00.000Z'
      const target = '2026-06-12T00:00:00.000Z'
      const resized = resizeEvent({ localizer, start: tStart, end: tEnd, allDay: false, edge: 'start', target, mode: 'day', step })
      sameDay(resized.start, target)
      expect(localizer.getMinutesFromMidnight(resized.start)).toBe(9 * 60)
      expect(resized.end).toBe(tEnd)
    })

    it('clamps the start to a one-day minimum when dragged past the end', () => {
      const target = '2026-06-25T00:00:00.000Z'
      const resized = resizeEvent({ localizer, start: adStart, end: adEnd, allDay: true, edge: 'start', target, mode: 'day', step })
      // Start clamps to the end's day (a 1-day event), never beyond.
      sameDay(resized.start, adEnd)
    })

    it('clamps the end to a one-day minimum when dragged before the start', () => {
      const target = '2026-06-10T00:00:00.000Z'
      const resized = resizeEvent({ localizer, start: adStart, end: adEnd, allDay: true, edge: 'end', target, mode: 'day', step })
      sameDay(resized.end, adStart)
    })

    it('resizes across a week boundary (absolute day target)', () => {
      // Drop the end 9 days past the original end (the next week row).
      const target = '2026-06-26T00:00:00.000Z'
      const resized = resizeEvent({ localizer, start: adStart, end: adEnd, allDay: true, edge: 'end', target, mode: 'day', step })
      sameDay(resized.end, target)
      expect(localizer.diff({ a: resized.end, b: adStart, unit: 'day' })).toBe(11)
    })
  })
})

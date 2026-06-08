import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { moveEvent } from './moveEvent.function'

describe.each(LOCALIZER_CASES)('moveEvent [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    localizer = await create()
  })

  describe('time mode (snap to instant, preserve duration)', () => {
    it('snaps the start to the target and keeps the exact duration', () => {
      const start = '2026-06-15T09:00:00.000Z'
      const end = '2026-06-15T10:30:00.000Z'
      const target = '2026-06-16T14:00:00.000Z'
      const moved = moveEvent({ localizer, start, end, allDay: false, target, mode: 'time' })
      expect(moved.start).toBe(target)
      const durationMs = localizer.diff({ a: end, b: start, unit: 'millisecond' })
      expect(moved.end).toBe(localizer.add({ value: target, amount: durationMs, unit: 'millisecond' }))
      expect(localizer.diff({ a: moved.end, b: moved.start, unit: 'minute' })).toBe(90)
      expect(moved.allDay).toBe(false)
    })

    it('preserves a sub-hour duration to the minute', () => {
      const moved = moveEvent({
        localizer,
        start: '2026-06-15T09:05:00.000Z',
        end: '2026-06-15T09:20:00.000Z',
        allDay: false,
        target: '2026-06-15T11:00:00.000Z',
        mode: 'time',
      })
      expect(localizer.diff({ a: moved.end, b: moved.start, unit: 'minute' })).toBe(15)
    })

    it('keeps the allDay flag untouched', () => {
      const moved = moveEvent({
        localizer,
        start: '2026-06-15T00:00:00.000Z',
        end: '2026-06-15T23:59:59.999Z',
        allDay: true,
        target: '2026-06-20T00:00:00.000Z',
        mode: 'time',
      })
      expect(moved.allDay).toBe(true)
    })
  })

  describe('day mode (whole-day shift, preserve time-of-day)', () => {
    it('shifts both ends forward by the day delta, keeping the time', () => {
      const start = '2026-06-15T09:00:00.000Z'
      const end = '2026-06-15T10:30:00.000Z'
      // The target carries a time-of-day to prove only its DAY is used.
      const moved = moveEvent({ localizer, start, end, allDay: false, target: '2026-06-18T23:00:00.000Z', mode: 'day' })
      expect(moved.start).toBe(localizer.add({ value: start, amount: 3, unit: 'day' }))
      expect(moved.end).toBe(localizer.add({ value: end, amount: 3, unit: 'day' }))
    })

    it('shifts backward for an earlier target day', () => {
      const start = '2026-06-15T09:00:00.000Z'
      const moved = moveEvent({
        localizer,
        start,
        end: '2026-06-15T10:30:00.000Z',
        allDay: false,
        target: '2026-06-12T00:00:00.000Z',
        mode: 'day',
      })
      expect(moved.start).toBe(localizer.add({ value: start, amount: -3, unit: 'day' }))
    })

    it('does not shift the instant when dropped on the same day', () => {
      const start = '2026-06-15T09:00:00.000Z'
      const end = '2026-06-15T10:30:00.000Z'
      const moved = moveEvent({ localizer, start, end, allDay: false, target: '2026-06-15T18:00:00.000Z', mode: 'day' })
      // A whole-day shift re-serializes (Temporal drops a zero `.000`), so compare
      // the instant, not the string form: zero day delta means no movement.
      expect(localizer.diff({ a: moved.start, b: start, unit: 'millisecond' })).toBe(0)
      expect(localizer.diff({ a: moved.end, b: end, unit: 'millisecond' })).toBe(0)
    })

    it('shifts a multi-day event, preserving its span', () => {
      const start = '2026-06-15T09:00:00.000Z'
      const end = '2026-06-17T11:00:00.000Z'
      const moved = moveEvent({ localizer, start, end, allDay: true, target: '2026-06-20T00:00:00.000Z', mode: 'day' })
      expect(moved.start).toBe(localizer.add({ value: start, amount: 5, unit: 'day' }))
      expect(moved.end).toBe(localizer.add({ value: end, amount: 5, unit: 'day' }))
      expect(localizer.diff({ a: moved.end, b: moved.start, unit: 'day' })).toBe(
        localizer.diff({ a: end, b: start, unit: 'day' }),
      )
      expect(moved.allDay).toBe(true)
    })
  })
})

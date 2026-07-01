import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { placeExternalEvent } from './placeExternalEvent.function'

describe.each(LOCALIZER_CASES)('placeExternalEvent [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    localizer = await create()
  })

  const target = '2026-06-15T09:00:00.000Z'
  const step = 30

  it('starts the event at the dropped slot and runs for the payload duration', () => {
    const placed = placeExternalEvent({ localizer, target, durationMinutes: 90, step })
    expect(placed.start).toBe(target)
    expect(localizer.diff({ a: placed.end, b: placed.start, unit: 'minute' })).toBe(90)
    expect(placed.allDay).toBe(false)
  })

  it('falls back to a one-slot duration when none is supplied (native drag)', () => {
    const placed = placeExternalEvent({ localizer, target, step })
    expect(placed.start).toBe(target)
    expect(localizer.diff({ a: placed.end, b: placed.start, unit: 'minute' })).toBe(step)
  })

  it('treats a zero/negative duration as one slot, never collapsing the event', () => {
    expect(localizer.diff({ a: placeExternalEvent({ localizer, target, durationMinutes: 0, step }).end, b: target, unit: 'minute' })).toBe(step)
    expect(localizer.diff({ a: placeExternalEvent({ localizer, target, durationMinutes: -15, step }).end, b: target, unit: 'minute' })).toBe(step)
  })

  it('carries the allDay flag through unchanged', () => {
    expect(placeExternalEvent({ localizer, target, durationMinutes: 60, allDay: true, step }).allDay).toBe(true)
  })

  it('spans a day boundary when the drop sits near the bottom of a column', () => {
    // 23:00 + 180 min → 02:00 the next day; the absolute instant makes this free.
    const lateTarget = '2026-06-15T23:00:00.000Z'
    const placed = placeExternalEvent({ localizer, target: lateTarget, durationMinutes: 180, step })
    expect(placed.start).toBe(lateTarget)
    expect(localizer.diff({ a: placed.end, b: placed.start, unit: 'minute' })).toBe(180)
  })

  it('derives the duration from a start/end template when none is supplied (time mode)', () => {
    const placed = placeExternalEvent({
      localizer,
      target,
      start: '2026-01-01T09:00:00.000Z',
      end: '2026-01-01T10:15:00.000Z',
      step,
    })
    expect(placed.start).toBe(target)
    expect(localizer.diff({ a: placed.end, b: placed.start, unit: 'minute' })).toBe(75)
  })

  describe("day mode (month drop)", () => {
    const day = '2026-06-15T00:00:00.000Z'

    it('creates a whole-day event on the dropped day when the payload has no template', () => {
      const placed = placeExternalEvent({ localizer, target: day, mode: 'day', step })
      expect(placed.allDay).toBe(true)
      expect(placed.start).toBe(localizer.startOf({ value: day, unit: 'day' }))
      expect(placed.end).toBe(localizer.endOf({ value: day, unit: 'day' }))
    })

    it('keeps the template time-of-day, moves the date to the dropped day, preserves duration', () => {
      // A "9:00–10:30" task dropped on the 15th → 9:00–10:30 on the 15th. Derive
      // expectations via the localizer (Temporal drops trailing `.000` ms).
      const placed = placeExternalEvent({
        localizer,
        target: day,
        mode: 'day',
        start: '2026-02-03T09:00:00.000Z',
        end: '2026-02-03T10:30:00.000Z',
        step,
      })
      expect(placed.allDay).toBe(false)
      expect(localizer.startOf({ value: placed.start, unit: 'day' })).toBe(localizer.startOf({ value: day, unit: 'day' }))
      expect(localizer.getMinutesFromMidnight(placed.start)).toBe(9 * 60)
      expect(localizer.diff({ a: placed.end, b: placed.start, unit: 'minute' })).toBe(90)
    })

    it('uses the day of `target`, not its time-of-day, to anchor the template', () => {
      // Dropping anywhere on the 15th places the template's own time-of-day.
      const placed = placeExternalEvent({
        localizer,
        target: '2026-06-15T17:45:00.000Z',
        mode: 'day',
        start: '2026-02-03T08:00:00.000Z',
        end: '2026-02-03T08:30:00.000Z',
        step,
      })
      expect(localizer.startOf({ value: placed.start, unit: 'day' })).toBe(localizer.startOf({ value: day, unit: 'day' }))
      expect(localizer.getMinutesFromMidnight(placed.start)).toBe(8 * 60)
    })
  })
})

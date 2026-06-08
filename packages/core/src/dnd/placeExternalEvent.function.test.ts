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
})

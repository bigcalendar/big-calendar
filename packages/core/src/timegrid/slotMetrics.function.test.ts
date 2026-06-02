import type { LocalizerContract } from '@big-calendar/localizer'
import { describe, expect, it } from 'vitest'
import { createSlotMetrics } from './slotMetrics.function'

const MIN_MS = 60_000
const DAY_MS = 86_400_000
const ms = (v: string): number => new Date(v).getTime()
const iso = (n: number): string => new Date(n).toISOString()
const startOfDay = (v: string): string => {
  const d = new Date(v)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}
const ceilDay = (v: string): string => (startOfDay(v) === v ? v : iso(ms(startOfDay(v)) + DAY_MS))

/**
 * Minute-accurate UTC localizer double for the time grid (no DST). Implements
 * exactly the methods slot metrics + the time-grid model call. Lives in a test
 * file → out of coverage; exported so the time-grid test can reuse it.
 */
export function makeTimeLocalizer(): LocalizerContract {
  return {
    getTotalMin: ({ start, end }: { start: string; end: string }) => (ms(end) - ms(start)) / MIN_MS,
    getMinutesFromMidnight: (v: string) => (ms(v) - ms(startOfDay(v))) / MIN_MS,
    getSlotDate: ({ date, minutesFromMidnight }: { date: string; minutesFromMidnight: number }) =>
      iso(ms(startOfDay(date)) + minutesFromMidnight * MIN_MS),
    getDstOffset: () => 0,
    diff: ({ a, b, unit }: { a: string; b: string; unit: string }) =>
      unit === 'minute'
        ? Math.round((ms(b) - ms(a)) / MIN_MS)
        : unit === 'day'
          ? Math.round((ms(b) - ms(a)) / DAY_MS)
          : 0,
    add: ({ value, amount, unit }: { value: string; amount: number; unit: string }) =>
      unit === 'day'
        ? iso(ms(value) + amount * DAY_MS)
        : unit === 'minute'
          ? iso(ms(value) + amount * MIN_MS)
          : value,
    startOf: ({ value, unit }: { value: string; unit: string }) =>
      unit === 'day' ? startOfDay(value) : value,
    ceil: ({ value, unit }: { value: string; unit: string }) =>
      unit === 'day' ? ceilDay(value) : value,
    min: ({ values }: { values: string[] }) =>
      values.reduce((acc, v) => (ms(v) < ms(acc) ? v : acc)),
    max: ({ values }: { values: string[] }) =>
      values.reduce((acc, v) => (ms(v) > ms(acc) ? v : acc)),
    eq: ({ a, b }: { a: string; b: string }) => ms(a) === ms(b),
    isSameDate: ({ a, b }: { a: string; b: string }) => startOfDay(a) === startOfDay(b),
    daySpan: ({ start, end }: { start: string; end: string }) =>
      Math.max(1, Math.round((ms(ceilDay(end)) - ms(startOfDay(start))) / DAY_MS)),
    inEventRange: ({
      event,
      range,
    }: {
      event: { start: string; end: string }
      range: { start: string; end: string }
    }) => ms(event.start) < ms(range.end) && ms(event.end) > ms(range.start),
    startAndEndAreDateOnly: ({ start, end }: { start: string; end: string }) =>
      ms(start) === ms(startOfDay(start)) && ms(end) === ms(startOfDay(end)),
    sortEvents: ({ events }: { events: { start: string; end: string }[] }) =>
      [...events].sort((a, b) => ms(a.start) - ms(b.start) || ms(b.end) - ms(a.end)),
  } as unknown as LocalizerContract
}

const localizer = makeTimeLocalizer()
const day = '2026-06-15T00:00:00.000Z'
const at = (h: number, m = 0): string => `2026-06-15T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`
const nextMidnight = '2026-06-16T00:00:00.000Z'

describe('createSlotMetrics', () => {
  it('derives slot counts for a full day at 30-min steps', () => {
    const m = createSlotMetrics({ localizer, min: day, max: nextMidnight, step: 30, timeslots: 2 })
    expect(m.numSlots).toBe(48)
    expect(m.totalMin).toBe(1441)
    expect(m.slots).toHaveLength(49)
    expect(m.slots[0]).toBe(day)
    expect(m.slots.at(-1)).toBe(nextMidnight)
  })

  it('positions an event as fractions of the column', () => {
    const m = createSlotMetrics({ localizer, min: day, max: nextMidnight })
    const range = m.getRange({ start: at(9), end: at(10) })
    expect(range.top).toBeCloseTo(0.375) // 9h / 24h
    expect(range.height).toBeCloseTo(1 / 24) // one hour
    expect(range.start).toBe(540)
    expect(range.end).toBe(600)
  })

  it('clamps an event that starts before the window to the top', () => {
    const m = createSlotMetrics({ localizer, min: at(8), max: at(18) })
    const range = m.getRange({ start: at(6), end: at(9) })
    expect(range.top).toBe(0)
    expect(range.startDate).toBe(at(8))
  })

  it('nudges a range that overruns the window up by one step', () => {
    const m = createSlotMetrics({ localizer, min: day, max: nextMidnight, step: 30, timeslots: 2 })
    // ignoreMax keeps the (overrunning) end, triggering the nudge branch
    const range = m.getRange({ start: at(23), end: '2026-06-16T05:00:00.000Z', ignoreMax: true })
    expect(range.top).toBeCloseTo((1380 - 30) / 1440)
  })

  it('reports the current-time position as a fraction', () => {
    const m = createSlotMetrics({ localizer, min: day, max: nextMidnight })
    expect(m.getCurrentTimePosition(at(12))).toBeCloseTo(0.5)
  })
})

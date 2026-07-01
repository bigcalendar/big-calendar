import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { createSlotMetrics } from './slotMetrics.function'

const day = '2026-06-15T00:00:00.000Z'
const at = (h: number, m = 0): string => `2026-06-15T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`
const nextMidnight = '2026-06-16T00:00:00.000Z'

describe.each(LOCALIZER_CASES)('createSlotMetrics [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    // UTC, so there is no DST term and slot positions are pure wall-clock.
    localizer = await create()
  })

  it('derives slot counts for a full day at 30-min steps', () => {
    const m = createSlotMetrics({ localizer, min: day, max: nextMidnight, step: 30, timeslots: 2 })
    expect(m.numSlots).toBe(48)
    expect(m.totalMin).toBe(1441)
    expect(m.slots).toHaveLength(49)
    // slot boundaries are rebuilt from midnight via getSlotDate — compare to the
    // localizer's own serialization rather than a literal Z string.
    expect(m.slots[0]).toBe(localizer.getSlotDate({ date: day, minutesFromMidnight: 0 }))
    expect(m.slots.at(-1)).toBe(localizer.getSlotDate({ date: day, minutesFromMidnight: 1440 }))
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

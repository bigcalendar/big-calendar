import { beforeAll, describe, expect, it } from 'vitest'
import { DEFAULT_ACCESSORS } from '../accessors/accessors.function'
import type { Accessors } from '../accessors/accessors.type'
import { Views } from '../constants/views.constant'
import { LOCALIZER_CASES } from '../testing/localizers'
import { buildViewModel } from './viewModel.function'

interface Event {
  id: number
  title: string
  start: string
  end: string
}

const accessors = DEFAULT_ACCESSORS as unknown as Accessors<Event, unknown>

const day = '2026-06-15T00:00:00.000Z'
const events: Event[] = [
  { id: 1, title: 'e1', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
]

describe.each(LOCALIZER_CASES)('buildViewModel [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  // `n` consecutive days from `day`, stepped through the localizer (no Date).
  const days = (n: number): string[] => Array.from({ length: n }, (_, i) => localizer.add({ value: day, amount: i, unit: 'day' }))
  beforeAll(async () => {
    localizer = await create()
  })

  it('dispatches month to a month model', () => {
    const vm = buildViewModel({ localizer, accessors, view: Views.MONTH, days: days(35), events })
    expect(vm.kind).toBe('month')
    if (vm.kind === 'month') expect(vm.month.weeks).toHaveLength(5)
  })

  it('dispatches day/week/work_week to a time-grid model', () => {
    const dayVm = buildViewModel({ localizer, accessors, view: Views.DAY, days: [day], events })
    expect(dayVm.kind).toBe('time')
    if (dayVm.kind === 'time') expect(dayVm.timeGrid.columns).toHaveLength(1)

    const weekVm = buildViewModel({ localizer, accessors, view: Views.WEEK, days: days(7), events })
    if (weekVm.kind === 'time') expect(weekVm.timeGrid.columns).toHaveLength(7)

    const workVm = buildViewModel({
      localizer,
      accessors,
      view: Views.WORK_WEEK,
      days: days(5),
      events,
    })
    expect(workVm.view).toBe(Views.WORK_WEEK)
    expect(workVm.kind).toBe('time')
  })

  it('dispatches agenda to an agenda model', () => {
    const vm = buildViewModel({ localizer, accessors, view: Views.AGENDA, days: days(30), events })
    expect(vm.kind).toBe('agenda')
    if (vm.kind === 'agenda') expect(vm.agenda.days[0]?.events[0]?.id).toBe(1)
  })

  it('passes options through to the time-grid builder', () => {
    const vm = buildViewModel({
      localizer,
      accessors,
      view: Views.DAY,
      days: [day],
      events,
      options: { dayStartMin: 8 * 60, dayEndMin: 18 * 60, dayLayoutAlgorithm: 'no-overlap' },
    })
    if (vm.kind === 'time') {
      expect(vm.timeGrid.columns[0]?.min).toBe(localizer.getSlotDate({ date: day, minutesFromMidnight: 8 * 60 }))
      expect(vm.timeGrid.columns[0]?.events[0]?.top).toBeCloseTo(0.1) // 9am in 8–6 window
    }
  })
})

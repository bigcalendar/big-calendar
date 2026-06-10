import { beforeAll, describe, expect, it } from 'vitest'
import { resolveAccessors } from '../accessors/accessors.function'
import { Navigate } from '../constants/views.constant'
import { navigateDate } from '../store/navigateDate.function'
import { createCalendarStore } from '../store/createCalendarStore.function'
import { viewLabel } from '../store/viewLabel.function'
import { viewRange } from '../store/viewRange.function'
import { LOCALIZER_CASES } from '../testing/localizers'
import { buildViewModel } from './viewModel.function'
import { defineView } from './viewRegistry.function'
import type { ViewRegistry } from './viewRegistry.type'

interface Event {
  id: number
  title: string
  start: string
  end: string
}

/** Model the demo "3-day" custom view produces. */
interface ThreeDayModel {
  dayCount: number
  eventCount: number
}

// 2026-06-15 is a Monday.
const focus = '2026-06-15T10:30:00.000Z'

describe.each(LOCALIZER_CASES)('view registry [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  let registry: ViewRegistry<Event>
  beforeAll(async () => {
    localizer = await create()
    // A simple custom view: three consecutive days, stepping by three.
    const threeDay = defineView<Event>()({
      range: ({ localizer: l, date }) => {
        const start = l.startOf({ value: date, unit: 'day' })
        const last = l.add({ value: start, amount: 2, unit: 'day' })
        return { firstVisibleDay: start, lastVisibleDay: last, days: l.range({ start, end: last, unit: 'day' }) }
      },
      navigate: ({ localizer: l, date, direction }) => {
        const sign = direction === Navigate.NEXT ? 1 : -1
        return l.add({ value: date, amount: sign * 3, unit: 'day' })
      },
      label: ({ localizer: l, range }) =>
        `${l.format({ value: range.firstVisibleDay, format: 'monthDay' })} (3-day)`,
      buildModel: ({ days, events }): ThreeDayModel => ({ dayCount: days.length, eventCount: events.length }),
    })
    registry = { '3day': threeDay }
  })

  describe('defineView', () => {
    it('returns the definition unchanged (it is only a typing aid)', () => {
      const def = registry['3day']!
      expect(typeof def.range).toBe('function')
      expect(typeof def.navigate).toBe('function')
      expect(typeof def.label).toBe('function')
      expect(typeof def.buildModel).toBe('function')
    })
  })

  describe('viewRange', () => {
    it('delegates a non-built-in view to its registered definition', () => {
      const r = viewRange({ localizer, date: focus, view: '3day', registry })
      expect(r.days).toHaveLength(3)
      expect(r.firstVisibleDay).toBe(localizer.startOf({ value: focus, unit: 'day' }))
      expect(r.lastVisibleDay).toBe(r.days.at(-1))
    })

    it('throws for an unknown view when nothing is registered', () => {
      expect(() => viewRange({ localizer, date: focus, view: 'nope' })).toThrow(/unknown view "nope"/)
    })
  })

  describe('navigateDate', () => {
    it('steps a custom view by its definition for PREV/NEXT', () => {
      const next = navigateDate({ localizer, date: focus, direction: Navigate.NEXT, view: '3day', getNow: () => focus, registry })
      expect(next).toBe(localizer.add({ value: focus, amount: 3, unit: 'day' }))
      const prev = navigateDate({ localizer, date: focus, direction: Navigate.PREVIOUS, view: '3day', getNow: () => focus, registry })
      expect(prev).toBe(localizer.add({ value: focus, amount: -3, unit: 'day' }))
    })

    it('still handles TODAY/DATE universally for a custom view (no definition needed)', () => {
      const now = '2026-01-01T00:00:00.000Z'
      expect(navigateDate({ localizer, date: focus, direction: Navigate.TODAY, view: '3day', getNow: () => now })).toBe(now)
      const target = '2026-12-25T00:00:00.000Z'
      expect(navigateDate({ localizer, date: focus, direction: Navigate.DATE, view: '3day', getNow: () => now, target })).toBe(target)
    })

    it('throws for an unknown view step when nothing is registered', () => {
      expect(() =>
        navigateDate({ localizer, date: focus, direction: Navigate.NEXT, view: 'nope', getNow: () => focus }),
      ).toThrow(/unknown view "nope"/)
    })
  })

  describe('viewLabel', () => {
    it('delegates the title to a custom definition', () => {
      const range = viewRange({ localizer, date: focus, view: '3day', registry })
      expect(viewLabel({ localizer, view: '3day', date: focus, range, registry })).toMatch(/\(3-day\)$/)
    })

    it('throws for an unknown view when nothing is registered', () => {
      const range = viewRange({ localizer, date: focus, view: '3day', registry })
      expect(() => viewLabel({ localizer, view: 'nope', date: focus, range })).toThrow(/unknown view "nope"/)
    })
  })

  describe('buildViewModel', () => {
    const accessors = () => resolveAccessors<Event, unknown>()
    const events: Event[] = [
      { id: 1, title: 'A', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' },
      { id: 2, title: 'B', start: '2026-06-16T09:00:00.000Z', end: '2026-06-16T10:00:00.000Z' },
    ]

    it('builds a custom view model tagged kind:"custom" with the view key and plugin model', () => {
      const days = viewRange({ localizer, date: focus, view: '3day', registry }).days
      const vm = buildViewModel<Event>({ localizer, accessors: accessors(), view: '3day', days, events, date: focus, registry })
      expect(vm.kind).toBe('custom')
      expect(vm.view).toBe('3day')
      if (vm.kind !== 'custom') throw new Error('expected custom')
      expect(vm.model).toEqual<ThreeDayModel>({ dayCount: 3, eventCount: 2 })
    })

    it('falls back to days[0] for the focus date when none is passed', () => {
      const days = viewRange({ localizer, date: focus, view: '3day', registry }).days
      const vm = buildViewModel<Event>({ localizer, accessors: accessors(), view: '3day', days, events: [], registry })
      expect(vm.kind).toBe('custom')
    })

    it('throws for an unknown view when nothing is registered', () => {
      expect(() =>
        buildViewModel<Event>({ localizer, accessors: accessors(), view: 'nope', days: [focus], events: [] }),
      ).toThrow(/unknown view "nope"/)
    })
  })

  describe('store integration', () => {
    it('drives range / label / viewModel / navigate for a registered custom view', () => {
      const store = createCalendarStore<Event>({
        localizer,
        date: focus,
        view: '3day',
        viewDefinitions: registry,
        events: [{ id: 1, title: 'A', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' }],
      })

      expect(store.range.value.days).toHaveLength(3)
      expect(store.label.value).toMatch(/\(3-day\)$/)
      const vm = store.viewModel.value
      expect(vm.kind).toBe('custom')
      if (vm.kind !== 'custom') throw new Error('expected custom')
      expect(vm.model).toEqual<ThreeDayModel>({ dayCount: 3, eventCount: 1 })

      store.navigate({ direction: Navigate.NEXT })
      expect(store.date.value).toBe(localizer.add({ value: focus, amount: 3, unit: 'day' }))
      // the model recomputes against the new range (still three days; this demo
      // builder counts all events, so the count is unchanged)
      const after = store.viewModel.value
      if (after.kind !== 'custom') throw new Error('expected custom')
      expect(after.model).toEqual<ThreeDayModel>({ dayCount: 3, eventCount: 1 })

      store.destroy()
    })
  })
})

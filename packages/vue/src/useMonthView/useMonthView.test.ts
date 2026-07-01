import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import { defineComponent, h } from 'vue'
import type { Component } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import CalendarProvider from '../CalendarProvider/CalendarProvider.vue'
import type { UseMonthViewReturn } from './useMonthView'
import { useMonthView } from './useMonthView'

function makeWrapper(
  localizer: LocalizerContract,
  defaultView: string,
  child: ReturnType<typeof defineComponent>,
) {
  return mount(
    defineComponent({
      setup() {
        return () =>
          h(CalendarProvider as Component, { localizer, defaultView }, {
            default: () => h(child),
          })
      },
    }),
  )
}

describe.each(LOCALIZER_CASES)('useMonthView [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('grid is null when the active view is week', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useMonthView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.grid.value).toBeNull()
  })

  it('grid is non-null when the active view is month', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useMonthView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.MONTH, Probe)
    expect(result!.grid.value).not.toBeNull()
  })

  it('month grid has 7 weekdays', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useMonthView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.MONTH, Probe)
    expect(result!.grid.value!.weekdays).toHaveLength(7)
  })

  it('month grid has at least 4 weeks', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useMonthView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.MONTH, Probe)
    expect(result!.grid.value!.weeks.length).toBeGreaterThanOrEqual(4)
  })

  it('returns correct class names for static layout props', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useMonthView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.MONTH, Probe)
    expect(result!.root.class).toBe('bc-month')
    expect(result!.monthHeader.class).toBe('bc-month-header')
    expect(result!.monthGrid.class).toContain('bc-month-grid')
    expect(result!.weekRow.class).toBe('bc-month-week')
    expect(result!.slotsContainer.class).toBe('bc-month-slots')
    expect(result!.eventsContainer.class).toBe('bc-week-events')
  })

  it('messages computed ref exposes showMore function', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useMonthView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.MONTH, Probe)
    expect(typeof result!.messages.value.showMore).toBe('function')
    expect(typeof result!.messages.value.showMore(3)).toBe('string')
  })

  it('getDaySlotProps returns correct data attributes and tabIndex', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useMonthView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.MONTH, Probe)
    const fakeCell = { day: '2024-01-15', label: '15', isToday: false, isOffRange: false, extra: null }
    const props = result!.getDaySlotProps(fakeCell, 2, 3)
    expect(props.class).toBe('bc-month-slot')
    expect(props['data-date']).toBe('2024-01-15')
    expect(props['data-slot-index']).toBe(17) // 2*7+3
  })

  it('getSegmentProps returns class and style with correct resize edges', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useMonthView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.MONTH, Probe)
    const fakeSegment = {
      key: 'k',
      event: {},
      title: 'Test',
      left: 2,
      span: 3,
      row: 1,
      resizeStart: true,
      resizeEnd: false,
    }
    const props = result!.getSegmentProps(fakeSegment)
    expect(props.class).toBe('bc-segment')
    expect(typeof props.style).toBe('object')
    expect(props.resizeEdges).toEqual(['start'])
  })

  it('getShowMoreCellProps returns null when cell has no extra', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useMonthView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.MONTH, Probe)
    const cell = { day: '2024-01-01', label: '1', isToday: false, isOffRange: false, extra: null }
    expect(result!.getShowMoreCellProps(cell, 0, 2)).toBeNull()
  })

  it('getShowMoreCellProps returns props when cell has extra', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useMonthView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.MONTH, Probe)
    const cell = {
      day: '2024-01-01',
      label: '1',
      isToday: false,
      isOffRange: false,
      extra: { count: 3, events: [{ key: 'a', event: {}, title: 'E' }] },
    }
    const props = result!.getShowMoreCellProps(cell, 1, 3)
    expect(props).not.toBeNull()
    expect(props!.class).toBe('bc-show-more-cell')
    expect(props!.count).toBe(3)
    expect(typeof props!.label).toBe('string')
  })

  it('getWeekSelectionBand returns null when no selection is active', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useMonthView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.MONTH, Probe)
    expect(result!.getWeekSelectionBand(0)).toBeNull()
  })

  it('drilldown is a callable function', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useMonthView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.MONTH, Probe)
    expect(() => result!.drilldown('2024-01-01')).not.toThrow()
  })
})

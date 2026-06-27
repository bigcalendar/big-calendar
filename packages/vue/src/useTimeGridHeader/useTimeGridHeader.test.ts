import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import { defineComponent, h } from 'vue'
import type { Component } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'
import CalendarProvider from '../CalendarProvider/CalendarProvider.vue'
import { LOCALIZER_CASES } from '../testing/localizers'
import { useTimeGridView } from '../useTimeGridView'
import type { UseTimeGridViewReturn } from '../useTimeGridView'

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

describe.each(LOCALIZER_CASES)('useTimeGridHeader [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('timeHead has class bc-time-head', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.header.timeHead.class).toBe('bc-time-head')
  })

  it('allDayRow has class bc-allday-row', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.header.allDayRow.class).toBe('bc-allday-row')
  })

  it('allDayRow exposes onKeydown and onFocusCapture handlers', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(typeof result!.header.allDayRow.onKeydown).toBe('function')
    expect(typeof result!.header.allDayRow.onFocusCapture).toBe('function')
    expect(typeof result!.header.allDayRow.onPointerdown).toBe('function')
  })

  it('allDaySelectionBand is null when no selection is active', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.header.allDaySelectionBand).toBeNull()
  })

  it('getAllDaySlotProps returns correct data attributes', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const fakeColumn = {
      key: '0', day: '2024-01-15', resourceId: null,
      min: '', max: '', isToday: false,
      events: [], backgroundEvents: [], nowTop: null, slots: [],
    }
    const props = result!.header.getAllDaySlotProps(fakeColumn, 2)
    expect(props.class).toBe('bc-allday-slot')
    expect(props['data-date']).toBe('2024-01-15')
    expect(props['data-slot-index']).toBe(2)
    expect(props['data-bc-allday']).toBe('2024-01-15')
    expect(typeof props.tabIndex).toBe('number')
  })

  it('getAllDaySlotProps adds bc-today class for today column', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const todayColumn = {
      key: '0', day: '2024-01-15', resourceId: null,
      min: '', max: '', isToday: true,
      events: [], backgroundEvents: [], nowTop: null, slots: [],
    }
    const props = result!.header.getAllDaySlotProps(todayColumn, 0)
    expect(props.class).toContain('bc-today')
  })

  it('resourceHeaderLabel has class bc-resource-header-label', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.header.resourceHeaderLabel.class).toBe('bc-resource-header-label')
  })

  it('getHeadingProps enriches heading with onDrillDown callback', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const heading = { day: '2024-01-15', label: 'Mon Jan 15', isToday: false }
    const props = result!.header.getHeadingProps(heading)
    expect(typeof props.onDrillDown).toBe('function')
    expect(() => props.onDrillDown()).not.toThrow()
  })

  it('getAllDaySegmentProps returns class bc-segment with style', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const seg = { key: 'a', event: {}, title: 'Test', left: 1, span: 2, row: 1, resizeStart: false, resizeEnd: false }
    const props = result!.header.getAllDaySegmentProps(seg)
    expect(props.class).toBe('bc-segment')
    expect(typeof props.style).toBe('object')
  })

  it('getStackedSegmentProps returns bc-segment bc-segment-stacked', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const seg = { key: 'a', event: {}, title: 'Test', left: 1, span: 1, row: 1, resizeStart: false, resizeEnd: false }
    const props = result!.header.getStackedSegmentProps(seg)
    expect(props.class).toBe('bc-segment bc-segment-stacked')
  })

  it('allDaySlots has class bc-allday-slots', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.header.allDaySlots.class).toBe('bc-allday-slots')
  })

  it('drilldown is callable', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(() => result!.header.drilldown('2024-01-15')).not.toThrow()
  })
})

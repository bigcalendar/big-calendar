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

describe.each(LOCALIZER_CASES)('useTimeGridBody [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('body has class bc-time-body', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.body.body.class).toBe('bc-time-body')
  })

  it('body exposes onKeydown, onFocusCapture, onPointerdown handlers', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(typeof result!.body.body.onKeydown).toBe('function')
    expect(typeof result!.body.body.onFocusCapture).toBe('function')
    expect(typeof result!.body.body.onPointerdown).toBe('function')
  })

  it('gutter has class bc-time-gutter', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.body.gutter.class).toBe('bc-time-gutter')
  })

  it('getColumnProps adds bc-today for today columns', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const today = { key: 'k', day: '2024-01-15', resourceId: null, min: '', max: '', isToday: true, events: [], backgroundEvents: [], nowTop: null, slots: [] }
    const notToday = { ...today, isToday: false }
    expect(result!.body.getColumnProps(today).class).toContain('bc-today')
    expect(result!.body.getColumnProps(notToday).class).not.toContain('bc-today')
  })

  it('getSlotProps returns correct data attributes and tabIndex', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const col = { key: 'k', day: '2024-01-15', resourceId: null, min: '', max: '', isToday: false, events: [], backgroundEvents: [], nowTop: null, slots: ['2024-01-15T08:00:00Z', '2024-01-15T08:30:00Z'] }
    const props = result!.body.getSlotProps(col, 0, 1)
    expect(props.class).toBe('bc-time-slot')
    expect(props['data-date']).toBe('2024-01-15')
    expect(typeof props['data-slot-index']).toBe('number')
    expect(typeof props.tabIndex).toBe('number')
  })

  it('getResourceSlotProps returns resource slot props', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const props = result!.body.getResourceSlotProps('2024-01-15', 3, '2024-01-15T09:00:00Z')
    expect(props.class).toBe('bc-time-slot')
    expect(props['data-date']).toBe('2024-01-15')
    expect(props['data-slot-index']).toBe(3)
  })

  it('getNowIndicatorProps returns null when nowTop is null', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const col = { key: 'k', day: '2024-01-15', resourceId: null, min: '', max: '', isToday: false, events: [], backgroundEvents: [], nowTop: null, slots: [] }
    expect(result!.body.getNowIndicatorProps(col)).toBeNull()
  })

  it('getNowIndicatorProps returns props when nowTop is set', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const col = { key: 'k', day: '2024-01-15', resourceId: null, min: '', max: '', isToday: true, events: [], backgroundEvents: [], nowTop: 0.5, slots: [] }
    const props = result!.body.getNowIndicatorProps(col)
    expect(props).not.toBeNull()
    expect(props!.class).toBe('bc-now-indicator')
  })

  it('getTimeSelectionDivProps returns null when no selection is active', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.body.getTimeSelectionDivProps(0)).toBeNull()
  })

  it('getResourceSelectionDivProps returns null when no selection is active', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.body.getResourceSelectionDivProps('room-1', '2024-01-15')).toBeNull()
  })

  it('getPreviewDivProps always returns null (deferred to 10-9)', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.body.getPreviewDivProps({ min: '', max: '' })).toBeNull()
  })

  it('getBgEventProps returns correct class string', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const bg = { key: 'bg', event: {}, title: '', top: 0.1, height: 0.2, left: 0, width: 1, isStart: true, isEnd: false }
    const props = result!.body.getBgEventProps(bg)
    expect(props.class).toContain('bc-bg-event')
    expect(props.class).toContain('bc-bg-event--start')
    expect(props.class).not.toContain('bc-bg-event--end')
  })

  it('getEventProps returns bc-event class with style and time', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const ev = { key: 'ev', event: {}, title: 'Test', time: '9:00 AM', top: 0.1, height: 0.05, left: 0, width: 0.5, zIndex: 1 }
    const props = result!.body.getEventProps(ev)
    expect(props.class).toBe('bc-event')
    expect(props.time).toBe('9:00 AM')
    expect(typeof props.style).toBe('object')
  })

  it('body style contains CSS custom property when slotCount > 0', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    // Week view has a real grid, so body.style should have entries
    if (result!.grid !== null) {
      expect(Object.keys(result!.body.body.style).length).toBeGreaterThan(0)
    }
  })
})

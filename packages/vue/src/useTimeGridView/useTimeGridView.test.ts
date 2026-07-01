import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import { defineComponent, h } from 'vue'
import type { Component } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import CalendarProvider from '../CalendarProvider/CalendarProvider.vue'
import type { UseTimeGridViewReturn } from './useTimeGridView'
import { useTimeGridView } from './useTimeGridView'

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

describe.each(LOCALIZER_CASES)('useTimeGridView [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('grid is null when active view is month', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.MONTH, Probe)
    expect(result!.grid.value).toBeNull()
  })

  it('grid is non-null when active view is week', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.grid.value).not.toBeNull()
  })

  it('root class is bc-time-grid for plain week view', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.root.class).toBe('bc-time-grid')
  })

  it('announcer has role=status and aria-live=polite', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.announcer.role).toBe('status')
    expect(result!.announcer['aria-live']).toBe('polite')
    expect(result!.announcer.class).toContain('bc-sr-only')
  })

  it('getRootStyle returns an object with CSS custom properties', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const style = result!.getRootStyle(7)
    expect(typeof style).toBe('object')
    expect(Object.keys(style).length).toBeGreaterThan(0)
  })

  it('header has timeHead with class bc-time-head', () => {
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

  it('body has gutter with class bc-time-gutter', () => {
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

  it('body getColumnProps returns bc-today class when column isToday', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const fakeColumn = {
      key: '0', day: '2024-01-01', resourceId: null,
      min: '', max: '', isToday: true,
      events: [], backgroundEvents: [], nowTop: null, slots: [],
    }
    expect(result!.body.getColumnProps(fakeColumn).class).toContain('bc-today')
  })

  it('selection divProps return null when no selection is active', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGridView()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.body.getTimeSelectionDivProps(0)).toBeNull()
    expect(result!.body.getPreviewDivProps({ min: '', max: '' })).toBeNull()
  })
})

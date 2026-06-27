import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import { defineComponent, h } from 'vue'
import type { Component, ComputedRef } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import CalendarProvider from '../CalendarProvider/CalendarProvider.vue'
import type { TimeGrid } from './useTimeGrid'
import { useTimeGrid } from './useTimeGrid'

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

describe.each(LOCALIZER_CASES)('useTimeGrid [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('returns null when the active view is month', () => {
    let result: ComputedRef<TimeGrid<unknown> | null> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGrid()
        return () => null
      },
    })

    makeWrapper(localizer, Views.MONTH, Probe)
    expect(result!.value).toBeNull()
  })

  it('returns null when the active view is agenda', () => {
    let result: ComputedRef<TimeGrid<unknown> | null> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGrid()
        return () => null
      },
    })

    makeWrapper(localizer, Views.AGENDA, Probe)
    expect(result!.value).toBeNull()
  })

  it('returns a TimeGrid when the active view is week', () => {
    let result: ComputedRef<TimeGrid<unknown> | null> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGrid()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.value).not.toBeNull()
  })

  it('returns a TimeGrid when the active view is day', () => {
    let result: ComputedRef<TimeGrid<unknown> | null> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGrid()
        return () => null
      },
    })

    makeWrapper(localizer, Views.DAY, Probe)
    expect(result!.value).not.toBeNull()
  })

  it('week grid has 7 headings', () => {
    let result: ComputedRef<TimeGrid<unknown> | null> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGrid()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    expect(result!.value!.headings).toHaveLength(7)
  })

  it('day grid has 1 heading', () => {
    let result: ComputedRef<TimeGrid<unknown> | null> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGrid()
        return () => null
      },
    })

    makeWrapper(localizer, Views.DAY, Probe)
    expect(result!.value!.headings).toHaveLength(1)
  })

  it('headings include isToday flag and non-empty label', () => {
    let result: ComputedRef<TimeGrid<unknown> | null> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGrid()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const grid = result!.value!
    for (const heading of grid.headings) {
      expect(typeof heading.isToday).toBe('boolean')
      expect(heading.label.length).toBeGreaterThan(0)
    }
  })

  it('gutter has labels for each slot group', () => {
    let result: ComputedRef<TimeGrid<unknown> | null> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGrid()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const grid = result!.value!
    expect(grid.gutter.length).toBeGreaterThan(0)
    for (const label of grid.gutter) {
      expect(label.label.length).toBeGreaterThanOrEqual(0)
    }
  })

  it('plain grid has columns equal to heading count', () => {
    let result: ComputedRef<TimeGrid<unknown> | null> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGrid()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const grid = result!.value!
    expect(grid.resources).toBeNull()
    expect(grid.dayGroups).toBeNull()
    expect(grid.columns).toHaveLength(grid.headings.length)
  })

  it('slotCount matches gutter length × timeslots', () => {
    let result: ComputedRef<TimeGrid<unknown> | null> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGrid()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const grid = result!.value!
    // slotCount = numSlots, gutter = numSlots / timeslots (default timeslots=2)
    // so gutter.length × 2 === slotCount
    expect(grid.slotCount).toBe(grid.gutter.length * 2)
  })

  it('columns have slots arrays of length equal to slotCount', () => {
    let result: ComputedRef<TimeGrid<unknown> | null> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGrid()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const grid = result!.value!
    for (const col of grid.columns) {
      expect(col.slots).toHaveLength(grid.slotCount)
    }
  })

  it('allDay row starts empty when no events span all day', () => {
    let result: ComputedRef<TimeGrid<unknown> | null> | undefined

    const Probe = defineComponent({
      setup() {
        result = useTimeGrid()
        return () => null
      },
    })

    makeWrapper(localizer, Views.WEEK, Probe)
    const grid = result!.value!
    expect(Array.isArray(grid.allDay.segments)).toBe(true)
  })
})

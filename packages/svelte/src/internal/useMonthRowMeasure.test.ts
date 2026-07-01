import { createCalendarStore } from '@big-calendar/core'
import type { CalendarStore } from '@big-calendar/core'
import { tick } from 'svelte'
import { render } from '@testing-library/svelte'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MonthRowMeasureProbe from './MonthRowMeasureProbe.test.svelte'

// ---------------------------------------------------------------------------
// ResizeObserver mock
// ---------------------------------------------------------------------------

type ROCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void

class MockResizeObserver {
  static instances: MockResizeObserver[] = []
  callback: ROCallback
  observed: Element[] = []
  disconnected = false

  constructor(cb: ROCallback) {
    this.callback = cb
    MockResizeObserver.instances.push(this)
  }

  observe(el: Element) {
    this.observed.push(el)
  }

  unobserve(el: Element) {
    this.observed = this.observed.filter((e) => e !== el)
  }

  disconnect() {
    this.disconnected = true
    this.observed = []
  }

  fire() {
    this.callback([] as ResizeObserverEntry[], this as unknown as ResizeObserver)
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { createLuxonLocalizer } from '@big-calendar/localizer-luxon'

function makeStore(limit = Infinity): CalendarStore<unknown> {
  const localizer = createLuxonLocalizer({ locale: 'en-US', timeZone: 'UTC' })
  const store = createCalendarStore({ localizer }) as CalendarStore<unknown>
  store.measuredWeekLimit.value = limit
  return store
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useMonthRowMeasure', () => {
  beforeEach(() => {
    MockResizeObserver.instances = []
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('attaches a ResizeObserver to the grid element on mount', async () => {
    const store = makeStore()

    render(MonthRowMeasureProbe, { props: { store, weekCount: 5 } })
    await tick()

    expect(MockResizeObserver.instances).toHaveLength(1)
    expect(MockResizeObserver.instances[0]!.observed).toHaveLength(1)
  })

  it('sets measuredWeekLimit to Infinity when weekCount is 0', async () => {
    const store = makeStore(3)

    render(MonthRowMeasureProbe, { props: { store, weekCount: 0 } })
    await tick()

    const ro = MockResizeObserver.instances[0]
    if (ro) ro.fire()

    expect(store.measuredWeekLimit.value).toBe(Infinity)
  })

  it('sets measuredWeekLimit to Infinity when .bc-week-events is absent', async () => {
    const store = makeStore(3)

    render(MonthRowMeasureProbe, { props: { store, weekCount: 5 } })
    await tick()

    // Remove all bc-week-events so the measure returns Infinity
    document.querySelectorAll('.bc-week-events').forEach((el) => el.remove())

    const ro = MockResizeObserver.instances[0]!
    ro.fire()

    expect(store.measuredWeekLimit.value).toBe(Infinity)
  })

  it('computes a positive limit when layout metrics are valid', async () => {
    const store = makeStore()

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      height: 1000, width: 0, top: 0, left: 0, bottom: 0, right: 0, x: 0, y: 0,
      toJSON: () => ({}),
    })
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      gridAutoRows: '30px',
      paddingBlockStart: '40px',
    } as unknown as CSSStyleDeclaration)

    render(MonthRowMeasureProbe, { props: { store, weekCount: 5 } })
    await tick()

    const ro = MockResizeObserver.instances[0]!
    ro.fire()

    expect(store.measuredWeekLimit.value).toBe(5)
  })

  it('clamps limit to at least 1 when available space is very small', async () => {
    const store = makeStore()

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      height: 50, width: 0, top: 0, left: 0, bottom: 0, right: 0, x: 0, y: 0,
      toJSON: () => ({}),
    })
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      gridAutoRows: '30px',
      paddingBlockStart: '40px',
    } as unknown as CSSStyleDeclaration)

    render(MonthRowMeasureProbe, { props: { store, weekCount: 1 } })
    await tick()

    const ro = MockResizeObserver.instances[0]!
    ro.fire()

    expect(store.measuredWeekLimit.value).toBe(1)
  })

  it('resets measuredWeekLimit to Infinity on unmount', async () => {
    const store = makeStore(3)

    const { unmount } = render(MonthRowMeasureProbe, { props: { store, weekCount: 5 } })
    await tick()

    await unmount()

    expect(store.measuredWeekLimit.value).toBe(Infinity)
  })

  it('disconnects the observer on unmount', async () => {
    const store = makeStore()

    const { unmount } = render(MonthRowMeasureProbe, { props: { store, weekCount: 5 } })
    await tick()

    const ro = MockResizeObserver.instances[0]!
    await unmount()

    expect(ro.disconnected).toBe(true)
  })
})

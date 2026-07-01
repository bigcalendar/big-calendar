import { signal } from '@preact/signals-core'
import { defineComponent, h, nextTick, shallowRef, computed } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CalendarStore } from '@big-calendar/core'
import { useMonthRowMeasure } from './useMonthRowMeasure'

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

function makeStore(limit = Infinity): Pick<CalendarStore<unknown>, 'measuredWeekLimit'> {
  return { measuredWeekLimit: signal(limit) }
}

function makeHarness(
  store: Pick<CalendarStore<unknown>, 'measuredWeekLimit'>,
  weekCount: number,
) {
  return defineComponent({
    setup() {
      const gridRef = shallowRef<HTMLElement | null>(null)
      const weekCountRef = computed(() => weekCount)
      useMonthRowMeasure({ gridRef, weekCount: weekCountRef, store: store as CalendarStore<unknown> })
      return () =>
        h('div', { ref: gridRef, 'data-testid': 'grid' },
          Array.from({ length: weekCount }, (_, i) =>
            h('div', { key: i, class: 'bc-month-week' },
              h('div', { class: 'bc-week-events' }),
            ),
          ),
        )
    },
  })
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
    mount(makeHarness(store, 5))
    await nextTick()
    expect(MockResizeObserver.instances).toHaveLength(1)
    expect(MockResizeObserver.instances[0]!.observed).toHaveLength(1)
  })

  it('sets measuredWeekLimit to Infinity when weekCount is 0', async () => {
    const store = makeStore(3)
    mount(makeHarness(store, 0))
    await nextTick()
    const ro = MockResizeObserver.instances[0]
    if (ro) ro.fire()
    expect(store.measuredWeekLimit.value).toBe(Infinity)
  })

  it('sets measuredWeekLimit to Infinity when .bc-week-events is absent', async () => {
    const store = makeStore(3)
    const Harness = defineComponent({
      setup() {
        const gridRef = shallowRef<HTMLElement | null>(null)
        const weekCountRef = computed(() => 5)
        useMonthRowMeasure({ gridRef, weekCount: weekCountRef, store: store as CalendarStore<unknown> })
        return () => h('div', { ref: gridRef, 'data-testid': 'grid' })
      },
    })
    mount(Harness)
    await nextTick()
    const ro = MockResizeObserver.instances[0]!
    ro.fire()
    expect(store.measuredWeekLimit.value).toBe(Infinity)
  })

  it('computes a positive limit when layout metrics are valid', async () => {
    const store = makeStore()

    // Grid: 5 rows × 200px = 1000px total.
    // Events container: paddingBlockStart=40px (header), gridAutoRows=30px (segment).
    // available = 200 - 40 = 160px; rows = floor(160/30) = 5; limit = 5.
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      height: 1000, width: 0, top: 0, left: 0, bottom: 0, right: 0, x: 0, y: 0,
      toJSON: () => ({}),
    })
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      gridAutoRows: '30px',
      paddingBlockStart: '40px',
    } as unknown as CSSStyleDeclaration)

    mount(makeHarness(store, 5))
    await nextTick()
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

    mount(makeHarness(store, 1))
    await nextTick()
    const ro = MockResizeObserver.instances[0]!
    ro.fire()

    expect(store.measuredWeekLimit.value).toBe(1)
  })

  it('resets measuredWeekLimit to Infinity on unmount', async () => {
    const store = makeStore(3)
    const wrapper = mount(makeHarness(store, 5))
    await nextTick()
    wrapper.unmount()
    expect(store.measuredWeekLimit.value).toBe(Infinity)
  })

  it('disconnects the observer on unmount', async () => {
    const store = makeStore()
    const wrapper = mount(makeHarness(store, 5))
    await nextTick()
    const ro = MockResizeObserver.instances[0]!
    wrapper.unmount()
    expect(ro.disconnected).toBe(true)
  })

  it('reconnects the observer when weekCount changes', async () => {
    const store = makeStore()
    const Harness = defineComponent({
      props: { weekCount: { type: Number, required: true } },
      setup(props) {
        const gridRef = shallowRef<HTMLElement | null>(null)
        const weekCountRef = computed(() => props.weekCount)
        useMonthRowMeasure({ gridRef, weekCount: weekCountRef, store: store as CalendarStore<unknown> })
        return () =>
          h('div', { ref: gridRef },
            Array.from({ length: props.weekCount }, (_, i) =>
              h('div', { key: i, class: 'bc-week-events' }),
            ),
          )
      },
    })

    const wrapper = mount(Harness, { props: { weekCount: 5 } })
    await nextTick()
    const firstRO = MockResizeObserver.instances[0]!

    await wrapper.setProps({ weekCount: 6 })
    await nextTick()

    expect(firstRO.disconnected).toBe(true)
    expect(MockResizeObserver.instances).toHaveLength(2)
    expect(MockResizeObserver.instances[1]!.observed).toHaveLength(1)
  })
})

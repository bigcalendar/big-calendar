import { signal } from '@preact/signals-core'
import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CalendarStore } from '@big-calendar/core'
import { useRef } from 'react'
import { useMonthRowMeasure } from './useMonthRowMeasure.hook'

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

  /** Manually trigger the callback as if the browser fired a resize. */
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

/** Minimal component that wires the hook to a <div> container with children. */
function Harness({
  store,
  weekCount,
}: {
  store: Pick<CalendarStore<unknown>, 'measuredWeekLimit'>
  weekCount: number
}) {
  const ref = useRef<HTMLElement | null>(null)
  useMonthRowMeasure({ gridRef: ref, weekCount, store: store as CalendarStore<unknown> })
  return (
    <div
      ref={(node) => { ref.current = node }}
      data-testid="grid"
    >
      {Array.from({ length: weekCount }, (_, i) => (
        <div key={i} className="bc-month-week">
          <div className="bc-week-events" />
        </div>
      ))}
    </div>
  )
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

  it('attaches a ResizeObserver to the grid element on mount', () => {
    const store = makeStore()
    render(<Harness store={store} weekCount={5} />)
    expect(MockResizeObserver.instances).toHaveLength(1)
    expect(MockResizeObserver.instances[0]!.observed).toHaveLength(1)
  })

  it('sets measuredWeekLimit to Infinity when weekCount is 0', () => {
    const store = makeStore(3)
    render(<Harness store={store} weekCount={0} />)
    const ro = MockResizeObserver.instances[0]!
    act(() => { ro.fire() })
    expect(store.measuredWeekLimit.value).toBe(Infinity)
  })

  it('sets measuredWeekLimit to Infinity when .bc-week-events is absent', () => {
    const store = makeStore(3)
    // Render without the events child so querySelector returns null.
    function NoEvents({ weekCount }: { weekCount: number }) {
      const ref = useRef<HTMLElement | null>(null)
      useMonthRowMeasure({ gridRef: ref, weekCount, store: store as CalendarStore<unknown> })
      return <div ref={(n) => { ref.current = n }} data-testid="grid" />
    }
    render(<NoEvents weekCount={5} />)
    const ro = MockResizeObserver.instances[0]!
    act(() => { ro.fire() })
    expect(store.measuredWeekLimit.value).toBe(Infinity)
  })

  it('computes a positive limit when layout metrics are valid', () => {
    const store = makeStore()

    // Grid: 5 rows × 200px = 1000px total.
    // Events container: paddingBlockStart=40px (header), gridAutoRows=30px (segment).
    // available = 200 - 40 = 160px; rows = floor(160/30) = 5; limit = 5 - 1 = 4.
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      height: 1000, width: 0, top: 0, left: 0, bottom: 0, right: 0, x: 0, y: 0,
      toJSON: () => ({}),
    })
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      gridAutoRows: '30px',
      paddingBlockStart: '40px',
    } as unknown as CSSStyleDeclaration)

    render(<Harness store={store} weekCount={5} />)
    const ro = MockResizeObserver.instances[0]!
    act(() => { ro.fire() })

    expect(store.measuredWeekLimit.value).toBe(4)
  })

  it('clamps limit to at least 1 when available space is very small', () => {
    const store = makeStore()

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      height: 50, width: 0, top: 0, left: 0, bottom: 0, right: 0, x: 0, y: 0,
      toJSON: () => ({}),
    })
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      gridAutoRows: '30px',
      paddingBlockStart: '40px',
    } as unknown as CSSStyleDeclaration)

    render(<Harness store={store} weekCount={1} />)
    const ro = MockResizeObserver.instances[0]!
    act(() => { ro.fire() })

    expect(store.measuredWeekLimit.value).toBe(1)
  })

  it('resets measuredWeekLimit to Infinity on unmount', () => {
    const store = makeStore(3)
    const { unmount } = render(<Harness store={store} weekCount={5} />)
    unmount()
    expect(store.measuredWeekLimit.value).toBe(Infinity)
  })

  it('disconnects the observer on unmount', () => {
    const store = makeStore()
    const { unmount } = render(<Harness store={store} weekCount={5} />)
    const ro = MockResizeObserver.instances[0]!
    unmount()
    expect(ro.disconnected).toBe(true)
  })

  it('reconnects the observer when weekCount changes', () => {
    const store = makeStore()
    const { rerender } = render(<Harness store={store} weekCount={5} />)
    const firstRO = MockResizeObserver.instances[0]!

    rerender(<Harness store={store} weekCount={6} />)

    // Old observer is disconnected, new one created.
    expect(firstRO.disconnected).toBe(true)
    expect(MockResizeObserver.instances).toHaveLength(2)
    expect(MockResizeObserver.instances[1]!.observed).toHaveLength(1)
  })
})

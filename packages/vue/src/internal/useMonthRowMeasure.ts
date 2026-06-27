import type { CalendarStore } from '@big-calendar/core'
import type { ComputedRef, ShallowRef } from 'vue'
import { watchEffect } from 'vue'

function computeLimit(gridEl: HTMLElement, weekCount: number): number {
  if (weekCount <= 0) return Infinity

  const rowHeight = gridEl.getBoundingClientRect().height / weekCount
  const eventsEl = gridEl.querySelector<HTMLElement>('.bc-week-events')
  if (eventsEl === null) return Infinity

  const style = getComputedStyle(eventsEl)
  const segmentHeight = parseFloat(style.gridAutoRows)
  const headerHeight = parseFloat(style.paddingBlockStart)

  if (!isFinite(segmentHeight) || segmentHeight <= 0) return Infinity

  return Math.max(1, Math.floor((rowHeight - headerHeight) / segmentHeight))
}

/**
 * Observes the month grid container with a ResizeObserver and writes a
 * dynamically computed weekEventLimit to store.measuredWeekLimit.
 *
 * Mirrors the React useMonthRowMeasure hook. The store's viewModel reads
 * config.weekEventLimit ?? measuredWeekLimit.value, so this measurement is
 * only active when no static limit is configured.
 */
export function useMonthRowMeasure<TEvent>(args: {
  gridRef: ShallowRef<HTMLElement | null>
  weekCount: ComputedRef<number>
  store: CalendarStore<TEvent>
}): void {
  const { gridRef, weekCount, store } = args

  watchEffect((onCleanup) => {
    const el = gridRef.value
    if (el === null || el === undefined) return

    const count = weekCount.value

    const observer = new ResizeObserver(() => {
      store.measuredWeekLimit.value = computeLimit(el, count)
    })
    observer.observe(el)

    onCleanup(() => {
      observer.disconnect()
      store.measuredWeekLimit.value = Infinity
    })
  })
}

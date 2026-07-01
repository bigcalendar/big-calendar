import type { CalendarStore } from '@big-calendar/core'

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
 * Svelte 5 port of the Vue `useMonthRowMeasure` composable.
 *
 * Observes the month grid container with a ResizeObserver and writes a
 * dynamically computed weekEventLimit to `store.measuredWeekLimit`.
 *
 * @param getGrid - reactive getter for the month grid element.
 * @param getWeekCount - reactive getter for the current week row count.
 */
export function useMonthRowMeasure<TEvent>(args: {
  getGrid: () => HTMLElement | null
  getWeekCount: () => number
  store: CalendarStore<TEvent>
}): void {
  const { getGrid, getWeekCount, store } = args

  $effect(() => {
    const el = getGrid()
    if (el == null) return

    const count = getWeekCount()

    const observer = new ResizeObserver(() => {
      store.measuredWeekLimit.value = computeLimit(el, count)
    })
    observer.observe(el)

    return () => {
      observer.disconnect()
      store.measuredWeekLimit.value = Infinity
    }
  })
}

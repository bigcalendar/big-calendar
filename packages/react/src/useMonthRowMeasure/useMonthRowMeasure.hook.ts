import { useEffect } from 'react'
import type { CalendarStore } from '@big-calendar/core'

/**
 * Compute the maximum number of event rows that fit in one week row of the
 * month grid without overflowing — leaving exactly one row for the "+N more"
 * indicator when events do overflow.
 *
 * Reads the computed `gridAutoRows` (segment height) and `paddingBlockStart`
 * (date-header reservation) off the first `.bc-week-events` element found
 * inside `gridEl` so the calculation stays in sync with live CSS token values.
 */
function computeLimit(gridEl: HTMLElement, weekCount: number): number {
  if (weekCount <= 0) return Infinity

  const rowHeight = gridEl.getBoundingClientRect().height / weekCount
  const eventsEl = gridEl.querySelector<HTMLElement>('.bc-week-events')
  if (eventsEl === null) return Infinity

  const style = getComputedStyle(eventsEl)
  const segmentHeight = parseFloat(style.gridAutoRows)
  const headerHeight = parseFloat(style.paddingBlockStart)

  if (!isFinite(segmentHeight) || segmentHeight <= 0) return Infinity

  // Return the full row count. monthViewModel reserves one row for the "+N more"
  // button only when overflow actually occurs (two-pass), so no -1 here.
  return Math.max(1, Math.floor((rowHeight - headerHeight) / segmentHeight))
}

/**
 * Observes the month grid container with a `ResizeObserver` and writes a
 * dynamically computed `weekEventLimit` to `store.measuredWeekLimit`.
 *
 * The store's `viewModel` reads `config.weekEventLimit ?? measuredWeekLimit.value`,
 * so this measurement is only active when no static limit is configured.
 *
 * On unmount the limit is reset to `Infinity` (unlimited) so a remount starts
 * clean and doesn't flash the wrong count from a previous layout.
 */
export function useMonthRowMeasure<TEvent>(args: {
  gridRef: { readonly current: HTMLElement | null }
  weekCount: number
  store: CalendarStore<TEvent>
}): void {
  const { gridRef, weekCount, store } = args

  useEffect(() => {
    const el = gridRef.current
    if (el === null || el === undefined) return

    const observer = new ResizeObserver(() => {
      store.measuredWeekLimit.value = computeLimit(el, weekCount)
    })
    observer.observe(el)

    return () => {
      observer.disconnect()
      store.measuredWeekLimit.value = Infinity
    }
  }, [gridRef, weekCount, store])
}

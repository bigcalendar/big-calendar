import { useCalendarContext } from '../CalendarProvider'
import { dayCountStyle, slotGroupStyle } from '../internal/geometryStyles'
import { toStyle } from '../internal/toStyle'
import { useEventRoving } from '../internal/useEventRoving.svelte'
import { useKeyboardDnd } from '../internal/useKeyboardDnd.svelte'
import { useTimeGrid } from '../useTimeGrid'
import type { TimeGrid } from '../useTimeGrid'
import { useTimeGridBody } from '../useTimeGridBody'
import type { UseTimeGridBodyReturn } from '../useTimeGridBody'
import { useTimeGridHeader } from '../useTimeGridHeader'
import type { UseTimeGridHeaderReturn } from '../useTimeGridHeader'

export interface UseTimeGridViewReturn<TEvent> {
  grid: { readonly current: TimeGrid<TEvent> | null }
  getAnnouncement: () => string
  announcer: { class: string; role: 'status'; 'aria-live': 'polite' }
  getRootClass: () => string
  getRootHandlers: () => {
    onKeydown: (e: KeyboardEvent) => void
    onKeydownCapture: (e: KeyboardEvent) => void
    onFocusCapture: (e: FocusEvent) => void
  }
  getRootStyle: (leafCount: number) => string
  header: UseTimeGridHeaderReturn<TEvent>
  body: UseTimeGridBodyReturn<TEvent>
}

function computeRootClass(grid: TimeGrid<unknown> | null): string {
  if (grid === null) return 'bc-time-grid'
  if (grid.dayGroups !== null) return 'bc-time-grid bc-time-grid-resources bc-time-grid-resources-day-major'
  if (grid.resources !== null) {
    return grid.headings.length > 1
      ? 'bc-time-grid bc-time-grid-resources bc-time-grid-resources-week'
      : 'bc-time-grid bc-time-grid-resources bc-time-grid-resources-day'
  }
  return 'bc-time-grid'
}

export function useTimeGridView<TEvent = unknown>(
  getRootEl: () => HTMLElement | null,
  getAllDayRowEl: () => HTMLElement | null,
  getBodyEl: () => HTMLElement | null,
): UseTimeGridViewReturn<TEvent> {
  const { store } = useCalendarContext<TEvent>()
  const grid = useTimeGrid<TEvent>()
  const header = useTimeGridHeader<TEvent>(() => grid.current, getAllDayRowEl)
  const body = useTimeGridBody<TEvent>(() => grid.current, getBodyEl)
  const eventRoving = useEventRoving(getRootEl)
  const keyboardDnd = useKeyboardDnd({ mode: 'time' })

  let scrolledOnce = false
  $effect(() => {
    if (scrolledOnce) return
    const rootEl = getRootEl()
    const currentGrid = grid.current
    if (rootEl == null || currentGrid == null) return

    const firstCol =
      currentGrid.columns[0] ??
      currentGrid.resources?.[0]?.columns[0] ??
      currentGrid.dayGroups?.[0]?.cells[0]?.column
    if (firstCol == null) return

    const colEl = rootEl.querySelector<HTMLElement>('.bc-day-column')
    if (colEl == null) return
    const colHeight = colEl.offsetHeight
    if (colHeight === 0) return

    const dayStartMin = store.localizer.getMinutesFromMidnight(firstCol.min)
    const totalMin = store.localizer.getTotalMin({ start: firstCol.min, end: firstCol.max })
    if (totalMin === 0) return

    const targetMin =
      store.scrollToTime != null
        ? store.scrollToTime.hour * 60 + (store.scrollToTime.minute ?? 0)
        : store.localizer.getMinutesFromMidnight(store.getNow())

    const fraction = Math.max(0, Math.min(1, (targetMin - dayStartMin) / totalMin))
    rootEl.scrollTo({ top: Math.round(fraction * colHeight), behavior: 'instant' })
    scrolledOnce = true
  })

  return {
    grid,
    getAnnouncement: () => keyboardDnd.getAnnouncement(),
    announcer: { class: 'bc-sr-only', role: 'status' as const, 'aria-live': 'polite' as const },
    getRootClass: () => computeRootClass(grid.current),
    getRootHandlers: () => ({
      onKeydown: eventRoving.onKeydown,
      onKeydownCapture: keyboardDnd.onKeydownCapture,
      onFocusCapture: eventRoving.onFocusCapture,
    }),
    getRootStyle: (leafCount: number): string => toStyle({
      ...(dayCountStyle(leafCount) as Record<string, string>),
      ...(slotGroupStyle(store.timeslots) as Record<string, string>),
    }),
    header,
    body,
  }
}

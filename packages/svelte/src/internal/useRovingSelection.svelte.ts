import type { SelectionMode } from '@big-calendar/core'
import { useCalendarContext } from '../CalendarProvider'

/** A keyboard arrow direction over a selection surface. */
export type Direction = 'up' | 'down' | 'left' | 'right'

/** What {@link useRovingSelection} returns. */
export interface RovingSelection {
  onKeydown: (e: KeyboardEvent) => void
  onFocusCapture: (e: FocusEvent) => void
  cellTabIndex: (index: number) => 0 | -1
}

const ARROW_DIRECTION: Record<string, Direction | undefined> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

/**
 * Svelte 5 port of the Vue `useRovingSelection` composable.
 *
 * Keyboard roving-tabindex + selection for one slot surface. Arrow keys move
 * focus, Shift+Arrow extends the selection, Enter/Space commits, Escape cancels.
 *
 * @param getContainer - reactive getter for the selection surface element.
 */
export function useRovingSelection(opts: {
  mode: SelectionMode
  getContainer: () => HTMLElement | null
  getCount: () => number
  getSlotCount?: () => number | undefined
  neighbor: (index: number, direction: Direction) => number | null
}): RovingSelection {
  const { mode, getContainer, getCount, getSlotCount, neighbor } = opts
  const { store } = useCalendarContext()
  let active = $state(0)

  const safeActive = $derived(
    getCount() > 0 ? Math.min(active, getCount() - 1) : 0,
  )

  const cellAt = (index: number): HTMLElement | null =>
    getContainer()?.querySelector<HTMLElement>(`[data-slot-index="${index}"]`) ?? null

  const move = (index: number): void => {
    active = index
    cellAt(index)?.focus()
  }

  const onKeydown = (e: KeyboardEvent): void => {
    if (store.selectable === false) return
    const cell = e.target instanceof Element ? e.target.closest<HTMLElement>('[data-slot-index]') : null
    if (cell == null) return
    const current = Number(cell.dataset.slotIndex)
    if (!Number.isFinite(current)) return
    const date = cell.dataset.date ?? ''

    const direction = ARROW_DIRECTION[e.key]
    if (direction !== undefined) {
      const target = neighbor(current, direction)
      e.preventDefault()
      if (target === null) return
      if (e.shiftKey) {
        if (store.selection.state.value.status !== 'selecting') {
          store.selection.start({ slot: current, date, mode, slotCount: getSlotCount?.() })
        }
        store.selection.to({ slot: target })
      }
      move(target)
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (store.selection.state.value.status === 'selecting') {
        store.selection.complete()
      } else {
        store.selection.click({ slot: current, date, mode, slotCount: getSlotCount?.() })
      }
      return
    }
    if (e.key === 'Escape' && store.selection.state.value.status === 'selecting') {
      e.preventDefault()
      store.selection.cancel()
    }
  }

  const onFocusCapture = (e: FocusEvent): void => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-slot-index]')
    if (cell == null || !getContainer()?.contains(cell)) return
    const index = Number(cell.dataset.slotIndex)
    if (Number.isFinite(index)) active = index
  }

  const cellTabIndex = (index: number): 0 | -1 =>
    index === safeActive ? 0 : -1

  return { onKeydown, onFocusCapture, cellTabIndex }
}

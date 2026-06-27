import type { SelectionMode } from '@big-calendar/core'
import { computed, ref, shallowRef } from 'vue'
import type { Ref, ShallowRef } from 'vue'
import { useCalendarContext } from '../CalendarProvider'

/** A keyboard arrow direction over a selection surface. */
export type Direction = 'up' | 'down' | 'left' | 'right'

/** What {@link useRovingSelection} returns for the surface + its cells. */
export interface RovingSelection {
  /** Attach to the selection surface (the cells' common ancestor). */
  containerRef: ShallowRef<HTMLElement | null>
  /** Key handler for the surface — drives focus movement + selection. */
  onKeydown: (e: KeyboardEvent) => void
  /** Focus sync for the surface — keeps the active cell in step with real focus. */
  onFocusCapture: (e: FocusEvent) => void
  /** The roving `tabIndex` for the cell at `index` (one tab stop per group). */
  cellTabIndex: (index: number) => 0 | -1
}

const ARROW_DIRECTION: Record<string, Direction | undefined> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

/**
 * Keyboard roving-tabindex + selection for one slot surface. The cells are
 * a single tab stop: exactly one carries `tabIndex=0` (the active cell), the
 * rest `-1`, and arrow keys move focus among them via the view-supplied
 * `neighbor` map. On top of plain navigation it drives the store's selection
 * controller:
 *
 * - **Arrow** moves the active cell (focus only).
 * - **Shift+Arrow** extends the selection.
 * - **Enter / Space** commits.
 * - **Esc** cancels an in-progress selection.
 */
export function useRovingSelection(opts: {
  mode: SelectionMode
  /** Reactive total number of cells in the group. */
  count: Ref<number>
  /** Slot rows per day column (time mode only). */
  slotCount?: number | undefined
  /** Neighbor index in a direction, or `null` at an edge. */
  neighbor: (index: number, direction: Direction) => number | null
}): RovingSelection {
  const { mode, count, slotCount, neighbor } = opts
  const { store } = useCalendarContext()
  const container = shallowRef<HTMLElement | null>(null)
  const active = ref(0)

  const safeActive = computed(() =>
    count.value > 0 ? Math.min(active.value, count.value - 1) : 0,
  )

  const cellAt = (index: number): HTMLElement | null =>
    container.value?.querySelector<HTMLElement>(`[data-slot-index="${index}"]`) ?? null

  const move = (index: number): void => {
    active.value = index
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
          store.selection.start({ slot: current, date, mode, slotCount })
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
        store.selection.click({ slot: current, date, mode, slotCount })
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
    if (cell == null || !container.value?.contains(cell)) return
    const index = Number(cell.dataset.slotIndex)
    if (Number.isFinite(index)) active.value = index
  }

  const cellTabIndex = (index: number): 0 | -1 =>
    index === safeActive.value ? 0 : -1

  return { containerRef: container, onKeydown, onFocusCapture, cellTabIndex }
}

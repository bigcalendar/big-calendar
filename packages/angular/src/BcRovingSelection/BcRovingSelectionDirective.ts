import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  inject,
} from '@angular/core'
import type { SelectionMode } from '@big-calendar/core'
import { injectCalendar } from '../CalendarProvider/injectCalendar'

type Direction = 'up' | 'down' | 'left' | 'right'

const ARROW_DIR: Record<string, Direction | undefined> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

/**
 * Keyboard roving-tabindex + selection for one slot surface (month grid or
 * time column). Apply to the container element that parents the
 * `[data-slot-index]` hit-target cells.
 *
 * One tab stop per group: exactly one cell carries `tabIndex=0` (the active
 * cell), the rest carry `-1`. Arrow keys move focus; Shift+Arrow extends a
 * selection; Enter/Space commits; Escape cancels.
 *
 * **Inputs:**
 * - `[bcMode]` — `'day' | 'time'` (required) — passed to the store's selection controller
 * - `[bcCount]` — total cell count in the group (required) — keeps the active
 *   index in bounds when the grid resizes
 * - `[bcColumns]` — number of columns for 2-D grids (default `1`). Month
 *   view passes `7`; time columns pass `1` (up/down only)
 * - `[bcSlotCount]` — slots per column for time mode (optional)
 *
 * @example
 * ```html
 * <div
 *   bcRovingSelection
 *   [bcMode]="'day'"
 *   [bcCount]="grid().weeks.length * 7"
 *   [bcColumns]="7"
 * >
 *   <div *ngFor="..." data-slot-index="..." tabindex="-1"></div>
 * </div>
 * ```
 */
@Directive({
  selector: '[bcRovingSelection]',
  standalone: true,
})
export class BcRovingSelectionDirective {
  /** Selection mode forwarded to the store's selection controller. */
  @Input({ required: true }) bcMode!: SelectionMode
  /** Total number of slot cells in this surface. Used to clamp the active index. */
  @Input({ required: true }) bcCount!: number
  /**
   * Number of columns in the grid layout.
   * Use `7` for the month grid; `1` for single time columns.
   */
  @Input() bcColumns = 1
  /** Slots per time column (time grid only). */
  @Input() bcSlotCount?: number

  private readonly ctx = injectCalendar()
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef)

  private active = 0

  private get safeActive(): number {
    return this.bcCount > 0 ? Math.min(this.active, this.bcCount - 1) : 0
  }

  private neighbor(index: number, dir: Direction): number | null {
    const cols = this.bcColumns
    let next: number
    if (dir === 'left') next = index - 1
    else if (dir === 'right') next = index + 1
    else if (dir === 'up') next = index - cols
    else next = index + cols

    if (next < 0 || next >= this.bcCount) return null
    // Prevent wrapping in 2-D grids for left/right
    if (cols > 1) {
      if (dir === 'left' && index % cols === 0) return null
      if (dir === 'right' && index % cols === cols - 1) return null
    }
    return next
  }

  private cellAt(index: number): HTMLElement | null {
    return (
      this.el.nativeElement.querySelector<HTMLElement>(
        `[data-slot-index="${index}"]`,
      ) ?? null
    )
  }

  private move(index: number): void {
    this.active = index
    this.cellAt(index)?.focus()
  }

  @HostListener('keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    const store = this.ctx.storeSignal()
    if (!store || store.selectable === false) return

    const target = e.target instanceof Element ? e.target : null
    const cell = target?.closest<HTMLElement>('[data-slot-index]') ?? null
    if (cell == null) return
    const current = Number(cell.dataset['slotIndex'])
    if (!Number.isFinite(current)) return
    const date = cell.dataset['date'] ?? ''

    const dir = ARROW_DIR[e.key]
    if (dir !== undefined) {
      const next = this.neighbor(current, dir)
      e.preventDefault()
      if (next === null) return
      if (e.shiftKey) {
        if (store.selection.state.value.status !== 'selecting') {
          store.selection.start({
            slot: current,
            date,
            mode: this.bcMode,
            slotCount: this.bcSlotCount,
          })
        }
        store.selection.to({ slot: next })
      }
      this.move(next)
      return
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (store.selection.state.value.status === 'selecting') {
        store.selection.complete()
      } else {
        store.selection.click({
          slot: current,
          date,
          mode: this.bcMode,
          slotCount: this.bcSlotCount,
        })
      }
      return
    }

    if (e.key === 'Escape' && store.selection.state.value.status === 'selecting') {
      e.preventDefault()
      store.selection.cancel()
    }
  }

  @HostListener('focusin', ['$event'])
  onFocusIn(e: FocusEvent): void {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-slot-index]')
    if (cell == null || !this.el.nativeElement.contains(cell)) return
    const index = Number(cell.dataset['slotIndex'])
    if (Number.isFinite(index)) this.active = index
  }

  /** Returns the tabIndex for a cell at `index`: `0` for active, `-1` otherwise. */
  cellTabIndex(index: number): 0 | -1 {
    return index === this.safeActive ? 0 : -1
  }
}

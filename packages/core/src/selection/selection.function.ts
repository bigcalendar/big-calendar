import type { ReadonlySignal } from '@preact/signals-core'
import { computed, signal } from '@preact/signals-core'
import type { SelectableMode, SelectionState, SelectionRange, SlotSelection } from './selection.type'

/**
 * The coordinate-based slot-selection state machine (§8.2). Works purely in
 * slot-index space: the adapter maps pointer/keyboard events to slot indices and
 * calls these actions; `core` tracks the anchor/head and emits ranges. Date
 * translation and DOM concerns (long-press timing, hit-testing events) live in
 * the adapter.
 *
 * - `start` begins a drag at a slot; `to` extends it (pointer move or keyboard
 *   Shift+Arrow); `complete` commits; `cancel` aborts.
 * - `click` / `doubleClick` commit a single-slot selection without a drag (the
 *   adapter's timer decides which; both flow through `onSelect`).
 * - `onSelecting` fires on every range change and may **veto** by returning
 *   `false` (the move/start is dropped). `onSelect` fires on commit.
 *
 * `range` is a signal the adapter can subscribe to for the live highlight overlay.
 */
export interface SelectionController {
  readonly state: ReadonlySignal<SelectionState>
  readonly range: ReadonlySignal<SelectionRange | null>
  start(args: { slot: number }): void
  to(args: { slot: number }): void
  complete(): void
  click(args: { slot: number }): void
  doubleClick(args: { slot: number }): void
  cancel(): void
}

export function createSelection(
  args: {
    selectable?: SelectableMode | undefined
    onSelecting?: ((range: SelectionRange) => boolean | void) | undefined
    onSelect?: ((selection: SlotSelection) => void) | undefined
  } = {},
): SelectionController {
  const { selectable = true, onSelecting, onSelect } = args
  const enabled = selectable !== false

  const state = signal<SelectionState>({ status: 'idle' })

  const range = computed<SelectionRange | null>(() => {
    const current = state.value
    if (current.status !== 'selecting') return null
    return { start: Math.min(current.anchor, current.head), end: Math.max(current.anchor, current.head) }
  })

  /** Notify the veto callback for a candidate range; `true` means proceed. */
  const allow = (anchor: number, head: number): boolean => {
    if (!onSelecting) return true
    return onSelecting({ start: Math.min(anchor, head), end: Math.max(anchor, head) }) !== false
  }

  return {
    state,
    range,

    start({ slot }) {
      if (!enabled) return
      if (!allow(slot, slot)) return
      state.value = { status: 'selecting', anchor: slot, head: slot }
    },

    to({ slot }) {
      const current = state.value
      if (current.status !== 'selecting') return
      if (!allow(current.anchor, slot)) return
      state.value = { status: 'selecting', anchor: current.anchor, head: slot }
    },

    complete() {
      const committed = range.value
      if (committed === null) return
      state.value = { status: 'idle' }
      onSelect?.({ ...committed, action: 'select' })
    },

    click({ slot }) {
      if (!enabled) return
      onSelect?.({ start: slot, end: slot, action: 'click' })
    },

    doubleClick({ slot }) {
      if (!enabled) return
      onSelect?.({ start: slot, end: slot, action: 'doubleClick' })
    },

    cancel() {
      state.value = { status: 'idle' }
    },
  }
}

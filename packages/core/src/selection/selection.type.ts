/**
 * Whether slot selection is allowed. `true` enables it, `false` disables it, and
 * `'ignoreEvents'` enables it but lets the adapter start selections even when the
 * pointer is over an event (the over-an-event decision is adapter-side; the FSM
 * treats `'ignoreEvents'` exactly like `true`).
 */
export type SelectableMode = boolean | 'ignoreEvents'

/** How a committed selection was produced: a drag/keyboard range, or a single click. */
export type SelectAction = 'select' | 'click'

/** An inclusive range of slot indices (`start <= end`), in slot-index space. */
export interface SelectionRange {
  start: number
  end: number
}

/** A committed selection: its slot range plus how it was produced. */
export interface SlotSelection extends SelectionRange {
  action: SelectAction
}

/** The FSM's current state. `selecting` carries the live anchor + head slots. */
export type SelectionState =
  | { status: 'idle' }
  | { status: 'selecting'; anchor: number; head: number }

import type { ResourceId } from '../types/calendar.type'

/**
 * Whether slot selection is allowed. `true` enables it, `false` disables it, and
 * `'ignoreEvents'` enables it but lets the adapter start selections even when the
 * pointer is over an event (the over-an-event decision is adapter-side; the FSM
 * treats `'ignoreEvents'` exactly like `true`).
 */
export type SelectableMode = boolean | 'ignoreEvents'

/**
 * How a committed selection was produced: a drag/keyboard range, a single click,
 * or a double-click (pointer dbl-click or the keyboard secondary key — the
 * adapter disambiguates single vs. double via its 250 ms timer).
 */
export type SelectAction = 'select' | 'click' | 'doubleClick'

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

/**
 * Which index space a selection runs in (set by the adapter when a drag starts):
 * - `'time'` — a vertical slot index within a single day column (time grid body).
 * - `'day'` — a linear day index across the visible grid (month grid / all-day row).
 *
 * The store uses this to translate committed slot indices back into dates.
 */
export type SelectionMode = 'time' | 'day'

/**
 * A committed slot selection translated to **primitive ISO date strings** — the
 * public shape emitted to `onSlotClick` / `onSlotDoubleClick` / `onSlotSelect`.
 * (`core` never exposes JS `Date`.) How the selection was produced is encoded by
 * **which** callback fires, so this payload no longer carries an `action` field.
 */
export interface SlotSelectionDates {
  /** Start of the first selected slot/day (ISO). */
  start: string
  /**
   * End of the selection (ISO): the **exclusive** end of the last slot for
   * `'time'` selections (start of the next slot), or **end-of-day** of the last
   * day for `'day'` selections.
   */
  end: string
  /** Start of each selected slot (time) or day (day), in order (ISO). */
  slots: string[]
  /**
   * Whether this is an all-day span. `true` for month/day selections (whole
   * days: `start`/`end` are day bounds, `slots` are day-starts) **and** for
   * time-grid drags that cross from one day into another — those keep their
   * instant start/end times and per-slot `slots` (a multi-day timed span).
   * `false` for a within-day timed selection.
   */
  allDay: boolean
  /**
   * The resource id of the column the selection started in, or `undefined` in a
   * resource-less grid. Lets a create-on-select handler scope the new event to
   * the chosen resource.
   */
  resourceId?: ResourceId | undefined
}

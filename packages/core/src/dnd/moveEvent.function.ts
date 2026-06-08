import type { LocalizerContract } from '@big-calendar/localizer'

/**
 * The drop surface a move lands on, which decides how the new start/end are
 * computed:
 *
 * - `'time'` — a time-grid slot. The drop is an **absolute instant**: the event
 *   snaps its start to `target` and keeps its exact duration.
 * - `'day'` — a month cell / all-day row. The drop is a **whole-day shift**: the
 *   event moves by the number of days between its current start day and `target`,
 *   preserving each end's time-of-day (matching v1's month-grid drag behaviour).
 */
export type MoveMode = 'time' | 'day'

/** Inputs to {@link moveEvent} — the event's current bounds plus the drop target. */
export interface MoveEventArgs {
  /** All date math flows through this localizer; core never touches `Date`. */
  localizer: LocalizerContract
  /** The event's current start (RFC 3339/9557). */
  start: string
  /** The event's current end (RFC 3339/9557). */
  end: string
  /** Whether the event currently spans whole days. */
  allDay: boolean
  /**
   * The drop target as a date string. In `'time'` mode it is the exact slot
   * instant the start snaps to; in `'day'` mode only its day is used.
   */
  target: string
  /** How `target` is interpreted; see {@link MoveMode}. */
  mode: MoveMode
}

/** The recomputed bounds emitted by {@link moveEvent}. */
export interface MovedEvent {
  start: string
  end: string
  allDay: boolean
}

/**
 * Pure date-math for moving (dragging) an event to a new position. Lives in
 * `core` so every adapter — React today, others later — computes an identical
 * move; the framework layer only decodes the DOM drop target into `target`/
 * `mode` (the same `data-date` / `data-slot-index` decode slot selection uses).
 *
 * Duration is preserved exactly: `'time'` moves keep the original span to the
 * millisecond; `'day'` moves shift both ends by whole days, so each end keeps its
 * time-of-day. `allDay` is **preserved** (a same-surface move) — cross-surface
 * timed↔all-day promotion is a separate, later concern.
 */
export function moveEvent({ localizer, start, end, allDay, target, mode }: MoveEventArgs): MovedEvent {
  if (mode === 'time') {
    // Absolute snap: start = the dropped slot instant; end = start + duration.
    const durationMs = localizer.diff({ a: end, b: start, unit: 'millisecond' })
    return {
      start: target,
      end: localizer.add({ value: target, amount: durationMs, unit: 'millisecond' }),
      allDay,
    }
  }
  // Whole-day shift: move both ends by the day delta, preserving time-of-day.
  const dayDelta = localizer.diff({
    a: localizer.startOf({ value: target, unit: 'day' }),
    b: localizer.startOf({ value: start, unit: 'day' }),
    unit: 'day',
  })
  return {
    start: localizer.add({ value: start, amount: dayDelta, unit: 'day' }),
    end: localizer.add({ value: end, amount: dayDelta, unit: 'day' }),
    allDay,
  }
}

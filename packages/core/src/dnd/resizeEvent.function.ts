import type { LocalizerContract } from '@big-calendar/localizer'
import type { MoveMode } from './moveEvent.function'

/**
 * Which edge of an event is being dragged:
 *
 * - `'start'` — the start handle (top in the time grid, leading edge in the
 *   month grid) moves the event's **start** to the dropped slot/day, keeping its
 *   end.
 * - `'end'` — the end handle (bottom / trailing edge) moves the event's **end**
 *   to the dropped slot/day, keeping its start.
 */
export type ResizeEdge = 'start' | 'end'

/** Inputs to {@link resizeEvent} — the event's current bounds plus the dragged edge. */
export interface ResizeEventArgs {
  /** All date math flows through this localizer; core never touches `Date`. */
  localizer: LocalizerContract
  /** The event's current start (RFC 3339/9557). */
  start: string
  /** The event's current end (RFC 3339/9557). */
  end: string
  /** Whether the event currently spans whole days (preserved by the resize). */
  allDay: boolean
  /** Which edge is being dragged; see {@link ResizeEdge}. */
  edge: ResizeEdge
  /**
   * The drop target. In `'time'` mode it is the dropped slot's **start** instant
   * (`data-bc-instant`); in `'day'` mode it is the dropped **day** (`data-date`).
   * Because either is absolute, dragging into another day column (time) or across
   * a week boundary (day) resizes correctly for free.
   */
  target: string
  /**
   * How `target` is read; see {@link MoveMode}. `'time'` snaps the edge to the
   * slot (the time-grid behaviour below); `'day'` snaps the edge to whole days,
   * preserving each end's time-of-day (the month-grid behaviour). Defaults to
   * `'time'`.
   */
  mode?: MoveMode | undefined
  /**
   * Slot length in minutes. In `'time'` mode the `'end'` edge covers **through**
   * the hovered slot (its new end is the slot's end = `target + step`), matching
   * how a slot selection's end is the end of its last slot; it is also the minimum
   * duration the event is clamped to so a resize can't invert or collapse it. In
   * `'day'` mode the floor is instead one whole day.
   */
  step: number
}

/** The recomputed bounds emitted by {@link resizeEvent}. */
export interface ResizedEvent {
  start: string
  end: string
  allDay: boolean
}

/**
 * Pure date-math for resizing an event by dragging one of its edges. Lives in
 * `core` so every adapter computes an identical resize; the framework layer only
 * decodes the DOM drop into `edge`/`target` (the same `data-bc-instant` slot the
 * time-grid move and slot selection use).
 *
 * The dragged edge snaps to the slot: `'start'` sets the start to the slot
 * instant; `'end'` sets the end to the slot's **end** (`target + step`), so the
 * event covers the hovered slot — the same inclusive-end convention as slot
 * selection. The opposite edge is left untouched. The result is clamped to a
 * minimum duration of one slot (`step`) so a resize can never invert or collapse
 * the event. `allDay` is preserved.
 */
export function resizeEvent({
  localizer,
  start,
  end,
  allDay,
  edge,
  target,
  mode = 'time',
  step,
}: ResizeEventArgs): ResizedEvent {
  if (mode === 'day') {
    // Whole-day resize (month grid): move the dragged edge by the day delta
    // between its current day and the dropped day, preserving time-of-day. Clamp
    // the delta so the event keeps a one-day minimum (start day ≤ end day). A
    // cross-week drag is handled for free because `target` is an absolute day.
    const startDay = localizer.startOf({ value: start, unit: 'day' })
    const endDay = localizer.startOf({ value: end, unit: 'day' })
    const targetDay = localizer.startOf({ value: target, unit: 'day' })
    if (edge === 'start') {
      // Start may move forward at most to the end's day (a 1-day event).
      const maxDelta = localizer.diff({ a: endDay, b: startDay, unit: 'day' })
      const rawDelta = localizer.diff({ a: targetDay, b: startDay, unit: 'day' })
      const delta = Math.min(rawDelta, maxDelta)
      return { start: localizer.add({ value: start, amount: delta, unit: 'day' }), end, allDay }
    }
    // End may move back at most to the start's day (negative delta).
    const minDelta = localizer.diff({ a: startDay, b: endDay, unit: 'day' })
    const rawDelta = localizer.diff({ a: targetDay, b: endDay, unit: 'day' })
    const delta = Math.max(rawDelta, minDelta)
    return { start, end: localizer.add({ value: end, amount: delta, unit: 'day' }), allDay }
  }
  if (edge === 'start') {
    // New start = the dropped slot, but never within one slot of the end.
    const newStart =
      localizer.diff({ a: end, b: target, unit: 'minute' }) < step
        ? localizer.add({ value: end, amount: -step, unit: 'minute' })
        : target
    return { start: newStart, end, allDay }
  }
  // New end = the dropped slot's end, but never within one slot of the start.
  const slotEnd = localizer.add({ value: target, amount: step, unit: 'minute' })
  const newEnd =
    localizer.diff({ a: slotEnd, b: start, unit: 'minute' }) < step
      ? localizer.add({ value: start, amount: step, unit: 'minute' })
      : slotEnd
  return { start, end: newEnd, allDay }
}

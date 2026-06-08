import type { LocalizerContract } from '@big-calendar/localizer'

/**
 * Which edge of an event is being dragged:
 *
 * - `'start'` — the top handle moves the event's **start** to the dropped slot,
 *   keeping its end.
 * - `'end'` — the bottom handle moves the event's **end** to the dropped slot,
 *   keeping its start.
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
   * The dropped slot's **start** instant (the `data-bc-instant` the time grid
   * stamps on each slot cell). Because it is an absolute instant, dragging into
   * another day column resizes across the day boundary for free.
   */
  target: string
  /**
   * Slot length in minutes. The `'end'` edge covers **through** the hovered slot
   * (its new end is the slot's end = `target + step`), matching how a slot
   * selection's end is the end of its last slot. Also the minimum duration the
   * event is clamped to so a resize can't invert or collapse it.
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
export function resizeEvent({ localizer, start, end, allDay, edge, target, step }: ResizeEventArgs): ResizedEvent {
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

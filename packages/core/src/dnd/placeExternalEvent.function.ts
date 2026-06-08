import type { LocalizerContract } from '@big-calendar/localizer'

/** Inputs to {@link placeExternalEvent} — where an outside item was dropped. */
export interface PlaceExternalEventArgs {
  /** All date math flows through this localizer; core never touches `Date`. */
  localizer: LocalizerContract
  /**
   * The dropped slot's **start** instant (the `data-bc-instant` the time grid
   * stamps on each slot cell). Because it is an absolute instant, dropping into
   * another day column places the new event across the day boundary for free.
   */
  target: string
  /**
   * The dragged item's length in minutes, carried on the drag source's payload.
   * Optional: a **native** HTML5 drag can't expose its payload until the drop, so
   * the live preview falls back to a single slot — and a payload that omits a
   * duration places a one-slot event. Defaults to `step` (one slot).
   */
  durationMinutes?: number | undefined
  /** Whether the dropped item should become a whole-day event. Defaults to `false`. */
  allDay?: boolean | undefined
  /** Slot length in minutes; the duration floor when none is supplied. */
  step: number
}

/** The bounds emitted by {@link placeExternalEvent} for the new event. */
export interface PlacedEvent {
  start: string
  end: string
  allDay: boolean
}

/**
 * Pure date-math for **dropping an item from outside the calendar** onto a
 * time-grid slot. Lives in `core` so every adapter computes an identical
 * placement; the framework layer only decodes the DOM drop into `target` and the
 * payload into `durationMinutes`/`allDay` (the same `data-bc-instant` slot the
 * time-grid move, resize, and slot selection use).
 *
 * The new event starts at the dropped slot and runs for `durationMinutes` (the
 * payload's duration, or one slot when absent — e.g. a native drag whose payload
 * is unreadable mid-drag). Because `target` is an absolute instant, a drop near
 * the bottom of a day column simply spans midnight, the same cross-day behaviour
 * as move and resize. This is a *report* shape only — core never mutates events.
 */
export function placeExternalEvent({
  localizer,
  target,
  durationMinutes,
  allDay = false,
  step,
}: PlaceExternalEventArgs): PlacedEvent {
  const minutes = durationMinutes != null && durationMinutes > 0 ? durationMinutes : step
  return {
    start: target,
    end: localizer.add({ value: target, amount: minutes, unit: 'minute' }),
    allDay,
  }
}

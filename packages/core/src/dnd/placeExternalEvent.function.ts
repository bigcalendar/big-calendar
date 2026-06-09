import type { LocalizerContract } from '@big-calendar/localizer'
import type { MoveMode } from './moveEvent.function'

/** Inputs to {@link placeExternalEvent} — where an outside item was dropped. */
export interface PlaceExternalEventArgs {
  /** All date math flows through this localizer; core never touches `Date`. */
  localizer: LocalizerContract
  /**
   * The drop target. In `'time'` mode it is the dropped slot's **start** instant
   * (the `data-bc-instant` the time grid stamps on each slot cell); in `'day'`
   * mode it is the dropped **day** (the `data-date` a month cell carries). Because
   * either is an absolute value, a drop near the bottom of a day column (time) or
   * onto any month cell (day) places the new event for free.
   */
  target: string
  /**
   * How `target` is read — the binder's {@link MoveMode}. `'time'` (time grid)
   * places a timed event at the slot; `'day'` (month) either creates a whole-day
   * event on the dropped day or, when the payload carries a `start`/`end`
   * template, re-dates that template onto the dropped day (see below). Defaults to
   * `'time'`.
   */
  mode?: MoveMode | undefined
  /**
   * The dragged item's length in minutes, carried on the drag source's payload.
   * Optional: a **native** HTML5 drag can't expose its payload until the drop, so
   * the live preview falls back to a single slot — and a payload that omits a
   * duration places a one-slot event. Defaults to `step` (one slot). Used only in
   * `'time'` mode; in `'day'` mode the `start`/`end` template (if any) drives the
   * duration instead.
   */
  durationMinutes?: number | undefined
  /** Whether the dropped item should become a whole-day event. Defaults to `false`. */
  allDay?: boolean | undefined
  /**
   * Optional **template** bounds from the drag payload — the dragged item's own
   * start/end (e.g. an unscheduled task that already has a time-of-day). When both
   * are present a `'day'` drop keeps their **time-of-day**, moves the **date** to
   * the dropped day, and preserves the duration; a `'time'` drop falls back to
   * their span when no `durationMinutes` is given. When absent, a `'day'` drop
   * creates a whole-day event on the dropped day.
   */
  start?: string | undefined
  end?: string | undefined
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
 * Pure date-math for **dropping an item from outside the calendar**. Lives in
 * `core` so every adapter computes an identical placement; the framework layer
 * only decodes the DOM drop into `target`/`mode` and the payload into
 * `durationMinutes`/`allDay`/`start`/`end`.
 *
 * - **`'time'` (time grid):** the new event starts at the dropped slot and runs
 *   for `durationMinutes` (the payload's duration, the `start`/`end` template's
 *   span, or one slot when neither is known — e.g. a native drag whose payload is
 *   unreadable mid-drag). Because `target` is an absolute instant, a drop near the
 *   bottom of a day column spans midnight, the same cross-day behaviour as move
 *   and resize.
 * - **`'day'` (month):** with **no** `start`/`end` template the drop becomes a
 *   **whole-day** event on the dropped day. With a template the dropped item keeps
 *   its **time-of-day**, has its **date** moved to the dropped day, and preserves
 *   the original duration (so an unscheduled "9–10am" task dropped on the 14th
 *   becomes 9–10am on the 14th).
 *
 * This is a *report* shape only — core never mutates events.
 */
export function placeExternalEvent({
  localizer,
  target,
  mode = 'time',
  durationMinutes,
  allDay = false,
  start,
  end,
  step,
}: PlaceExternalEventArgs): PlacedEvent {
  const hasTemplate = start != null && end != null

  if (mode === 'day') {
    const dayStart = localizer.startOf({ value: target, unit: 'day' })
    if (!hasTemplate) {
      // No template → a whole-day event spanning the dropped day (same
      // start..endOf-day convention as a whole-day slot selection).
      return { start: dayStart, end: localizer.endOf({ value: dayStart, unit: 'day' }), allDay: true }
    }
    // Template → keep its time-of-day, move the date to the dropped day, preserve
    // the duration. `diff` is `a − b`, so the template's own start/end order keeps
    // the offsets positive.
    const timeOfDayMs = localizer.diff({
      a: start,
      b: localizer.startOf({ value: start, unit: 'day' }),
      unit: 'millisecond',
    })
    const durationMs = localizer.diff({ a: end, b: start, unit: 'millisecond' })
    const newStart = localizer.add({ value: dayStart, amount: timeOfDayMs, unit: 'millisecond' })
    return {
      start: newStart,
      end: localizer.add({ value: newStart, amount: durationMs, unit: 'millisecond' }),
      allDay,
    }
  }

  // 'time' mode: place at the dropped slot for the payload's duration, the
  // template's span, or one slot.
  const templateMinutes = hasTemplate ? localizer.diff({ a: end, b: start, unit: 'minute' }) : undefined
  const minutes =
    durationMinutes != null && durationMinutes > 0
      ? durationMinutes
      : templateMinutes != null && templateMinutes > 0
        ? templateMinutes
        : step
  return {
    start: target,
    end: localizer.add({ value: target, amount: minutes, unit: 'minute' }),
    allDay,
  }
}

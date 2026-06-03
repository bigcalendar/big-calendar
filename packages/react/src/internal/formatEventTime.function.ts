import type { LocalizerContract } from '@big-calendar/core'

/** Inputs for {@link formatEventTime}. */
export interface FormatEventTimeArgs {
  localizer: LocalizerContract
  /** "All day" label (from messages). */
  allDayLabel: string
  /** Resolved start, or `null` when unresolved. */
  start: string | null
  /** Resolved end, or `null` when unresolved. */
  end: string | null
  /** Whether the event is all-day. */
  allDay: boolean
  /** Format role to use for the times. Defaults to `agendaTime`. */
  format?: 'agendaTime' | 'time'
}

/**
 * Format an event's time for display: the all-day label for all-day (or
 * start-less) events, otherwise "start – end" (or just start when there is no
 * end). Pure and localizer-driven; shared by the agenda and time views.
 */
export function formatEventTime({
  localizer,
  allDayLabel,
  start,
  end,
  allDay,
  format = 'agendaTime',
}: FormatEventTimeArgs): string {
  if (allDay || start == null) return allDayLabel
  const from = localizer.format({ value: start, format })
  if (end == null) return from
  return `${from} – ${localizer.format({ value: end, format })}`
}

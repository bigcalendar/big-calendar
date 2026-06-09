import type { FormatKey } from '../types/localizer.type'

/**
 * Built-in `Intl.DateTimeFormat` option sets for each named format role.
 * Apps override any of these via {@link LocalizerOptions.formats}; the localizer
 * merges overrides on top of these defaults.
 */
export const DEFAULT_FORMATS: Record<FormatKey, Intl.DateTimeFormatOptions> = {
  date: { year: 'numeric', month: 'numeric', day: 'numeric' },
  time: { hour: 'numeric', minute: '2-digit' },
  datetime: { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' },
  weekday: { weekday: 'long' },
  weekdayShort: { weekday: 'short' },
  dayOfMonth: { day: 'numeric' },
  monthDay: { month: 'long', day: 'numeric' },
  monthYear: { month: 'long', year: 'numeric' },
  monthHeader: { month: 'long', year: 'numeric' },
  dayHeader: { weekday: 'long', month: 'long', day: 'numeric' },
  // Per-day column header in the time-grid (day / week) views. Mirrors RBC's
  // `dayFormat` (e.g. "Sun 14") — distinct from `dayHeader`, which titles the
  // Day view's toolbar ("Sunday, June 14").
  dayColumnHeader: { weekday: 'short', day: '2-digit' },
  agendaDate: { weekday: 'short', month: 'short', day: 'numeric' },
  agendaTime: { hour: 'numeric', minute: '2-digit' },
  timeGutter: { hour: 'numeric', minute: '2-digit' },
  selectRange: { hour: 'numeric', minute: '2-digit' },
}

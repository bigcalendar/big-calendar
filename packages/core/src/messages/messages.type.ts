/**
 * Every user-facing string the calendar can render. All are overridable for
 * i18n; `showMore` is a function so counts can be interpolated per locale.
 * Mirrors v1's message set exactly (keys + the `work_week` underscore).
 */
export interface Messages {
  date: string
  time: string
  event: string
  allDay: string
  week: string
  work_week: string
  day: string
  month: string
  previous: string
  next: string
  yesterday: string
  tomorrow: string
  today: string
  agenda: string
  noEventsInRange: string
  showMore: (total: number) => string
}

/**
 * Every user-facing string the calendar can render. All are overridable for
 * i18n; `showMore` is a function so counts can be interpolated per locale.
 * Mirrors v1's message set exactly (keys + the `work_week` underscore), plus the
 * screen-reader instruction strings the keyboard-selection a11y model needs.
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
  /**
   * Screen-reader instructions for the slot grid (referenced via
   * `aria-describedby` on each focusable slot/day cell). Describes the keyboard
   * selection gestures that ARIA's role/state/shortcut attributes cannot convey.
   */
  selectionInstructions: string
  /**
   * Screen-reader instructions for the event buttons (referenced via
   * `aria-describedby` on each `EventButton`). Describes the primary/secondary
   * keyboard actions.
   */
  eventInstructions: string
}

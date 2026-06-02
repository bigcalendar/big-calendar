import type { Messages } from './messages.type'

/** The built-in English message set. Override any subset via {@link resolveMessages}. */
export const DEFAULT_MESSAGES: Messages = {
  date: 'Date',
  time: 'Time',
  event: 'Event',
  allDay: 'All Day',
  week: 'Week',
  work_week: 'Work Week',
  day: 'Day',
  month: 'Month',
  previous: 'Back',
  next: 'Next',
  yesterday: 'Yesterday',
  tomorrow: 'Tomorrow',
  today: 'Today',
  agenda: 'Agenda',
  noEventsInRange: 'There are no events in this range.',
  showMore: (total) => `+${total} more`,
}

/** Merge caller overrides over {@link DEFAULT_MESSAGES}, yielding a complete set. */
export function resolveMessages(overrides?: Partial<Messages>): Messages {
  return { ...DEFAULT_MESSAGES, ...overrides }
}

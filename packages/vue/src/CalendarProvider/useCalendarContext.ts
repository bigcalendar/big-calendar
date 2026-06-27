import { inject } from 'vue'
import { CalendarKey } from './calendarContext'
import type { CalendarContextValue } from './calendarContext'

/**
 * Read the nearest calendar context.
 *
 * Throws when called outside a `<CalendarProvider>`. Every calendar component —
 * including `<Calendar>` — reads through this composable, so the provider must
 * wrap them; this lets the calendar and any sibling UI share a single store.
 */
export function useCalendarContext<
  TEvent = unknown,
  TResource = unknown,
>(): CalendarContextValue<TEvent, TResource> {
  const context = inject(CalendarKey)
  if (context === undefined) {
    throw new Error('useCalendarContext must be used within a <CalendarProvider>.')
  }
  return context as CalendarContextValue<TEvent, TResource>
}

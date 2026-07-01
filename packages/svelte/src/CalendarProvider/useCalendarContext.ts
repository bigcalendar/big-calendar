import { getContext } from 'svelte'
import type { CalendarContextValue } from './calendarContext'
import { CALENDAR_CONTEXT_KEY } from './calendarContext'

/**
 * Read the nearest calendar context.
 *
 * Throws when called outside a `<CalendarProvider>`. Every calendar component —
 * including `<Calendar>` — reads through this function, so the provider must
 * wrap them; this lets the calendar and any sibling UI share a single store.
 *
 * Must be called at component initialization time (inside `<script>` or a
 * function called synchronously during component setup).
 */
export function useCalendarContext<
  TEvent = unknown,
  TResource = unknown,
>(): CalendarContextValue<TEvent, TResource> {
  const context = getContext<CalendarContextValue<TEvent, TResource>>(CALENDAR_CONTEXT_KEY)
  if (context === undefined) {
    throw new Error('useCalendarContext must be used within a <CalendarProvider>.')
  }
  return context
}

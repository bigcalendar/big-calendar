import { useContext } from 'react'
import { CalendarContext } from './calendar.context'
import type { CalendarContextValue } from './calendar.context'

/**
 * Read the nearest calendar context.
 *
 * Throws when called outside a {@link CalendarProvider}. Every calendar component
 * — including `<Calendar>` — reads through this hook, so the provider must wrap
 * them; this lets the calendar and any sibling UI share a single store.
 */
export function useCalendarContext<TEvent = unknown, TResource = unknown>(): CalendarContextValue<
  TEvent,
  TResource
> {
  const context = useContext(CalendarContext)
  if (context === null) {
    throw new Error('useCalendarContext must be used within a <CalendarProvider>.')
  }
  return context as CalendarContextValue<TEvent, TResource>
}

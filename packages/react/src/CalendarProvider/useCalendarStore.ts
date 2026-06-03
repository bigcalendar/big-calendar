import type { CalendarStore } from '@big-calendar/core'
import { useCalendarContext } from './useCalendarContext'

/**
 * Convenience accessor for the {@link CalendarStore} carried by the nearest
 * {@link CalendarProvider}. Equivalent to `useCalendarContext().store`; throws
 * outside a provider for the same reason.
 */
export function useCalendarStore<TEvent = unknown, TResource = unknown>(): CalendarStore<
  TEvent,
  TResource
> {
  return useCalendarContext<TEvent, TResource>().store
}

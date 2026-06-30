import type { CalendarStore, Messages } from '@big-calendar/core'
import { createContext } from '@lit/context'

export interface CalendarContextValue<TEvent = unknown, TResource = unknown> {
  readonly store: CalendarStore<TEvent, TResource>
  readonly messages: Messages
  readonly descriptionIds: { selection: string; event: string }
}

export const calendarContext = createContext<CalendarContextValue>('bc-calendar-context')

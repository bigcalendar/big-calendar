import { resolveMessages } from '@big-calendar/core'
import type { Messages } from '@big-calendar/core'
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import type { CalendarComponents } from '../components.type'
import { useCalendar } from '../useCalendar'
import type { CalendarProps } from '../useCalendar'
import { CalendarContext } from './calendar.context'
import type { CalendarContextValue } from './calendar.context'

/**
 * Props for {@link CalendarProvider}: the full {@link CalendarProps} surface, the
 * component override map, message overrides, and the children it wraps.
 */
export interface CalendarProviderProps<TEvent = unknown, TResource = unknown>
  extends CalendarProps<TEvent, TResource> {
  /** Per-slot component overrides (§7). */
  components?: CalendarComponents<TEvent> | undefined
  /** UI string overrides, merged over the English defaults. */
  messages?: Partial<Messages> | undefined
  /** Calendar UI — typically `<Calendar>` plus any siblings that read context. */
  children?: ReactNode
}

/**
 * Owns the calendar store (via {@link useCalendar}) and publishes it on
 * {@link CalendarContext}.
 *
 * It is the required outer container: wrap `<Calendar>` — and any sibling
 * components that need to read or drive calendar state (custom toolbars,
 * sidebars, mini-maps) — inside one provider so they all share a single store.
 * `<Calendar>` consumes this context; it does not create its own.
 */
function CalendarProvider<TEvent = unknown, TResource = unknown>({
  children,
  components,
  messages,
  ...props
}: CalendarProviderProps<TEvent, TResource>) {
  const store = useCalendar<TEvent, TResource>(props)
  const resolvedMessages = useMemo(() => resolveMessages(messages), [messages])
  const value = useMemo<CalendarContextValue<TEvent, TResource>>(
    () => ({ store, components: components ?? {}, messages: resolvedMessages }),
    [store, components, resolvedMessages],
  )
  return <CalendarContext.Provider value={value as CalendarContextValue}>{children}</CalendarContext.Provider>
}

export default CalendarProvider

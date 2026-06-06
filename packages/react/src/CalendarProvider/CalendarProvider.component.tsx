import { resolveMessages } from '@big-calendar/core'
import type { Messages } from '@big-calendar/core'
import { useCallback, useId, useMemo, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react'
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
  onEventClick,
  onEventDoubleClick,
  onEventRightClick,
  onEventMiddleClick,
  ...props
}: CalendarProviderProps<TEvent, TResource>) {
  const store = useCalendar<TEvent, TResource>(props)
  const resolvedMessages = useMemo(() => resolveMessages(messages), [messages])

  // Stable ids for the two visually-hidden instruction elements rendered below;
  // slot cells and event buttons reference these via `aria-describedby`.
  const baseId = useId()
  const descriptionIds = useMemo(
    () => ({ selection: `${baseId}selection`, event: `${baseId}event` }),
    [baseId],
  )

  // Stable identities over the latest handlers (read via a ref) so the context
  // value isn't rebuilt — and every consumer re-rendered — when the app passes
  // fresh inline event callbacks each render. Default to a noop when unset.
  const handlersRef = useRef({
    onEventClick,
    onEventDoubleClick,
    onEventRightClick,
    onEventMiddleClick,
  })
  handlersRef.current = { onEventClick, onEventDoubleClick, onEventRightClick, onEventMiddleClick }
  const handleEventClick = useCallback((event: TEvent) => handlersRef.current.onEventClick?.(event), [])
  const handleEventDoubleClick = useCallback(
    (event: TEvent) => handlersRef.current.onEventDoubleClick?.(event),
    [],
  )
  const handleEventRightClick = useCallback(
    (event: TEvent, domEvent: ReactMouseEvent) => handlersRef.current.onEventRightClick?.(event, domEvent),
    [],
  )
  const handleEventMiddleClick = useCallback(
    (event: TEvent, domEvent: ReactMouseEvent) => handlersRef.current.onEventMiddleClick?.(event, domEvent),
    [],
  )
  // Presence (not identity) gates what gets wired. The right/middle wrappers are
  // exposed only when the app actually passed a handler, so consumers attach
  // `onContextMenu`/`onAuxClick` only then — an omitted right-click handler leaves
  // the browser's native context menu untouched (no listener at all).
  const hasRightClick = onEventRightClick != null
  const hasMiddleClick = onEventMiddleClick != null
  // The agenda renders its event title as a real button only when something is wired.
  const hasEventHandler =
    onEventClick != null || onEventDoubleClick != null || hasRightClick || hasMiddleClick

  const value = useMemo<CalendarContextValue<TEvent, TResource>>(
    () => ({
      store,
      components: components ?? {},
      messages: resolvedMessages,
      onEventClick: handleEventClick,
      onEventDoubleClick: handleEventDoubleClick,
      onEventRightClick: hasRightClick ? handleEventRightClick : undefined,
      onEventMiddleClick: hasMiddleClick ? handleEventMiddleClick : undefined,
      hasEventHandler,
      descriptionIds,
    }),
    [
      store,
      components,
      resolvedMessages,
      handleEventClick,
      handleEventDoubleClick,
      handleEventRightClick,
      handleEventMiddleClick,
      hasRightClick,
      hasMiddleClick,
      hasEventHandler,
      descriptionIds,
    ],
  )
  return (
    <CalendarContext.Provider value={value as CalendarContextValue}>
      <p id={descriptionIds.selection} className="bc-sr-only">
        {resolvedMessages.selectionInstructions}
      </p>
      <p id={descriptionIds.event} className="bc-sr-only">
        {resolvedMessages.eventInstructions}
      </p>
      {children}
    </CalendarContext.Provider>
  )
}

export default CalendarProvider

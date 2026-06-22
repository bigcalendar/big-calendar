import type { Messages, NavigateDirection, ViewKey } from '@big-calendar/core'
import type { ComponentType } from 'react'

/**
 * The per-slot component override map (§7). Every visual part of the calendar is
 * replaceable: pass a component — or a plain render function, which is the same
 * thing in React — for any slot. A more specific (per-view) slot wins over a
 * shared one at the render site. Generic over the event type so event-shaped
 * slots are typed against the app's event.
 */
export interface CalendarComponents<TEvent = unknown> {
  /** Replaces the navigation toolbar. */
  toolbar?: ComponentType<ToolbarProps>
  /** Month-view slot overrides. */
  month?: MonthComponents<TEvent>
  /** Time-grid (day / week / work-week) slot overrides. */
  time?: TimeComponents<TEvent>
  /** Agenda-view slot overrides. */
  agenda?: AgendaComponents<TEvent>
  /**
   * Custom view components, keyed by the same view key registered in the core
   * `views` config. When the active view is a registered custom view, `<Calendar>`
   * renders `views[viewKey]` inside `.bc-calendar`. With nothing registered for
   * the key, nothing renders.
   */
  views?: Record<string, ComponentType<CustomViewProps>>
}

/**
 * Props passed to a custom view component (`components.views[viewKey]`). `model`
 * is whatever the matching core `ViewDefinition.buildModel` returned — typed
 * `unknown` here, so cast it to the model type you produced (the same `TModel`
 * you inferred with `defineView`).
 */
export interface CustomViewProps {
  /** The active custom view key. */
  view: ViewKey
  /** The model the core view definition built; cast to your `TModel`. */
  model: unknown
}

/** Props passed to the toolbar — the default one or a `components.toolbar` override. */
export interface ToolbarProps {
  /** Localized title for the active view + focus date (from `store.label`). */
  label: string
  /** The active view. */
  view: ViewKey
  /** Views offered by the switcher. */
  views: ViewKey[]
  /** Resolved UI strings. */
  messages: Messages
  /** Move the focus date (PREV / NEXT / TODAY). */
  onNavigate: (direction: NavigateDirection) => void
  /** Switch the active view. */
  onView: (view: ViewKey) => void
}

/** Month-view slot overrides. */
export interface MonthComponents<TEvent> {
  /** A column heading in the weekday row. */
  weekday?: ComponentType<MonthWeekdayProps>
  /** A single day cell's date header (the number, today / off-range state). */
  dateCell?: ComponentType<MonthDateProps>
  /** One event segment within a week row. */
  event?: ComponentType<MonthEventProps<TEvent>>
  /** The "+N more" overflow indicator for a week. */
  showMore?: ComponentType<MonthShowMoreProps<TEvent>>
}

/** One overflowed event handed to a show-more slot. */
export interface ShowMoreEvent<TEvent> {
  /** Stable React key. */
  key: string
  /** The original event object. */
  event: TEvent
  /** Resolved event title. */
  title: string
}

/** Props for a weekday column heading. */
export interface MonthWeekdayProps {
  /** Day-start string of the representative day for this column. */
  day: string
  /** Full weekday name (e.g. "Monday"). */
  long: string
  /** Abbreviated weekday name (e.g. "Mon"). */
  short: string
}

/** Props for a day cell's date header. */
export interface MonthDateProps {
  /** Day-start string (RFC 3339/9557). */
  day: string
  /** Localized day-of-month number. */
  label: string
  /** Whether the day is the current date. */
  isToday: boolean
  /** Whether the day belongs to an adjacent month. */
  isOffRange: boolean
  /** Drill into this day (resolves the drilldown view). */
  onDrillDown: () => void
}

/** Props for a single month event segment. */
export interface MonthEventProps<TEvent> {
  /** The original event object. */
  event: TEvent
  /** Resolved event title. */
  title: string
}

/**
 * Props for a week's "+N more" overflow indicator.
 *
 * When building a custom show-more component that opens a popover, three
 * things are required for it to behave identically to the default:
 *
 * 1. **Trigger must be a `<button>`** — the `Popover` component uses the
 *    native HTML Popover API (`popovertarget`), which only works on `<button>`
 *    and `<input type="button">` elements. Spreading trigger props onto a
 *    `<div>` (even with `role="button"`) silently does nothing.
 *
 * 2. **Wrap `EventSlot` in `EventButton`** — `EventSlot` is the inner visual
 *    only. Wrap it in `<EventButton className="bc-segment" resizeEdges={[]}>` to
 *    get the card styling, background colour, and event click handlers.
 *
 * 3. **Use `className="bc-popover bc-show-more-popover"`** on `Popover` — the
 *    `bc-show-more-popover` class provides the height cap, scroll, and the grid
 *    reset that prevents `EventButton` children stacking invisibly on top of
 *    each other at the inherited grid position.
 */
export interface MonthShowMoreProps<TEvent> {
  /** How many events overflowed the week's row limit. */
  count: number
  /** Localized overflow label (e.g. "+2 more"). */
  label: string
  /** Day-start string of the week's first day (overflow anchor). */
  day: string
  /** The overflowed events, for listing in a popover. */
  events: ReadonlyArray<ShowMoreEvent<TEvent>>
  /**
   * The configured month event slot component. Wrap each event in
   * `<EventButton className="bc-segment" resizeEdges={[]}>` and render
   * `EventSlot` as its child so the popover events match the month grid.
   */
  EventSlot: ComponentType<MonthEventProps<TEvent>>
}

/** Time-grid (day / week / work-week) slot overrides. */
export interface TimeComponents<TEvent> {
  /** A day column heading (the date label + today state + drilldown). */
  dayHeading?: ComponentType<TimeDayHeadingProps>
  /** A labelled time in the left gutter. */
  timeLabel?: ComponentType<TimeLabelProps>
  /** A timed event box within a day column. */
  event?: ComponentType<TimeEventProps<TEvent>>
  /** An all-day event segment in the header row. */
  allDayEvent?: ComponentType<TimeAllDayEventProps<TEvent>>
  /** The "+N more" overflow indicator for the all-day row. */
  showMore?: ComponentType<TimeShowMoreProps<TEvent>>
  /** Content rendered inside a background event box. Replace via `components.time.backgroundEvent`. */
  backgroundEvent?: ComponentType<TimeBackgroundEventProps<TEvent>>
}

/** Props for a day column heading. */
export interface TimeDayHeadingProps {
  /** Day-start string (RFC 3339/9557). */
  day: string
  /** Localized day heading label. */
  label: string
  /** Whether the day is the current date. */
  isToday: boolean
  /** Drill into this day (resolves the drilldown view). */
  onDrillDown: () => void
}

/** Props for a gutter time label. */
export interface TimeLabelProps {
  /** Day-start-relative slot time the label marks. */
  time: string
  /** Localized time label (e.g. "9 AM"). */
  label: string
}

/** Props for a timed event box. */
export interface TimeEventProps<TEvent> {
  /** The original event object. */
  event: TEvent
  /** Resolved event title. */
  title: string
  /** Formatted "start – end" time. */
  time: string
}

/** Props for a background event box (time-grid only). */
export interface TimeBackgroundEventProps<TEvent> {
  /** The original event object. */
  event: TEvent
  /** Resolved event title. */
  title: string
}

/** Props for an all-day event segment. */
export interface TimeAllDayEventProps<TEvent> {
  /** The original event object. */
  event: TEvent
  /** Resolved event title. */
  title: string
}

/** Props for the all-day row's "+N more" overflow indicator. */
/**
 * Props for the time-grid all-day row's "+N more" overflow indicator.
 *
 * The same three requirements as {@link MonthShowMoreProps} apply here:
 * the `Popover` trigger must be a real `<button>`, `EventSlot` must be wrapped
 * in `<EventButton className="bc-segment" resizeEdges={[]}>`, and the `Popover`
 * must use `className="bc-popover bc-show-more-popover"`.
 *
 * **Additional time-grid requirement — `pointer-events: auto` on the trigger:**
 * The time grid wraps the show-more slot in a container with
 * `pointer-events: none` so that clicks fall through to the slot background for
 * selection. The default `.bc-show-more` class re-enables pointer events via
 * CSS. A custom trigger that relies on inline styles must set
 * `pointerEvents: 'auto'` explicitly, otherwise clicks are silently swallowed
 * by the wrapper and the popover never opens.
 */
export interface TimeShowMoreProps<TEvent> {
  /** How many events overflowed the all-day row limit. */
  count: number
  /** Localized overflow label (e.g. "+2 more"). */
  label: string
  /** The overflowed events, for listing in a popover. */
  events: ReadonlyArray<ShowMoreEvent<TEvent>>
  /**
   * The configured all-day event slot component. Wrap each event in
   * `<EventButton className="bc-segment" resizeEdges={[]}>` and render
   * `EventSlot` as its child so the popover events match the all-day strip.
   */
  EventSlot: ComponentType<TimeAllDayEventProps<TEvent>>
}

/** Agenda-view slot overrides. */
export interface AgendaComponents<TEvent> {
  /** The date label for a day group. */
  date?: ComponentType<AgendaDateProps>
  /** A single event row. */
  event?: ComponentType<AgendaEventProps<TEvent>>
  /** The empty state (no events in range). */
  empty?: ComponentType<AgendaEmptyProps>
}

/** Props for an agenda day's date label. */
export interface AgendaDateProps {
  /** Day-start string (RFC 3339/9557). */
  day: string
  /** Localized date label. */
  label: string
}

/** Props for a single agenda event row. */
export interface AgendaEventProps<TEvent> {
  /** The original event object. */
  event: TEvent
  /** Resolved event title. */
  title: string
  /** Formatted time (or the all-day label). */
  time: string
  /** Whether the event is all-day. */
  allDay: boolean
}

/** Props for the agenda empty state. */
export interface AgendaEmptyProps {
  /** Localized "no events in range" message. */
  message: string
}

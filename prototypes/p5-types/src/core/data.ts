// Canonical data shapes (event fields, data model). The kernel never mutates them.
import type {
  DateOrDateTimeString,
  DateString,
  EventId,
  ResourceId,
  SourceId,
  TimeZoneName,
  UntrustedHtml,
  Weekday,
} from './values.ts'

/** `true`, `false`, or resizable from one edge only (D-24). */
export type Resizable = boolean | 'start' | 'end'

/** The three cascading edit permissions (D-24, D-83). Unset means "ask the next level". */
export interface EditPermissions {
  draggable?: boolean
  resizable?: Resizable
  readOnly?: boolean
}

export type EventStatus = 'confirmed' | 'tentative' | 'cancelled'

/** RFC 5545 `FREQ`. */
export type Frequency =
  'yearly' | 'monthly' | 'weekly' | 'daily' | 'hourly' | 'minutely' | 'secondly'

/** An RRULE as an object; the string form (`FREQ=WEEKLY;BYDAY=MO`) is equivalent. Read by the recurrence module. */
export interface RecurrenceRule {
  freq: Frequency
  interval?: number
  /** A date or date-time string, in the same form as the event's `start`. */
  until?: DateOrDateTimeString
  count?: number
  /** Weekdays, optionally with an ordinal: `[1, 3]` or `[{ day: 5, nth: -1 }]` for "last Friday". */
  byDay?: readonly (Weekday | { day: Weekday; nth: number })[]
  byMonthDay?: readonly number[]
  byMonth?: readonly number[]
  byYearDay?: readonly number[]
  byWeekNo?: readonly number[]
  byHour?: readonly number[]
  byMinute?: readonly number[]
  bySecond?: readonly number[]
  bySetPos?: readonly number[]
  weekStart?: Weekday
}

/** The canonical event (event-fields.md, D-37). `allDay` isn't an input: it's derived (T-1). */
export interface CalendarEvent<TMeta = unknown> extends EditPermissions {
  id: EventId
  title: string
  start: DateOrDateTimeString
  /** Exclusive (T-3). Missing: one day for dates, `defaultEventDuration` for date-times (T-9). */
  end?: DateOrDateTimeString
  timeZone?: TimeZoneName
  endTimeZone?: TimeZoneName
  resourceIds?: readonly ResourceId[]
  sourceId?: SourceId
  /** Plain text. Defaults to a composed title and time (D-74). */
  tooltip?: string
  rrule?: string | RecurrenceRule
  exDates?: readonly DateOrDateTimeString[]
  rDates?: readonly DateOrDateTimeString[]
  /** With `recurrenceId`, marks this event as an override of one occurrence of that series. */
  recurringEventId?: EventId
  recurrenceId?: DateOrDateTimeString
  categories?: readonly string[]
  status?: EventStatus
  /** Default `true`. Free events never count as conflicts. */
  busy?: boolean
  /** Any CSS color. Wins over the source's and the resource's color (D-73). */
  color?: string
  description?: string
  location?: string
  url?: string
  descriptionHtml?: UntrustedHtml
  meta?: TMeta
}

/** Same fields, minus what makes no sense for something inert (D-39). */
export type BackgroundEvent<TMeta = unknown> = Omit<
  CalendarEvent<TMeta>,
  keyof EditPermissions | 'tooltip'
>

/** A resource (data model). Its permissions and color sit in their cascades. */
export interface Resource<TMeta = unknown> extends EditPermissions {
  id: ResourceId
  title: string
  /** Hierarchy, shown by the resource panel's tree only (engine). */
  parentId?: ResourceId
  color?: string
  meta?: TMeta
}

/** An event source: a named, colored group such as "Work" or "Holidays" (D-73, D-81). */
export interface EventSource<TMeta = unknown> extends EditPermissions {
  id: SourceId
  title: string
  color?: string
  meta?: TMeta
}

/** Which occurrence of a series a processed event is. */
export interface OccurrenceInfo {
  seriesId: EventId
  /** The occurrence's original start, in the series' form. */
  recurrenceId: DateOrDateTimeString
  /** True when an override event replaced this occurrence. */
  overridden: boolean
}

/**
 * An event after ingest, as view models and callbacks hand it out. Plain, frozen data (D-54).
 * `event` is the kernel's canonical copy (or the collection's row, D-58), never the app's object.
 */
export interface ProcessedEvent<TMeta = unknown> {
  readonly key: string
  readonly event: Readonly<CalendarEvent<TMeta>>
  /** Derived from the value types (T-1). */
  readonly allDay: boolean
  /** The cascade resolved: event, resource, source, calendar (D-83). */
  readonly permissions: Readonly<Required<EditPermissions>>
  /** The resolved color, or `undefined` for the theme default. */
  readonly color: string | undefined
  /** Set for expanded occurrences (recurrence registered). */
  readonly occurrence: OccurrenceInfo | undefined
}

/** A date range with an exclusive end (T-3). */
export interface DateRange {
  start: DateString
  end: DateString
}

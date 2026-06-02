/**
 * Public type contract for every Big Calendar localizer.
 *
 * The localizer is the single boundary where datetime *strings* (RFC 3339 or,
 * when {@link LocalizerOptions.extendedZone} is on, RFC 9557) become date math.
 * Everything is string-in / string-out: no `Date` object ever leaks across this
 * boundary, so `core` and the UI packages never touch raw date math.
 */

/** Calendar units understood by add/diff/startOf/endOf/range/ceil. */
export type DateTimeUnit =
  | 'year'
  | 'month'
  | 'week'
  | 'day'
  | 'hour'
  | 'minute'
  | 'second'
  | 'millisecond'

/**
 * Calendar units that map to a single, fixed boundary the engine localizer can
 * resolve without locale knowledge. `'week'` is intentionally excluded — week
 * boundaries depend on {@link LocalizerOptions.firstDayOfWeek}, so the base
 * class derives them from `'day'` rather than asking the engine.
 */
export type FixedUnit = Exclude<DateTimeUnit, 'week'>

/**
 * The decomposed wall-clock fields of a datetime, in the localizer's timezone.
 * `weekday` follows ISO-8601 / Temporal: 1 = Monday … 7 = Sunday.
 */
export interface DateParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  millisecond: number
  /** 1 = Monday … 7 = Sunday (ISO-8601). */
  weekday: number
}

/** Wall-clock time of day, used by slot math. */
export interface TimeParts {
  hour: number
  minute: number
  second?: number
  millisecond?: number
}

/** A datetime span expressed as two boundary strings. */
export interface DateRange {
  start: string
  end: string
}

/** Named Intl.DateTimeFormat option sets, addressable by role. */
export type FormatKey =
  | 'date'
  | 'time'
  | 'datetime'
  | 'weekday'
  | 'weekdayShort'
  | 'dayOfMonth'
  | 'monthDay'
  | 'monthYear'
  | 'monthHeader'
  | 'dayHeader'
  | 'agendaDate'
  | 'agendaTime'
  | 'timeGutter'
  | 'selectRange'

/** Overridable map of named format roles to Intl.DateTimeFormat options. */
export type FormatMap = Partial<Record<FormatKey, Intl.DateTimeFormatOptions>>

/** A `format` argument: either a named role or an explicit Intl option set. */
export type FormatInput = FormatKey | Intl.DateTimeFormatOptions

/** Constructor options shared by every localizer. */
export interface LocalizerOptions {
  /** BCP-47 tag or Intl.Locale; defaults to the host's resolved locale. */
  locale?: string | Intl.Locale
  /** IANA timezone; defaults to the host's resolved timezone. */
  timezone?: string
  /** `false` → RFC 3339 I/O; `true` → RFC 9557 (IANA bracket suffix) I/O. */
  extendedZone?: boolean
  /** Overrides merged over the built-in default format roles. */
  formats?: FormatMap
  /** 1 = Monday … 7 = Sunday. Defaults to locale `weekInfo`, fallback Sunday. */
  firstDayOfWeek?: number
}

/** A comparison that may optionally be evaluated at a unit granularity. */
export interface CompareArgs {
  a: string
  b: string
  /** When set, both sides are floored to this unit before comparing. */
  unit?: DateTimeUnit
}

/**
 * The full string-in / string-out surface that `core` and UI packages program
 * against. `core` depends on this interface, never on a concrete localizer.
 */
export interface LocalizerContract {
  readonly locale: Intl.Locale
  readonly timezone: string
  readonly extendedZone: boolean

  /** Human-facing formatting via a named role or explicit Intl options. */
  format(args: { value: string; format: FormatInput }): string

  // comparison
  lt(args: CompareArgs): boolean
  lte(args: CompareArgs): boolean
  gt(args: CompareArgs): boolean
  gte(args: CompareArgs): boolean
  eq(args: CompareArgs): boolean
  neq(args: CompareArgs): boolean
  inRange(args: { value: string; min: string; max: string; unit?: DateTimeUnit }): boolean

  // math
  add(args: { value: string; amount: number; unit: DateTimeUnit }): string
  startOf(args: { value: string; unit: DateTimeUnit }): string
  endOf(args: { value: string; unit: DateTimeUnit }): string
  ceil(args: { value: string; unit: DateTimeUnit }): string
  diff(args: { a: string; b: string; unit: DateTimeUnit }): number
  range(args: { start: string; end: string; unit?: DateTimeUnit }): string[]
  min(args: { values: string[] }): string
  max(args: { values: string[] }): string

  // week / visible-range
  firstDayOfWeek(): number
  startOfWeek(value: string): string
  firstVisibleDay(value: string): string
  lastVisibleDay(value: string): string
  visibleDays(value: string): string[]

  // slot / minute math
  minutes(value: string): number
  getMinutesFromMidnight(value: string): number
  getTotalMin(args: { start: string; end: string }): number
  getSlotDate(args: { date: string; minutesFromMidnight: number }): string
  daySpan(args: { start: string; end: string }): number

  // timezone / DST
  getTimezoneOffset(value: string): number
  getDstOffset(args: { start: string; end: string }): number

  // event-range helpers
  isSameDate(args: { a: string; b: string }): boolean
  startAndEndAreDateOnly(args: DateRange): boolean
  continuesPrior(args: { eventStart: string; rangeStart: string }): boolean
  continuesAfter(args: { eventEnd: string; rangeEnd: string }): boolean
  inEventRange(args: { event: DateRange; range: DateRange }): boolean
  sortEvents<TEvent extends DateRange & { allDay?: boolean }>(args: {
    events: TEvent[]
  }): TEvent[]
}

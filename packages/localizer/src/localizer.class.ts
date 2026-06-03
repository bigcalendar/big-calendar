import { DEFAULT_FORMATS } from './constants/formats.constant'
import { getWeekInfo } from './ponyfills/weekInfo.function'
import type {
  CompareArgs,
  DateParts,
  DateRange,
  DateTimeUnit,
  FixedUnit,
  FormatInput,
  FormatKey,
  LocalizerContract,
  LocalizerOptions,
  TimeParts,
} from './types/localizer.type'

/** Guard cap so a non-advancing `range` step can never loop forever. */
const RANGE_GUARD = 100_000

function resolveLocale(input: LocalizerOptions['locale']): Intl.Locale {
  if (input instanceof Intl.Locale) {
    return input
  }
  if (typeof input === 'string') {
    return new Intl.Locale(input)
  }
  return new Intl.Locale(new Intl.DateTimeFormat().resolvedOptions().locale)
}

function resolveTimezone(input: string | undefined): string {
  return input ?? new Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Abstract base every Big Calendar localizer extends.
 *
 * It implements the entire string-in / string-out {@link LocalizerContract} on
 * top of a small set of engine primitives (the `protected abstract` members),
 * which a subclass supplies using its date library of choice (Temporal, Luxon,
 * …). All locale/timezone/week logic and the `Intl`-based formatting live here
 * so every localizer behaves identically.
 *
 * `T` is the subclass's internal datetime representation; it never escapes the
 * public surface.
 */
export abstract class Localizer<T = unknown> implements LocalizerContract {
  readonly locale: Intl.Locale
  readonly timezone: string
  readonly extendedZone: boolean
  readonly output: 'utc' | 'offset'

  protected readonly formats: Record<FormatKey, Intl.DateTimeFormatOptions>
  private readonly _firstDayOfWeek: number

  constructor(options: LocalizerOptions = {}) {
    this.locale = resolveLocale(options.locale)
    this.timezone = resolveTimezone(options.timezone)
    this.extendedZone = options.extendedZone ?? false
    this.output = options.output ?? 'utc'
    this.formats = { ...DEFAULT_FORMATS, ...(options.formats ?? {}) }
    // Resolution order: explicit override → locale weekInfo (native or
    // ponyfilled) → Monday (1) as the last-resort fallback. The weekInfo
    // guarantee makes the trailing fallback effectively unreachable; Monday
    // matches the CLDR "001" no-region default.
    this._firstDayOfWeek = options.firstDayOfWeek ?? getWeekInfo(this.locale).firstDay ?? 1
  }

  // ── engine primitives (supplied by the date-library subclass) ──────────────

  /** Parse an RFC 3339/9557 string into the internal datetime, in `timezone`. */
  protected abstract parse(value: string): T
  /**
   * Serialize back to RFC 3339, or RFC 9557 (IANA bracket) when `extendedZone`.
   * The instant is rendered as `…Z` unless `output` is `'offset'`.
   */
  protected abstract serialize(dt: T): string
  /** Epoch milliseconds for the instant (used for compare/format). */
  protected abstract toEpochMs(dt: T): number
  /** Wall-clock fields in `timezone` (weekday 1=Mon … 7=Sun). */
  protected abstract getParts(dt: T): DateParts
  /** Add a signed amount of a unit (calendar-aware). */
  protected abstract addUnits(dt: T, amount: number, unit: DateTimeUnit): T
  /** Floor to the start of a fixed unit. */
  protected abstract startOfUnit(dt: T, unit: FixedUnit): T
  /** Last representable instant within a fixed unit. */
  protected abstract endOfUnit(dt: T, unit: FixedUnit): T
  /** Whole signed `unit`s from `b` to `a` (a − b), truncated toward zero. */
  protected abstract diffUnits(a: T, b: T, unit: DateTimeUnit): number
  /** Replace the wall-clock time of day, keeping the date. */
  protected abstract withTime(dt: T, time: TimeParts): T
  /** Offset east of UTC, in minutes, at this instant (e.g. EDT → −240). */
  protected abstract offsetMinutes(dt: T): number

  // ── internal helpers ───────────────────────────────────────────────────────

  /** Floor an internal datetime to a unit (week is locale-aware). */
  private floor(dt: T, unit: DateTimeUnit): T {
    return unit === 'week' ? this.startOfWeekT(dt) : this.startOfUnit(dt, unit)
  }

  /** Start of the locale week containing `dt`. */
  private startOfWeekT(dt: T): T {
    const day = this.startOfUnit(dt, 'day')
    const back = (this.getParts(day).weekday - this._firstDayOfWeek + 7) % 7
    return this.addUnits(day, -back, 'day')
  }

  /** Epoch ms used for comparison, optionally floored to a unit first. */
  private compareEpoch(value: string, unit: DateTimeUnit | undefined): number {
    const dt = this.parse(value)
    return this.toEpochMs(unit ? this.floor(dt, unit) : dt)
  }

  /** −1 / 0 / 1 comparison of two values at an optional unit granularity. */
  private cmp(a: string, b: string, unit?: DateTimeUnit): number {
    const ea = this.compareEpoch(a, unit)
    const eb = this.compareEpoch(b, unit)
    return ea < eb ? -1 : ea > eb ? 1 : 0
  }

  /** Advance one whole unit (week → 7 days). */
  private stepOne(dt: T, unit: DateTimeUnit): T {
    return unit === 'week' ? this.addUnits(dt, 7, 'day') : this.addUnits(dt, 1, unit)
  }

  // ── formatting ──────────────────────────────────────────────────────────────

  format({ value, format }: { value: string; format: FormatInput }): string {
    const options = typeof format === 'string' ? this.formats[format] : format
    const epoch = this.toEpochMs(this.parse(value))
    return new Intl.DateTimeFormat(this.locale, { timeZone: this.timezone, ...options }).format(epoch)
  }

  // ── comparison ───────────────────────────────────────────────────────────────

  lt({ a, b, unit }: CompareArgs): boolean {
    return this.cmp(a, b, unit) < 0
  }
  lte({ a, b, unit }: CompareArgs): boolean {
    return this.cmp(a, b, unit) <= 0
  }
  gt({ a, b, unit }: CompareArgs): boolean {
    return this.cmp(a, b, unit) > 0
  }
  gte({ a, b, unit }: CompareArgs): boolean {
    return this.cmp(a, b, unit) >= 0
  }
  eq({ a, b, unit }: CompareArgs): boolean {
    return this.cmp(a, b, unit) === 0
  }
  neq({ a, b, unit }: CompareArgs): boolean {
    return this.cmp(a, b, unit) !== 0
  }
  inRange({ value, min, max, unit }: { value: string; min: string; max: string; unit?: DateTimeUnit }): boolean {
    return this.cmp(value, min, unit) >= 0 && this.cmp(value, max, unit) <= 0
  }

  // ── math ─────────────────────────────────────────────────────────────────────

  add({ value, amount, unit }: { value: string; amount: number; unit: DateTimeUnit }): string {
    const dt = this.parse(value)
    const next = unit === 'week' ? this.addUnits(dt, amount * 7, 'day') : this.addUnits(dt, amount, unit)
    return this.serialize(next)
  }

  startOf({ value, unit }: { value: string; unit: DateTimeUnit }): string {
    return this.serialize(this.floor(this.parse(value), unit))
  }

  endOf({ value, unit }: { value: string; unit: DateTimeUnit }): string {
    const dt = this.parse(value)
    if (unit === 'week') {
      const lastDay = this.addUnits(this.startOfWeekT(dt), 6, 'day')
      return this.serialize(this.endOfUnit(lastDay, 'day'))
    }
    return this.serialize(this.endOfUnit(dt, unit))
  }

  ceil({ value, unit }: { value: string; unit: DateTimeUnit }): string {
    const dt = this.parse(value)
    const floored = this.floor(dt, unit)
    if (this.toEpochMs(floored) === this.toEpochMs(dt)) {
      return this.serialize(dt)
    }
    return this.serialize(this.stepOne(floored, unit))
  }

  diff({ a, b, unit }: { a: string; b: string; unit: DateTimeUnit }): number {
    const da = this.parse(a)
    const db = this.parse(b)
    if (unit === 'week') {
      return Math.trunc(this.diffUnits(da, db, 'day') / 7)
    }
    return this.diffUnits(da, db, unit)
  }

  range({ start, end, unit }: { start: string; end: string; unit?: DateTimeUnit }): string[] {
    const step = unit ?? 'day'
    const endEpoch = this.toEpochMs(this.parse(end))
    const out: string[] = []
    let cur = this.parse(start)
    let guard = 0
    while (this.toEpochMs(cur) <= endEpoch && guard < RANGE_GUARD) {
      out.push(this.serialize(cur))
      cur = this.stepOne(cur, step)
      guard += 1
    }
    return out
  }

  min({ values }: { values: string[] }): string {
    if (values.length === 0) {
      throw new RangeError('min() requires at least one value')
    }
    return values.reduce((acc, cur) => (this.cmp(cur, acc) < 0 ? cur : acc))
  }

  max({ values }: { values: string[] }): string {
    if (values.length === 0) {
      throw new RangeError('max() requires at least one value')
    }
    return values.reduce((acc, cur) => (this.cmp(cur, acc) > 0 ? cur : acc))
  }

  // ── week / visible-range ──────────────────────────────────────────────────────

  firstDayOfWeek(): number {
    return this._firstDayOfWeek
  }

  startOfWeek(value: string): string {
    return this.serialize(this.startOfWeekT(this.parse(value)))
  }

  firstVisibleDay(value: string): string {
    const monthStart = this.startOfUnit(this.parse(value), 'month')
    return this.serialize(this.startOfWeekT(monthStart))
  }

  lastVisibleDay(value: string): string {
    const monthEnd = this.startOfUnit(this.endOfUnit(this.parse(value), 'month'), 'day')
    const weekLastDay = this.addUnits(this.startOfWeekT(monthEnd), 6, 'day')
    return this.serialize(weekLastDay)
  }

  visibleDays(value: string): string[] {
    return this.range({ start: this.firstVisibleDay(value), end: this.lastVisibleDay(value), unit: 'day' })
  }

  // ── slot / minute math ────────────────────────────────────────────────────────

  minutes(value: string): number {
    return this.getParts(this.parse(value)).minute
  }

  getMinutesFromMidnight(value: string): number {
    const p = this.getParts(this.parse(value))
    return p.hour * 60 + p.minute
  }

  getTotalMin({ start, end }: { start: string; end: string }): number {
    return (this.toEpochMs(this.parse(end)) - this.toEpochMs(this.parse(start))) / 60_000
  }

  getSlotDate({ date, minutesFromMidnight }: { date: string; minutesFromMidnight: number }): string {
    const dayStart = this.startOfUnit(this.parse(date), 'day')
    const days = Math.floor(minutesFromMidnight / 1440)
    const within = minutesFromMidnight - days * 1440
    const slot = this.withTime(dayStart, { hour: Math.floor(within / 60), minute: within % 60, second: 0, millisecond: 0 })
    return this.serialize(days === 0 ? slot : this.addUnits(slot, days, 'day'))
  }

  daySpan({ start, end }: { start: string; end: string }): number {
    return this.diffUnits(this.parse(end), this.parse(start), 'day')
  }

  // ── timezone / DST ────────────────────────────────────────────────────────────

  getTimezoneOffset(value: string): number {
    // JS convention: minutes *behind* UTC (positive west).
    return -this.offsetMinutes(this.parse(value))
  }

  getDstOffset({ start, end }: { start: string; end: string }): number {
    return this.offsetMinutes(this.parse(end)) - this.offsetMinutes(this.parse(start))
  }

  // ── event-range helpers ───────────────────────────────────────────────────────

  isSameDate({ a, b }: { a: string; b: string }): boolean {
    return this.cmp(a, b, 'day') === 0
  }

  startAndEndAreDateOnly({ start, end }: DateRange): boolean {
    return this.getMinutesFromMidnight(start) === 0 && this.getMinutesFromMidnight(end) === 0
  }

  continuesPrior({ eventStart, rangeStart }: { eventStart: string; rangeStart: string }): boolean {
    return this.cmp(eventStart, rangeStart) < 0
  }

  continuesAfter({ eventEnd, rangeEnd }: { eventEnd: string; rangeEnd: string }): boolean {
    return this.cmp(eventEnd, rangeEnd) > 0
  }

  inEventRange({ event, range }: { event: DateRange; range: DateRange }): boolean {
    if (this.cmp(event.start, event.end) === 0) {
      // Zero-length event: include when it lands within [range.start, range.end).
      return this.cmp(event.start, range.start) >= 0 && this.cmp(event.start, range.end) < 0
    }
    return this.cmp(event.start, range.end) < 0 && this.cmp(event.end, range.start) > 0
  }

  sortEvents<TEvent extends DateRange & { allDay?: boolean }>({ events }: { events: TEvent[] }): TEvent[] {
    return [...events].sort((a, b) => {
      const byStart = this.cmp(a.start, b.start)
      if (byStart !== 0) {
        return byStart
      }
      const allDayRank = (a.allDay ? 0 : 1) - (b.allDay ? 0 : 1)
      if (allDayRank !== 0) {
        return allDayRank
      }
      // Longer events first (later end wins the tie).
      return this.cmp(b.end, a.end)
    })
  }
}

import { Localizer } from '@big-calendar/localizer'
import type { DateParts, DateTimeUnit, FixedUnit, LocalizerOptions, TimeParts } from '@big-calendar/localizer'
import type { Temporal } from 'temporal-polyfill'
import type { TemporalAPI } from './loadTemporal.function'

/** Maps a contract unit to its Temporal `Duration` field name. */
const PLURAL = {
  year: 'years',
  month: 'months',
  week: 'weeks',
  day: 'days',
  hour: 'hours',
  minute: 'minutes',
  second: 'seconds',
  millisecond: 'milliseconds',
} as const satisfies Record<DateTimeUnit, keyof Temporal.DurationLike>

const NANOS_PER_MINUTE = 60_000_000_000

/**
 * Localizer backed by the Temporal API. Implements the engine primitives the
 * base {@link Localizer} composes its contract from; all locale/week/format
 * logic lives in the base class.
 *
 * Construct via {@link createTemporalLocalizer}, which resolves the Temporal
 * namespace (native or polyfilled) first. `T` is `Temporal.ZonedDateTime` and
 * never escapes the public string-in/string-out surface.
 */
export class TemporalLocalizer extends Localizer<Temporal.ZonedDateTime> {
  constructor(
    options: LocalizerOptions = {},
    private readonly api: TemporalAPI,
  ) {
    // The base constructor never calls a primitive, so `api` is set before use.
    super(options)
  }

  protected parse(value: string): Temporal.ZonedDateTime {
    if (value.includes('[')) {
      return this.api.ZonedDateTime.from(value).toInstant().toZonedDateTimeISO(this.timeZone)
    }
    if (!/[T ]/.test(value)) {
      // Date-only input: midnight in the localizer timeZone.
      return this.api.PlainDate.from(value).toZonedDateTime(this.timeZone)
    }
    return this.api.Instant.from(value).toZonedDateTimeISO(this.timeZone)
  }

  protected serialize(dt: Temporal.ZonedDateTime): string {
    // The instant is canonical UTC (`…Z`) unless the app opts into local offset.
    // extendedZone then appends the IANA bracket → RFC 9557, e.g. `…Z[America/New_York]`.
    const body =
      this.output === 'offset' ? dt.toString({ timeZoneName: 'never' }) : dt.toInstant().toString()
    return this.extendedZone ? `${body}[${dt.timeZoneId}]` : body
  }

  protected toEpochMs(dt: Temporal.ZonedDateTime): number {
    return dt.epochMilliseconds
  }

  protected getParts(dt: Temporal.ZonedDateTime): DateParts {
    return {
      year: dt.year,
      month: dt.month,
      day: dt.day,
      hour: dt.hour,
      minute: dt.minute,
      second: dt.second,
      millisecond: dt.millisecond,
      weekday: dt.dayOfWeek,
    }
  }

  protected addUnits(dt: Temporal.ZonedDateTime, amount: number, unit: DateTimeUnit): Temporal.ZonedDateTime {
    return dt.add({ [PLURAL[unit]]: amount })
  }

  protected startOfUnit(dt: Temporal.ZonedDateTime, unit: FixedUnit): Temporal.ZonedDateTime {
    if (unit === 'year') {
      return dt.with({ month: 1, day: 1 }).startOfDay()
    }
    if (unit === 'month') {
      return dt.with({ day: 1 }).startOfDay()
    }
    if (unit === 'day') {
      return dt.startOfDay()
    }
    return dt.round({ smallestUnit: unit, roundingMode: 'floor' })
  }

  protected endOfUnit(dt: Temporal.ZonedDateTime, unit: FixedUnit): Temporal.ZonedDateTime {
    return this.addUnits(this.startOfUnit(dt, unit), 1, unit).subtract({ milliseconds: 1 })
  }

  protected diffUnits(a: Temporal.ZonedDateTime, b: Temporal.ZonedDateTime, unit: DateTimeUnit): number {
    const duration = a.since(b, { largestUnit: unit, smallestUnit: unit, roundingMode: 'trunc' })
    return duration[PLURAL[unit]]
  }

  protected withTime(dt: Temporal.ZonedDateTime, time: TimeParts): Temporal.ZonedDateTime {
    return dt.with({
      hour: time.hour,
      minute: time.minute,
      second: time.second ?? 0,
      millisecond: time.millisecond ?? 0,
      microsecond: 0,
      nanosecond: 0,
    })
  }

  protected offsetMinutes(dt: Temporal.ZonedDateTime): number {
    return dt.offsetNanoseconds / NANOS_PER_MINUTE
  }
}

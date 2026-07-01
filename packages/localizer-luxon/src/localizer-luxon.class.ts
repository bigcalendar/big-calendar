import { Localizer } from '@big-calendar/localizer'
import type { DateParts, DateTimeUnit, FixedUnit, TimeParts } from '@big-calendar/localizer'
import { DateTime } from 'luxon'

/** Maps a contract unit to its Luxon Duration key (plural form). */
const DURATION_KEY = {
  year: 'years',
  month: 'months',
  week: 'weeks',
  day: 'days',
  hour: 'hours',
  minute: 'minutes',
  second: 'seconds',
  millisecond: 'milliseconds',
} as const satisfies Record<DateTimeUnit, string>

type DurationKey = (typeof DURATION_KEY)[DateTimeUnit]

/**
 * Localizer backed by Luxon. Implements the engine primitives the base
 * {@link Localizer} composes its contract from; all locale/week/format logic
 * lives in the base class.
 *
 * `T` is Luxon's `DateTime` and never escapes the public string-in/string-out
 * surface. Construct via {@link createLuxonLocalizer}.
 */
export class LuxonLocalizer extends Localizer<DateTime> {
  protected parse(value: string): DateTime {
    // RFC 9557: strip IANA bracket suffix, parse ISO with the extracted zone
    // (to interpret wall-clock times correctly), then convert to this.timeZone.
    if (value.includes('[')) {
      const bracketStart = value.indexOf('[')
      const bracketEnd = value.indexOf(']', bracketStart)
      if (bracketEnd > bracketStart) {
        const zone = value.slice(bracketStart + 1, bracketEnd)
        const clean = value.slice(0, bracketStart)
        return DateTime.fromISO(clean, { zone }).setZone(this.timeZone)
      }
    }
    // Date-only (no T or space): treat as midnight in the localizer timezone.
    if (!/[T ]/.test(value)) {
      return DateTime.fromISO(value, { zone: this.timeZone }).startOf('day')
    }
    // Full ISO instant: parse preserving the embedded offset, then convert.
    return DateTime.fromISO(value).setZone(this.timeZone)
  }

  protected serialize(dt: DateTime): string {
    const opts = { suppressMilliseconds: true } as const
    const body =
      this.output === 'offset'
        ? (dt.toISO(opts) ?? '')
        : (dt.toUTC().toISO(opts) ?? '')
    return this.extendedZone ? `${body}[${dt.zoneName}]` : body
  }

  protected toEpochMs(dt: DateTime): number {
    return dt.toMillis()
  }

  protected getParts(dt: DateTime): DateParts {
    return {
      year: dt.year,
      month: dt.month,
      day: dt.day,
      hour: dt.hour,
      minute: dt.minute,
      second: dt.second,
      millisecond: dt.millisecond,
      // Luxon weekday: 1 = Monday … 7 = Sunday (matches ISO-8601 / contract).
      weekday: dt.weekday,
    }
  }

  protected addUnits(dt: DateTime, amount: number, unit: DateTimeUnit): DateTime {
    return dt.plus({ [DURATION_KEY[unit]]: amount })
  }

  protected startOfUnit(dt: DateTime, unit: FixedUnit): DateTime {
    // Luxon accepts all FixedUnit values (year/month/day/hour/minute/second/ms).
    return dt.startOf(unit as Exclude<FixedUnit, never>)
  }

  protected endOfUnit(dt: DateTime, unit: FixedUnit): DateTime {
    return dt.endOf(unit as Exclude<FixedUnit, never>)
  }

  protected diffUnits(a: DateTime, b: DateTime, unit: DateTimeUnit): number {
    // Luxon diff returns a Duration in the specified unit; .as() converts to a
    // float. Math.trunc satisfies the contract's "truncated toward zero" clause.
    return Math.trunc(a.diff(b, DURATION_KEY[unit] as DurationKey).as(DURATION_KEY[unit] as DurationKey))
  }

  protected withTime(dt: DateTime, time: TimeParts): DateTime {
    return dt.set({
      hour: time.hour,
      minute: time.minute,
      second: time.second ?? 0,
      millisecond: time.millisecond ?? 0,
    })
  }

  protected offsetMinutes(dt: DateTime): number {
    // Luxon dt.offset is already minutes east of UTC — matches the contract.
    return dt.offset
  }
}

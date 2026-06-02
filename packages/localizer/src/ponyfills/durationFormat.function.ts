/**
 * Ponyfill for `Intl.DurationFormat`.
 *
 * Duration display (e.g. event length in the agenda/tooltip) must work even on
 * hosts that predate `Intl.DurationFormat`. When the native API exists we use
 * it; otherwise we compose the output from `Intl.NumberFormat` unit styles and
 * `Intl.ListFormat`.
 */

export type DurationStyle = 'long' | 'short' | 'narrow'

/** A subset of the ECMAScript duration record, in display order. */
export interface DurationParts {
  years?: number
  months?: number
  weeks?: number
  days?: number
  hours?: number
  minutes?: number
  seconds?: number
}

const UNIT_ORDER: readonly (keyof DurationParts)[] = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
]

/** Map a duration-record key to its `Intl.NumberFormat` unit identifier. */
const NUMBER_UNIT: Record<keyof DurationParts, string> = {
  years: 'year',
  months: 'month',
  weeks: 'week',
  days: 'day',
  hours: 'hour',
  minutes: 'minute',
  seconds: 'second',
}

interface MaybeDurationFormatCtor {
  DurationFormat?: new (
    locale: string,
    options?: { style?: DurationStyle },
  ) => { format: (duration: DurationParts) => string }
}

/**
 * Format a duration record for display. Falls back to a unit-list rendering
 * when `Intl.DurationFormat` is unavailable.
 */
export function formatDuration(args: {
  locale: string | Intl.Locale
  duration: DurationParts
  style?: DurationStyle
}): string {
  const { duration, style = 'short' } = args
  const locale = typeof args.locale === 'string' ? args.locale : args.locale.toString()

  const ctor = (Intl as unknown as MaybeDurationFormatCtor).DurationFormat
  if (typeof ctor === 'function') {
    return new ctor(locale, { style }).format(duration)
  }

  const unitDisplay = style
  const parts: string[] = []
  for (const unit of UNIT_ORDER) {
    const amount = duration[unit]
    if (amount === undefined || amount === 0) {
      continue
    }
    parts.push(
      new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: NUMBER_UNIT[unit],
        unitDisplay,
      }).format(amount),
    )
  }

  if (parts.length === 0) {
    return new Intl.NumberFormat(locale, { style: 'unit', unit: 'minute', unitDisplay }).format(0)
  }

  return new Intl.ListFormat(locale, { style: 'narrow', type: 'unit' }).format(parts)
}

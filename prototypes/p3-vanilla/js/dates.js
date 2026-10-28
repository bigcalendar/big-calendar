// Civil-date helpers for the prototype. Dates are 'YYYY-MM-DD' strings and
// times are wall-clock minutes from midnight, so no zone math is needed.
// (The product uses Temporal; this prototype only tests accessibility.)
const DAY = 86_400_000

export function toUtc(date) {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
export function fromUtc(ms) {
  return new Date(ms).toISOString().slice(0, 10)
}
export function addDays(date, n) {
  return fromUtc(toUtc(date) + n * DAY)
}
export function weekday(date) {
  return new Date(toUtc(date)).getUTCDay()
}
export function diffDays(a, b) {
  return Math.round((toUtc(b) - toUtc(a)) / DAY)
}
export function startOfWeek(date) {
  return addDays(date, -weekday(date))
}
export function startOfMonth(date) {
  return date.slice(0, 8) + '01'
}
export function addMonths(date, n) {
  const [y, m, d] = date.split('-').map(Number)
  const first = new Date(Date.UTC(y, m - 1 + n, 1))
  const last = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate()
  return fromUtc(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(d, last)),
  )
}
export function sameMonth(a, b) {
  return a.slice(0, 7) === b.slice(0, 7)
}
/** The weeks shown by a month view: Sunday-start rows covering the month. */
export function monthWeeks(date) {
  const first = startOfMonth(date)
  const start = startOfWeek(first)
  const lastDay = addDays(addMonths(first, 1), -1)
  const weeks = []
  for (let w = start; w <= lastDay; w = addDays(w, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(w, i)))
  }
  return weeks
}

const fmt = (opts) =>
  new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...opts })
const longDate = fmt({
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})
const dayDate = fmt({ weekday: 'long', month: 'long', day: 'numeric' })
const monthYear = fmt({ month: 'long', year: 'numeric' })
const weekdayLong = fmt({ weekday: 'long' })
const weekdayShort = fmt({ weekday: 'short' })
const time = fmt({ hour: 'numeric', minute: '2-digit' })

export const format = {
  long: (d) => longDate.format(toUtc(d)),
  day: (d) => dayDate.format(toUtc(d)),
  monthYear: (d) => monthYear.format(toUtc(d)),
  weekdayLong: (d) => weekdayLong.format(toUtc(d)),
  weekdayShort: (d) => weekdayShort.format(toUtc(d)),
  dayNumber: (d) => String(Number(d.slice(8))),
  time: (min) => time.format(min * 60_000),
  /** "9:00 to 9:15 AM", or "11:30 AM to 1:00 PM" when the periods differ. */
  timeRange(start, end) {
    const a = time.formatToParts(start * 60_000)
    const b = time.formatToParts(end * 60_000)
    const period = (parts) => parts.find((p) => p.type === 'dayPeriod')?.value
    const join = (parts, withPeriod) =>
      parts
        .filter(
          (p) =>
            withPeriod ||
            (p.type !== 'dayPeriod' &&
              !(p.type === 'literal' && p.value.trim() === '')),
        )
        .map((p) => p.value)
        .join('')
        .trim()
    return period(a) === period(b)
      ? `${join(a, false)} to ${join(b, true)}`
      : `${join(a, true)} to ${join(b, true)}`
  },
  /** "October 25 – 31, 2026" for the week label. */
  range(a, b) {
    return fmt({ month: 'long', day: 'numeric', year: 'numeric' }).formatRange(
      toUtc(a),
      toUtc(b),
    )
  },
}

// View models: plain data with positions as indexes (D-54). Built from the
// events, the view's range and the DST table.
import { addDays, diffDays, startOfWeek, monthWeeks, format } from './dates.js'
import { DST, SLOT_MINUTES, BACKGROUND } from './data.js'
import { compareEvents } from './machines/events.js'
import { messages } from './messages.js'

export const SLOTS_PER_DAY = 1440 / SLOT_MINUTES

/** Focusable slots of a day: every wall-clock slot except a spring-forward gap (spec 4.4). */
export function slotsOf(date) {
  const dst = DST[date]
  const all = Array.from({ length: SLOTS_PER_DAY }, (_, i) => i)
  if (dst?.kind !== 'gap') return all
  return all.filter(
    (s) => s * SLOT_MINUTES < dst.from || s * SLOT_MINUTES >= dst.to,
  )
}

export function slotName(date, slot) {
  const start = slot * SLOT_MINUTES
  const parts = [
    format.timeRange(start, start + SLOT_MINUTES),
    format.day(date),
  ]
  const dst = DST[date]
  if (dst?.kind === 'gap' && start === dst.to)
    parts.push(messages.afterDstChange)
  if (dst?.kind === 'repeat' && start >= dst.from && start < dst.to)
    parts.push(messages.repeatedHour(dst.first, dst.second))
  return parts.join(', ')
}

export function backgroundFor(date, slot) {
  const start = slot * SLOT_MINUTES
  return BACKGROUND.filter(
    (b) =>
      b.start === date && b.startMin < start + SLOT_MINUTES && b.endMin > start,
  )
}

export function weekDays(date) {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** Days an all-day event covers, clipped to [from, to]. */
function coveredDays(e, from, to) {
  const days = []
  for (let d = e.start; d < e.end; d = addDays(d, 1))
    if (d >= from && d <= to) days.push(d)
  return days
}

/** Month: per day, the events touching it, in layout order. */
export function monthModel(events, date) {
  const weeks = monthWeeks(date)
  const from = weeks[0][0]
  const to = weeks.at(-1).at(-1)
  const byDay = new Map(weeks.flat().map((d) => [d, []]))
  for (const e of [...events].sort(compareEvents)) {
    if (e.allDay) {
      const days = coveredDays(e, from, to)
      days.forEach((d, i) =>
        byDay.get(d).push({ event: e, continuation: i > 0, last: days.at(-1) }),
      )
    } else {
      const days = [
        e.start,
        ...(e.endDate && e.endDate !== e.start && e.endMin > 0
          ? [e.endDate]
          : []),
      ]
      days.forEach((d, i) =>
        byDay.get(d)?.push({ event: e, continuation: i > 0 }),
      )
    }
  }
  return { weeks, byDay }
}

/** Week: all-day pieces per day, and timed pieces per day with lanes. */
export function weekModel(events, date) {
  const days = weekDays(date)
  const allDay = []
  const timed = new Map(days.map((d) => [d, []]))
  for (const e of [...events].sort(compareEvents)) {
    if (e.allDay) {
      const covered = coveredDays(e, days[0], days.at(-1))
      if (covered.length)
        allDay.push({
          event: e,
          col: days.indexOf(covered[0]),
          span: covered.length,
          clippedStart: covered[0] !== e.start,
        })
      continue
    }
    const pieces =
      e.endDate && e.endDate !== e.start
        ? [
            { date: e.start, from: e.startMin, to: 1440, continuation: false },
            { date: e.endDate, from: 0, to: e.endMin, continuation: true },
          ]
        : [
            {
              date: e.start,
              from: e.startMin,
              to: e.endMin,
              continuation: false,
            },
          ]
    for (const p of pieces) timed.get(p.date)?.push({ event: e, ...p })
  }
  for (const list of timed.values()) assignLanes(list)
  return { days, allDay, timed }
}

/** "divide" packing (engine spec): overlapping pieces share the column side by side. */
function assignLanes(list) {
  list.sort((a, b) => a.from - b.from || b.to - a.to)
  let cluster = []
  let clusterEnd = -1
  const flush = () => {
    const lanes = []
    for (const p of cluster) {
      let lane = lanes.findIndex((end) => end <= p.from)
      if (lane === -1) lane = lanes.length
      lanes[lane] = p.to
      p.lane = lane
    }
    for (const p of cluster) p.lanes = lanes.length
    cluster = []
  }
  for (const p of list) {
    if (p.from >= clusterEnd && cluster.length) flush()
    cluster.push(p)
    clusterEnd = Math.max(clusterEnd, p.to)
  }
  if (cluster.length) flush()
}

export function positionOfEvent(e) {
  if (e.allDay) return { date: e.start, minute: -1 }
  return { date: e.start, minute: e.startMin }
}

export { diffDays }

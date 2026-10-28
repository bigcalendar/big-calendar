// Grid navigation machines (spec sections 3.2, 4.2, 4.3). Pure: a key and
// the current position in, an action out. No DOM, no framework.
import { addDays, addMonths, diffDays, weekday } from '../dates.js'

/** Normalizes a keyboard event to what the machines need. */
export function keyOf(e, rtl = false) {
  let key = e.key
  if (rtl && key === 'ArrowLeft') key = 'ArrowRight'
  else if (rtl && key === 'ArrowRight') key = 'ArrowLeft'
  return { key, shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey }
}

function common(k) {
  if (k.key === 'Enter') return { type: 'confirm' }
  if (k.key === ' ') return { type: 'selectOne' }
  if (k.key === 'Escape') return { type: 'clear' }
  return null
}

/** Month grid: `days` is every visible date in order; `anchor` the view's date. */
export function monthKey({ focus, days, anchor }, k) {
  const c = common(k)
  if (c) return c
  const first = days[0]
  const last = days.at(-1)
  let date = null
  let navigate = null
  switch (k.key) {
    case 'ArrowLeft':
      date = addDays(focus, -1)
      break
    case 'ArrowRight':
      date = addDays(focus, 1)
      break
    case 'ArrowUp':
      date = addDays(focus, -7)
      break
    case 'ArrowDown':
      date = addDays(focus, 7)
      break
    case 'Home':
      date = k.ctrl ? first : addDays(focus, -weekday(focus))
      break
    case 'End':
      date = k.ctrl ? last : addDays(focus, 6 - weekday(focus))
      break
    case 'PageUp':
      date = addMonths(focus, -1)
      navigate = addMonths(anchor, -1)
      break
    case 'PageDown':
      date = addMonths(focus, 1)
      navigate = addMonths(anchor, 1)
      break
    default:
      return null
  }
  // Moving past the visible range navigates and keeps the day (spec 3.2).
  if (!navigate && (date < first || date > last)) navigate = date
  return { type: 'focus', date, navigate, extend: k.shift }
}

/** All-day grid: one row of `days`. Down hops into the time body (spec 4.3). */
export function allDayKey({ focus, days }, k) {
  const c = common(k)
  if (c) return c
  const i = days.indexOf(focus)
  switch (k.key) {
    case 'ArrowLeft':
      return i > 0
        ? { type: 'focus', date: days[i - 1], extend: k.shift }
        : {
            type: 'focus',
            date: addDays(focus, -1),
            navigate: addDays(focus, -1),
            extend: k.shift,
          }
    case 'ArrowRight':
      return i < days.length - 1
        ? { type: 'focus', date: days[i + 1], extend: k.shift }
        : {
            type: 'focus',
            date: addDays(focus, 1),
            navigate: addDays(focus, 1),
            extend: k.shift,
          }
    case 'Home':
      return { type: 'focus', date: days[0], extend: k.shift }
    case 'End':
      return { type: 'focus', date: days.at(-1), extend: k.shift }
    case 'PageUp':
      return {
        type: 'focus',
        date: addDays(focus, -7),
        navigate: addDays(focus, -7),
      }
    case 'PageDown':
      return {
        type: 'focus',
        date: addDays(focus, 7),
        navigate: addDays(focus, 7),
      }
    case 'ArrowDown':
      return { type: 'hop', grid: 'time', date: focus }
    default:
      return null
  }
}

/** Time body: `slots` lists the focusable slot indexes of `focus.date`. */
export function timeKey({ focus, days, slotsOf }, k) {
  const c = common(k)
  if (c) return c
  const slots = slotsOf(focus.date)
  const i = slots.indexOf(focus.slot)
  const day = days.indexOf(focus.date)
  const sameSlotOn = (date) => nearest(slotsOf(date), focus.slot)
  switch (k.key) {
    case 'ArrowUp':
      if (i > 0)
        return {
          type: 'focus',
          date: focus.date,
          slot: slots[i - 1],
          extend: k.shift,
        }
      return k.shift ? null : { type: 'hop', grid: 'allday', date: focus.date }
    case 'ArrowDown':
      return i < slots.length - 1
        ? {
            type: 'focus',
            date: focus.date,
            slot: slots[i + 1],
            extend: k.shift,
          }
        : null
    case 'ArrowLeft':
    case 'ArrowRight': {
      const step = k.key === 'ArrowLeft' ? -1 : 1
      const target = days[day + step]
      if (target)
        return {
          type: 'focus',
          date: target,
          slot: sameSlotOn(target),
          extend: k.shift,
        }
      const date = addDays(focus.date, step)
      return {
        type: 'focus',
        date,
        slot: focus.slot,
        navigate: date,
        extend: k.shift,
      }
    }
    case 'Home':
      return k.ctrl
        ? { type: 'focus', date: days[0], slot: slotsOf(days[0])[0] }
        : { type: 'focus', date: focus.date, slot: slots[0], extend: k.shift }
    case 'End':
      return k.ctrl
        ? {
            type: 'focus',
            date: days.at(-1),
            slot: slotsOf(days.at(-1)).at(-1),
          }
        : {
            type: 'focus',
            date: focus.date,
            slot: slots.at(-1),
            extend: k.shift,
          }
    case 'PageUp':
      return {
        type: 'focus',
        date: addDays(focus.date, -7),
        slot: focus.slot,
        navigate: addDays(focus.date, -7),
      }
    case 'PageDown':
      return {
        type: 'focus',
        date: addDays(focus.date, 7),
        slot: focus.slot,
        navigate: addDays(focus.date, 7),
      }
    default:
      return null
  }
}

function nearest(list, value) {
  return list.reduce(
    (best, v) => (Math.abs(v - value) < Math.abs(best - value) ? v : best),
    list[0],
  )
}

/** The cells a selection covers. Day grids: a date range. Time grid: the same slot range on each day. */
export function selectionCells(sel) {
  if (!sel) return () => false
  const [d0, d1] = [sel.anchor.date, sel.head.date].sort()
  if (sel.grid !== 'time') return ({ date }) => date >= d0 && date <= d1
  const [s0, s1] = [sel.anchor.slot, sel.head.slot].sort((a, b) => a - b)
  return ({ date, slot }) =>
    date >= d0 && date <= d1 && slot >= s0 && slot <= s1
}

export function selectionDays(sel) {
  const [d0, d1] = [sel.anchor.date, sel.head.date].sort()
  return diffDays(d0, d1) + 1
}

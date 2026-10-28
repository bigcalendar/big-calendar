// The event group (D-51, spec section 3.3): one Tab stop, arrows move in
// chronological order, Enter/Space activate, Shift+F10 opens the menu.
export function compareEvents(a, b) {
  // D-59: earlier start, then longer duration, then id. All-day first on a day.
  if (a.start !== b.start) return a.start < b.start ? -1 : 1
  // In a repeated DST hour the second occurrence (here EST) is the later instant.
  const am = a.allDay ? -1 : a.startMin + (a.offset === 'EST' ? 60 : 0)
  const bm = b.allDay ? -1 : b.startMin + (b.offset === 'EST' ? 60 : 0)
  if (am !== bm) return am - bm
  const ad = duration(a)
  const bd = duration(b)
  if (ad !== bd) return bd - ad
  return a.id < b.id ? -1 : 1
}
function duration(e) {
  return e.allDay ? 1e9 : (e.endDate ? 1440 : 0) + e.endMin - e.startMin
}

/** `order` is the list of item ids in the group (events and "+N more" buttons). */
export function eventGroupKey({ order, focus }, k) {
  const i = order.indexOf(focus)
  switch (k.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      return i < order.length - 1 ? { type: 'focus', id: order[i + 1] } : null
    case 'ArrowUp':
    case 'ArrowLeft':
      return i > 0 ? { type: 'focus', id: order[i - 1] } : null
    case 'Home':
      return { type: 'focus', id: order[0] }
    case 'End':
      return { type: 'focus', id: order.at(-1) }
    case 'Enter':
    case ' ':
      return { type: 'activate', id: focus }
    case 'F10':
      return k.shift ? { type: 'menu', id: focus } : null
    case 'ContextMenu':
      return { type: 'menu', id: focus }
    default:
      return null
  }
}

/** Where Tab from a grid enters the event group: the first item on or after the cell. */
export function entryPoint(items, { date, minute = -1 }) {
  return (
    items.find(
      (it) => it.date > date || (it.date === date && it.minute >= minute),
    ) ?? items.at(-1)
  )
}

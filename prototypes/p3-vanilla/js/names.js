// The overridable event-name composer (D-50, spec section 2.6).
import { format, diffDays, addDays } from './dates.js'
import { messages } from './messages.js'

export function eventTime(e) {
  if (e.allDay) {
    const days = diffDays(e.start, e.end)
    return days > 1
      ? `${messages.allDay}, ${format.day(e.start)} to ${format.day(addDays(e.end, -1))}`
      : messages.allDay
  }
  if (e.endDate)
    return `${format.time(e.startMin)} ${format.weekdayLong(e.start)} to ${format.time(e.endMin)} ${format.weekdayLong(e.endDate)}`
  const zone = e.offset ? ` ${e.offset}` : ''
  return `${format.timeRange(e.startMin, e.endMin)}${zone}`
}

/**
 * `visible` is the part's visible label. The name always starts with it
 * (WCAG 2.5.3 Label in Name), so speech-input users can say what they see.
 */
export function eventName(
  e,
  { withDate = true, pending = false, invalid = null, visible = e.title } = {},
) {
  const parts = [visible, eventTime(e)]
  if (withDate && !(e.allDay && diffDays(e.start, e.end) > 1) && !e.endDate)
    parts.push(format.day(e.start))
  if (e.resources?.length) parts.push(e.resources.join(', '))
  if (e.recurring) parts.push(messages.recurring)
  if (e.tentative) parts.push(messages.tentative)
  if (e.readOnly) parts.push(messages.readOnly)
  if (pending) parts.push(messages.pending)
  if (invalid) parts.push(messages.notAllowed(invalid))
  return parts.join(', ')
}

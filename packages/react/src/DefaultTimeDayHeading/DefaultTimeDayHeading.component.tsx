import clsx from 'clsx'
import type { TimeDayHeadingProps } from '../components.type'

/**
 * Default day column heading: a clickable label that drills into the day, with
 * the `bc-today` state class. Replace via `components.time.dayHeading`.
 */
function DefaultTimeDayHeading({ label, isToday, onDrillDown }: TimeDayHeadingProps) {
  const className = clsx('bc-day-heading', isToday && 'bc-today')
  return (
    <button type="button" className={className} onClick={onDrillDown}>
      {label}
    </button>
  )
}

export default DefaultTimeDayHeading

import clsx from 'clsx'
import type { MonthDateProps } from '../../components.type'

/**
 * Default day cell: a clickable date number that drills into the day. Carries
 * the `bc-today` / `bc-off-range` state classes. Replace via
 * `components.month.dateCell`.
 */
function DefaultMonthDate({ label, isToday, isOffRange, onDrillDown }: MonthDateProps) {
  const className = clsx('bc-date-cell', isToday && 'bc-today', isOffRange && 'bc-off-range')
  return (
    <div className={className}>
      <button type="button" className="bc-date-number" onClick={onDrillDown}>
        {label}
      </button>
    </div>
  )
}

export default DefaultMonthDate

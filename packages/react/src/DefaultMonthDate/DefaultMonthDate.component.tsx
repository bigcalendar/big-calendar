import type { MonthDateProps } from '../components.type'

/**
 * Default day-cell content: a clickable date number that drills into the day.
 * The outer `bc-date-cell` wrapper (with `bc-today` / `bc-off-range` state
 * classes) is provided by `MonthView` and is not part of this component.
 * Replace the whole cell appearance via `components.month.dateCell`.
 */
function DefaultMonthDate({ label, onDrillDown }: MonthDateProps) {
  return (
    <button type="button" className="bc-date-number" onClick={onDrillDown}>
      {label}
    </button>
  )
}

export default DefaultMonthDate

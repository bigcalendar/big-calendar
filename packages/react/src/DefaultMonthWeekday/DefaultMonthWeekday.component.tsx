import type { MonthWeekdayProps } from '../components.type'

/**
 * Default weekday column heading: the full name plus an abbreviated one (the
 * stylesheet shows whichever fits the calendar's width). Replace via
 * `components.month.weekday`.
 */
function DefaultMonthWeekday({ long, short }: MonthWeekdayProps) {
  return (
    <div className="bc-weekday">
      <span className="bc-weekday-long">{long}</span>
      <span className="bc-weekday-short">{short}</span>
    </div>
  )
}

export default DefaultMonthWeekday

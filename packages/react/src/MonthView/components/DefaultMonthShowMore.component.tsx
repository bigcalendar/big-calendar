import type { MonthShowMoreProps } from '../../components.type'

/**
 * Default week overflow indicator: the localized "+N more" label. Expanding it
 * into a popover is wired by the top-layer work; replace via
 * `components.month.showMore`.
 */
function DefaultMonthShowMore({ label }: MonthShowMoreProps) {
  return <div className="bc-show-more">{label}</div>
}

export default DefaultMonthShowMore

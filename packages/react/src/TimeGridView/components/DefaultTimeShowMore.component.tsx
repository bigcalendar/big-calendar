import type { TimeShowMoreProps } from '../../components.type'

/**
 * Default all-day overflow indicator: the localized "+N more" label. Expanding
 * it into a popover is wired by the top-layer work; replace via
 * `components.time.showMore`.
 */
function DefaultTimeShowMore({ label }: TimeShowMoreProps) {
  return <div className="bc-show-more">{label}</div>
}

export default DefaultTimeShowMore

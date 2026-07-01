import type { TimeLabelProps } from '../components.type'

/** Default gutter time label: just the localized time. Replace via `components.time.timeLabel`. */
function DefaultTimeLabel({ label }: TimeLabelProps) {
  return <span className="bc-time-label">{label}</span>
}

export default DefaultTimeLabel

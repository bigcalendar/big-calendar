import type { LocalizerContract } from '@big-calendar/localizer'
import type { Accessors } from '../accessors/accessors.type'
import type { GetDrilldownView } from '../store/drilldown.function'
import type { EventId, ViewKey, VisibleRange } from './calendar.type'

/**
 * Configuration accepted by {@link createCalendarStore}. Only the localizer is
 * required; everything else has a sensible default applied during normalization.
 *
 * This is the Phase 2b surface — the parity-complete option list (§9: `step`,
 * `timeslots`, `min`/`max`, `selectable`, prop getters, …) is added by the
 * tasks that consume each option (view models, selection FSM).
 */
export interface CalendarConfig<TEvent = unknown, TResource = unknown> {
  /** Required. All date math flows through this localizer; core never touches `Date`. */
  localizer: LocalizerContract
  /** Foreground events. */
  events?: TEvent[]
  /** Background events (rendered behind foreground events; not selectable). */
  backgroundEvents?: TEvent[]
  /** Resource objects for resource-grouped views. */
  resources?: TResource[]
  /** Initial view. Defaults to `month`. */
  view?: ViewKey
  /** Initial focus date (RFC 3339/9557). Defaults to `getNow()`. */
  date?: string
  /** Accessor overrides merged over the v1-parity defaults. */
  accessors?: Partial<Accessors<TEvent, TResource>>
  /** Source of "now" as a datetime string. Defaults to the current UTC instant. */
  getNow?: () => string
  /** Number of days the agenda view spans per page. Defaults to 30. */
  length?: number
  /**
   * View a drilldown lands on by default. Defaults to `day`; pass `null` to
   * disable drilldown. Ignored when `getDrilldownView` is supplied.
   */
  drilldownView?: ViewKey | null
  /** Per-call drilldown resolver; overrides `drilldownView` when supplied. */
  getDrilldownView?: GetDrilldownView
  /** Fired after the focus date changes via `navigate`. */
  onNavigate?: (args: { date: string; view: ViewKey }) => void
  /** Fired after the view changes via `setView`. */
  onView?: (args: { view: ViewKey }) => void
  /** Fired after the selected event changes via `select`. */
  onSelect?: (args: { id: EventId | null }) => void
  /** Fired when the visible range changes (date or view change), not on init. */
  onRangeChange?: (args: { range: VisibleRange; view: ViewKey }) => void
  /**
   * Fired when a drilldown is requested. When provided, the store delegates
   * entirely to this callback (it will not change view/date itself).
   */
  onDrillDown?: (args: { date: string; view: ViewKey }) => void
}

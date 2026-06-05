import type { LocalizerContract } from '@big-calendar/localizer'
import type { Accessors } from '../accessors/accessors.type'
import type { DayLayoutAlgorithm, DayLayoutAlgorithmKey } from '../layout/layout.type'
import type { SelectableMode, SlotSelectionDates } from '../selection/selection.type'
import type { GetDrilldownView } from '../store/drilldown.function'
import type { EventId, ViewKey, VisibleRange } from './calendar.type'

/**
 * Configuration accepted by {@link createCalendarStore}. Only the localizer is
 * required; everything else has a sensible default applied during normalization.
 *
 * Optional fields are typed `?: T | undefined` so framework adapters can pass
 * through possibly-undefined props directly under `exactOptionalPropertyTypes`.
 *
 * Prop-getter callbacks remain an adapter concern and are not part of this
 * (framework-agnostic) config.
 */
export interface CalendarConfig<TEvent = unknown, TResource = unknown> {
  /** Required. All date math flows through this localizer; core never touches `Date`. */
  localizer: LocalizerContract
  /** Foreground events. */
  events?: TEvent[] | undefined
  /** Background events (rendered behind foreground events; not selectable). */
  backgroundEvents?: TEvent[] | undefined
  /** Resource objects for resource-grouped views. */
  resources?: TResource[] | undefined
  /** Initial view. Defaults to `month`. */
  view?: ViewKey | undefined
  /** Initial focus date (RFC 3339/9557). Defaults to `getNow()`. */
  date?: string | undefined
  /** Accessor overrides merged over the v1-parity defaults. */
  accessors?: Partial<Accessors<TEvent, TResource>> | undefined
  /** Source of "now" as a datetime string. Defaults to the current UTC instant. */
  getNow?: (() => string) | undefined
  /** Number of days the agenda view spans per page. Defaults to 30. */
  length?: number | undefined

  // --- time-grid controls (day / week / work_week) ---
  /** Slot size in minutes. Defaults to 30. */
  step?: number | undefined
  /** Slots per labelled group. Defaults to 2. */
  timeslots?: number | undefined
  /**
   * Start of the visible time window as a datetime string; only its
   * time-of-day is used. Defaults to midnight (start of day).
   */
  min?: string | undefined
  /**
   * End of the visible time window as a datetime string; only its time-of-day
   * is used. A midnight (`00:00`) time means end-of-day. Defaults to end of day.
   */
  max?: string | undefined
  /** Day-layout algorithm for overlapping timed events: a built-in key or a custom fn. Defaults to `overlap`. */
  dayLayoutAlgorithm?: DayLayoutAlgorithmKey | DayLayoutAlgorithm | undefined
  /** Max rows in the all-day header before events overflow. Defaults to unlimited. */
  allDayMaxRows?: number | undefined
  /** Max event rows per week in the month grid before events overflow into "+N more". Defaults to unlimited. */
  weekEventLimit?: number | undefined
  /** Render multi-day events in the time columns rather than the all-day header. Defaults to false. */
  showMultiDayTimes?: boolean | undefined
  /** Show every all-day event (ignore `allDayMaxRows`). Defaults to false. */
  showAllEvents?: boolean | undefined
  /** Whether slot selection is enabled (`true`/`false`/`'ignoreEvents'`). Defaults to false. */
  selectable?: SelectableMode | undefined
  /**
   * View a drilldown lands on by default. Defaults to `day`; pass `null` to
   * disable drilldown. Ignored when `getDrilldownView` is supplied.
   */
  drilldownView?: ViewKey | null | undefined
  /** Per-call drilldown resolver; overrides `drilldownView` when supplied. */
  getDrilldownView?: GetDrilldownView | undefined
  /** Fired after the focus date changes via `navigate`. */
  onNavigate?: ((args: { date: string; view: ViewKey }) => void) | undefined
  /** Fired after the view changes via `setView`. */
  onView?: ((args: { view: ViewKey }) => void) | undefined
  /** Fired after the selected event changes via `select`. */
  onSelect?: ((args: { id: EventId | null }) => void) | undefined
  /**
   * Fired on every slot-selection range change (drag move / keyboard extend),
   * with the candidate range as ISO date strings (`allDay` flags a whole-day /
   * cross-day span). Return `false` to **veto** the change. The store translates
   * the FSM's slot indices to dates before calling.
   */
  onSelecting?:
    | ((args: { start: string; end: string; allDay: boolean }) => boolean | void)
    | undefined
  /**
   * Fired when a slot selection is committed (drag end / click / double-click /
   * keyboard). Receives ISO date strings; see {@link SlotSelectionDates} for the
   * `end` convention (exclusive slot end for time, end-of-day for day).
   */
  onSelectSlot?: ((selection: SlotSelectionDates) => void) | undefined
  /** Fired when the visible range changes (date or view change), not on init. */
  onRangeChange?: ((args: { range: VisibleRange; view: ViewKey }) => void) | undefined
  /**
   * Fired when a drilldown is requested. When provided, the store delegates
   * entirely to this callback (it will not change view/date itself).
   */
  onDrillDown?: ((args: { date: string; view: ViewKey }) => void) | undefined
}

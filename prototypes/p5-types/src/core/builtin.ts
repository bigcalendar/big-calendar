// The features core ships: the four families, slot selection, drag and drop, resources and sources.
import type { Feature, FeatureMap, Has } from './features.ts'
import type { DataInput } from './collections.ts'
import type { DateRange, EventSource, Resizable, Resource } from './data.ts'
import type {
  ChangeHandler,
  DragOutResult,
  ExternalItem,
  MoveChange,
  ResizeChange,
} from './edit.ts'
import type {
  DateString,
  DurationString,
  ResourceId,
  SourceId,
  Weekday,
} from './values.ts'

/** A wall-clock time of day, `HH:MM`. `24:00` is allowed as a `max`. */
export type TimeString = string

/** Packing for time-grid lanes (engine). A custom function is specified with the S2 view model. */
export type TimeGridPacking = 'overlap' | 'no-overlap'

// Families ------------------------------------------------------------------------------------

export interface DayGridOptions {
  /** Event rows per week before "+N more". `'auto'` fits the row height. Default `'auto'`. */
  maxRows?: number | 'auto'
  /** "+N more" opens a popover (default) or moves to that day's view (RBC `popup={false}`). */
  overflow?: 'popover' | 'drilldown'
}
export type DayGridFeature = Feature<{
  name: 'dayGrid'
  optionsKey: 'dayGrid'
  options: DayGridOptions
  state: {}
  api: {}
  flat: never
  required: never
  requires: []
}>
export declare const dayGrid: DayGridFeature

export interface TimeGridOptions {
  /** Slot length. Default `PT30M`. */
  step?: DurationString
  /** Slots per labelled group. Default 2. */
  timeslots?: number
  /** The visible window (T-14). Default `00:00` to `24:00`. */
  min?: TimeString
  max?: TimeString
  /** Where the body scrolls to on first render. Default: the current time on today's view, else `min`. */
  scrollToTime?: TimeString
  /** T-7: multi-day timed events stay in the grid (default) or move to the all-day row. */
  multiDayTimedEvents?: 'grid' | 'allDayRow'
  packing?: TimeGridPacking
}
export type TimeGridFeature = Feature<{
  name: 'timeGrid'
  optionsKey: 'timeGrid'
  options: TimeGridOptions
  state: {}
  api: {}
  flat: never
  required: never
  requires: []
}>
export declare const timeGrid: TimeGridFeature

export interface TimelineOptions {
  step?: DurationString
  min?: TimeString
  max?: TimeString
  /** What each row is (engine). `'resources'` needs the resources feature. Default `'resources'` when registered, else `'days'`. */
  lanes?: 'resources' | 'days' | 'resourcesByDay'
}
export type TimelineFeature = Feature<{
  name: 'timeline'
  optionsKey: 'timeline'
  options: TimelineOptions
  state: {}
  api: {}
  flat: never
  required: never
  requires: []
}>
export declare const timeline: TimelineFeature

export interface AgendaOptions {
  /** Days shown (RBC `length`). Default 30. */
  length?: number
}
export type AgendaFeature = Feature<{
  name: 'agenda'
  optionsKey: 'agenda'
  options: AgendaOptions
  state: {}
  api: {}
  flat: never
  required: never
  requires: []
}>
export declare const agenda: AgendaFeature

type GridFamily = 'dayGrid' | 'timeGrid' | 'timeline'

// Behavior features ---------------------------------------------------------------------------

/** A selected range of slots, in the display zone (T-11), with its lane. */
export interface SlotSelection {
  start: string
  end: string
  allDay: boolean
  resourceId: ResourceId | undefined
}
export interface SlotSelectionOptions {
  /** Touch long-press before a selection starts, in ms. Default 400 (P4). */
  longPressDelay?: number
}
export type SlotSelectionFeature = Feature<{
  name: 'slotSelection'
  optionsKey: 'slotSelection'
  options: SlotSelectionOptions
  state: { selection: SlotSelection | null }
  api: { clearSelection(): void }
  flat: never
  required: never
  requires: [
    {
      anyOf: GridFamily
      message: 'slotSelection needs a grid family: dayGrid, timeGrid or timeline'
    },
  ]
}>
export declare const slotSelection: SlotSelectionFeature

export interface DndOptions {
  /** The calendar level of the permission cascade (D-83). Default `true`. */
  draggable?: boolean
  /** Default `true`. */
  resizable?: Resizable
  /** Drop granularity, separate from slot size (gap #2). Default: the slot `step`. */
  snap?: DurationString
  /** Scroll near the edges while dragging. Default `true` (RBC `enableAutoScroll`). */
  autoScroll?: boolean
  /**
   * Turns a native drag from outside into an item, or `false` to refuse it. Events dragged out of
   * another Big Calendar are recognized without it (`EVENT_MIME_TYPE`). Omitted: only those are accepted.
   */
  acceptExternal?: (data: DataTransfer) => ExternalItem | false
  /** Allow dragging events out of the calendar (D-36). Default `true`. */
  dragOut?: boolean
}
export type DndFeature = Feature<{
  name: 'dnd'
  optionsKey: 'dnd'
  options: DndOptions
  state: {}
  api: {}
  flat: 'onEventMove' | 'onEventResize' | 'onEventDragOut'
  required: never
  requires: [
    {
      anyOf: GridFamily
      message: 'dnd needs a grid family: dayGrid, timeGrid or timeline'
    },
  ]
}>
export declare const dnd: DndFeature

export interface ResourceOptions {
  /** Time grid only: resources outside, days inside (default), or the reverse. */
  layout?: 'resourceMajor' | 'dayMajor'
  /** The Unassigned lane (D-38). Default `false`. */
  unassignedLane?: boolean | { title: string }
}
export type ResourcesFeature = Feature<{
  name: 'resources'
  optionsKey: 'resourceOptions'
  options: ResourceOptions
  state: {
    /** `'all'` (default) also shows resources added later. */
    visibleResources: readonly ResourceId[] | 'all'
    collapsedResources: readonly ResourceId[]
  }
  api: {
    /** Events matching no lane while the Unassigned lane is off (D-38). */
    readonly hiddenEventCount: { get(): number }
  }
  flat: 'resources'
  required: never
  requires: [
    {
      anyOf: 'timeGrid' | 'timeline'
      message: 'resources needs timeGrid or timeline'
    },
  ]
}>
export declare const resources: ResourcesFeature

export type SourcesFeature = Feature<{
  name: 'sources'
  optionsKey: 'sourceOptions'
  options: never
  state: { visibleSources: readonly SourceId[] | 'all' }
  api: {}
  flat: 'sources'
  required: never
  requires: []
}>
export declare const sources: SourcesFeature

declare module './features.ts' {
  interface FeatureRegistry {
    dayGrid: DayGridFeature
    timeGrid: TimeGridFeature
    timeline: TimelineFeature
    agenda: AgendaFeature
    slotSelection: SlotSelectionFeature
    dnd: DndFeature
    resources: ResourcesFeature
    sources: SourcesFeature
  }
  interface FlatPropRegistry<TEventMeta, TResourceMeta> {
    resources: DataInput<Resource<TResourceMeta>, ResourceId>
    sources: DataInput<EventSource, SourceId>
    onEventMove: ChangeHandler<MoveChange<TEventMeta>, TEventMeta>
    onEventResize: ChangeHandler<ResizeChange<TEventMeta>, TEventMeta>
    onEventDragOut: (result: DragOutResult<TEventMeta>) => void
  }
}

// Views ---------------------------------------------------------------------------------------

/** Context a custom view's functions receive. */
export interface ViewContext {
  weekStartsOn: Weekday
  locale: Intl.Locale
  hiddenDays: readonly Weekday[]
}

export interface ViewDefinition<Family extends string = string> {
  readonly family: Family
  /** The view switcher's label. Default views use `messages` (`monthView`, …); others need one. */
  readonly label: string | undefined
}

/** The month view and other day-grid shapes, such as two weeks. */
export declare function dayGridView(config?: {
  label?: string
  weeks?: 'month' | number
}): ViewDefinition<'dayGrid'>
/** Day, week, work week and N-day views. `hiddenDays` here adds to the calendar's. */
export declare function timeGridView(config: {
  label?: string
  days: number | 'week'
  hiddenDays?: readonly Weekday[]
}): ViewDefinition<'timeGrid'>
export declare function timelineView(config: {
  label?: string
  days: number | 'week' | 'month'
}): ViewDefinition<'timeline'>
export declare function agendaView(config?: {
  label?: string
  length?: number
}): ViewDefinition<'agenda'>
/** A fully custom view (D-66). The component that draws it is given in the binding (part 3). */
export declare function customView(config: {
  label?: string
  range(date: DateString, context: ViewContext): DateRange
  /** Where "previous" and "next" go from `date`. */
  navigate(
    date: DateString,
    direction: 'previous' | 'next',
    context: ViewContext,
  ): DateString
  /** The toolbar label. */
  title(date: DateString, context: ViewContext): string
}): ViewDefinition<'custom'>

export type ViewMap<F extends FeatureMap> = Record<
  string,
  ViewDefinition<Extract<F[keyof F]['name'], string> | 'custom'>
>

/** Views you get when `views` is omitted: RBC's defaults for the registered families. */
export type DefaultViews<F extends FeatureMap> = (Has<F, 'dayGrid'> extends true
  ? { month: ViewDefinition<'dayGrid'> }
  : {}) &
  (Has<F, 'timeGrid'> extends true
    ? { week: ViewDefinition<'timeGrid'>; day: ViewDefinition<'timeGrid'> }
    : {}) &
  (Has<F, 'agenda'> extends true ? { agenda: ViewDefinition<'agenda'> } : {}) &
  (Has<F, 'timeline'> extends true
    ? { timeline: ViewDefinition<'timeline'> }
    : {})

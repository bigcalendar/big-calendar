// The prebuilt UI's prop types. `<Calendar>` itself lands with S1 (D-97).
import type { ComponentType, CSSProperties, ReactNode } from 'react'
import type {
  CalendarOptions,
  DateRange,
  DateString,
  DefaultViews,
  FeatureMap,
  ProcessedEvent,
  ViewDefinition,
  PartName,
  ReactProps,
  SegmentRef,
} from '@big-calendar/react'

/**
 * A `render` slot replaces the element: spread `props` onto what you render (a dev check warns when
 * the role or handlers are missing). A `wrap` slot decorates an element the library owns.
 */
export type Slot<Data> =
  | {
      render: (
        args: Data & { props: ReactProps; children: ReactNode },
      ) => ReactNode
      wrap?: never
    }
  | {
      wrap: (args: Data & { children: ReactNode }) => ReactNode
      render?: never
    }

/** What each slot receives besides `props` or `children`. Parts not listed get `{}`; families widen these in their slice specs. */
/** Every slot also gets the view it's in, so one slot can differ per view (RBC's per-view `components`). */
interface InView {
  view: string
  family: 'dayGrid' | 'timeGrid' | 'timeline' | 'agenda' | 'custom'
}
/** The data each slot receives besides `props` or `children`, per part (api.md section 3.3). */
export interface SlotData<TEventMeta> {
  event: { event: ProcessedEvent<TEventMeta>; segment: SegmentRef }
  eventContent: { event: ProcessedEvent<TEventMeta>; segment: SegmentRef }
  backgroundEvent: { event: ProcessedEvent<TEventMeta> }
  dayCell: { date: DateString }
  dayColumn: { date: DateString }
  dayHeader: { date: DateString }
  agendaDay: { date: DateString }
  toolbar: { title: string }
}
/** The `slots` prop: at most one slot per part, keyed by part name (D-14). */
export type Slots<TEventMeta = unknown> = {
  readonly [P in PartName]?: Slot<
    InView &
      (P extends keyof SlotData<TEventMeta> ? SlotData<TEventMeta>[P] : {})
  >
}

/** What a custom view's component receives (D-66): its range's events and occurrences, in the display zone. */
export interface CustomViewProps<TEventMeta> {
  range: DateRange
  events: readonly ProcessedEvent<TEventMeta>[]
}

type CustomViewNames<V> = {
  [K in keyof V]: V[K] extends ViewDefinition<'custom'> ? K : never
}[keyof V]
/** One component per custom view, required for each. */
type CustomViewComponents<V, EM> = [CustomViewNames<V>] extends [never]
  ? {}
  : {
      viewComponents: {
        [K in CustomViewNames<V> & string]: ComponentType<CustomViewProps<EM>>
      }
    }

/** The props `<Calendar>` adds to the calendar options. */
export interface CalendarUiProps<TEventMeta> {
  slots?: Slots<TEventMeta>
  className?: string
  style?: CSSProperties
  /**
   * Gap #16. `container` fills a parent with a fixed height (default); `content` grows to fit;
   * `page` grows and keeps headers sticky inside the page's scroll.
   */
  sizing?: 'container' | 'content' | 'page'
}

/**
 * `<Calendar>`'s props: every `createCalendar` option, the prebuilt UI's own props, and
 * `viewComponents`, required exactly when `views` has a custom view (D-66, api.md section 3.3).
 */
export type CalendarProps<
  F extends FeatureMap,
  V extends Record<string, ViewDefinition> = DefaultViews<F>,
  TEventMeta = unknown,
  TResourceMeta = unknown,
> = CalendarOptions<F, V, TEventMeta, TResourceMeta> &
  CustomViewComponents<V, TEventMeta> &
  CalendarUiProps<TEventMeta>

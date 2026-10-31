// @big-calendar/react-ui: markup and composition only.
import type { ComponentType, CSSProperties, ReactNode } from 'react'
import type {
  CalendarOptions,
  DateRange,
  DateString,
  DefaultViews,
  FeatureMap,
  ProcessedEvent,
  ViewDefinition,
} from '../core/index.ts'
import type { PartName, SegmentRef } from '../interactions/index.ts'
import type { ReactProps } from '../react/index.ts'

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
 * The drop-in calendar. Waits for `temporalReady` inside its own `<Suspense>`, showing the `loading`
 * part, and catches a failed polyfill load in its own error boundary, showing the `error` part (D-87, gap #17).
 */
export declare function Calendar<
  const F extends FeatureMap,
  const V extends Record<string, ViewDefinition<string>> = DefaultViews<F>,
  TEventMeta = unknown,
  TResourceMeta = unknown,
>(
  props: CalendarOptions<F, V, TEventMeta, TResourceMeta> &
    CustomViewComponents<V, TEventMeta> &
    CalendarUiProps<TEventMeta>,
): ReactNode

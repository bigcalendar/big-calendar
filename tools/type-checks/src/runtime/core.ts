// Stand-ins for the @big-calendar/core runtime the slices haven't written yet, typed against the
// real package (D-99). Remove each one when its slice implements it.
import type {
  AgendaFeature,
  Atom,
  CalendarEvent,
  CalendarFeatures,
  CalendarInstance,
  CalendarOptions,
  CheckFeatures,
  DateRange,
  DateString,
  DayGridFeature,
  DefaultViews,
  DndFeature,
  EventCollection,
  EventSource,
  FeatureMap,
  Resource,
  ResourceCollection,
  ResourcesFeature,
  SlotSelectionFeature,
  SourceCollection,
  SourcesFeature,
  TimeGridFeature,
  TimelineFeature,
  UntrustedHtml,
  ViewContext,
  ViewDefinition,
  Weekday,
} from '@big-calendar/core'

export * from '@big-calendar/core'

/** Marks a raw string as untrusted HTML. */
export declare function untrustedHtml(raw: string): UntrustedHtml

/** The explicit step: returns the raw, unsanitized string for the app to sanitize. */
export declare function readUntrustedHtml(value: UntrustedHtml): string

/** Creates an atom to bind a state slice to (`atoms` option). */
export declare function createAtom<T>(initial: T): Atom<T>

export declare function createEventCollection<TMeta = unknown>(
  rows?: Iterable<CalendarEvent<TMeta>>,
): EventCollection<TMeta>

export declare function createResourceCollection<TMeta = unknown>(
  rows?: Iterable<Resource<TMeta>>,
): ResourceCollection<TMeta>

export declare function createSourceCollection<TMeta = unknown>(
  rows?: Iterable<EventSource<TMeta>>,
): SourceCollection<TMeta>

/** `calendarFeatures({ dayGrid, timeGrid, dnd })`. Prerequisites are checked here, at compile time. */
export declare function calendarFeatures<const F extends FeatureMap>(
  features: F & CheckFeatures<F>,
): CalendarFeatures<F>

export declare const dayGrid: DayGridFeature

export declare const timeGrid: TimeGridFeature

export declare const timeline: TimelineFeature

export declare const agenda: AgendaFeature

export declare const slotSelection: SlotSelectionFeature

export declare const dnd: DndFeature

export declare const resources: ResourcesFeature

export declare const sources: SourcesFeature

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

/**
 * Throws a teaching dev error if called before `temporalReady` resolves (D-87).
 * `views` falls back to `DefaultViews<F>`.
 */
export declare function createCalendar<
  const F extends FeatureMap,
  const V extends Record<string, ViewDefinition<string>> = DefaultViews<F>,
  TEventMeta = unknown,
  TResourceMeta = unknown,
>(
  options: CalendarOptions<F, V, TEventMeta, TResourceMeta>,
): CalendarInstance<F, V, TEventMeta, TResourceMeta>

/** Month, week, day and agenda (D-62): the tutorial's starting point. */
export declare const standardFeatures: CalendarFeatures<{
  dayGrid: DayGridFeature
  timeGrid: TimeGridFeature
  agenda: AgendaFeature
}>

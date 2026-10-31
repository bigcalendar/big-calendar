// createCalendar: options (D-61), state slices (D-53), the instance (D-54, D-55).
import type { DefaultViews, ViewDefinition, ViewMap } from './builtin.ts'
import type {
  CalendarEvent,
  BackgroundEvent,
  DateRange,
  EventSource,
  ProcessedEvent,
  Resource,
} from './data.ts'
import type { DataInput } from './collections.ts'
import type {
  CalendarFeatures,
  FeatureApi,
  FeatureMap,
  FeatureOptions,
  FeatureState,
  Has,
  KnownSlices,
  SliceValue,
  StateKeys,
  UnregisteredOptions,
} from './features.ts'
import type { Atom, ReadonlySignal } from './signals.ts'
import type {
  DateString,
  DurationString,
  EventId,
  ResourceId,
  SourceId,
  TimeZoneName,
  Weekday,
} from './values.ts'

/** `Intl` calendar ids tested at 1.0 (D-77); any other `Intl` id is accepted, untested. */
export type CalendarSystem =
  | 'gregory'
  | 'islamic-umalqura'
  | 'hebrew'
  | 'persian'
  | 'japanese'
  | (string & {})

/** Something wrong with one record. It's skipped, never thrown (data model). */
export interface DataIssue {
  code:
    | 'missing-field'
    | 'invalid-value'
    | 'mixed-value-types'
    | 'end-before-start'
    | 'duplicate-id'
    | 'unknown-time-zone'
    | 'unknown-resource'
    | 'unknown-source'
    | 'needs-feature'
  collection: 'events' | 'backgroundEvents' | 'resources' | 'sources'
  id: EventId | ResourceId | SourceId | undefined
  field: string | undefined
  /** The teaching dev message, with a docs link. */
  message: string
}

/** Injectable time source (gap #5). `@big-calendar/testing` ships a fake one. */
export interface Clock {
  /** Epoch milliseconds. */
  now(): number
  setTimeout(callback: () => void, ms: number): unknown
  clearTimeout(handle: unknown): void
}

/** Visible range, as `onRangeChange` reports it: dates in the display zone, and the exact instants. */
export interface VisibleRange extends DateRange {
  /** `start` at the display zone's start of day, as an ISO instant with `Z`. */
  startInstant: string
  endInstant: string
  timeZone: TimeZoneName
}

/** Core state slices; features add theirs. */
export interface CoreState<TView extends string> {
  /** The anchor date the view is built around. */
  date: DateString
  view: TView
  selectedEventId: EventId | null
}

/** Props for one slice (D-53): `defaultX`, `x` and `onXChange`. When unregistered, `T` names the feature and the callback can't be assigned either. */
type SliceProps<K extends string, T, Unregistered extends boolean = false> = {
  [P in K as `default${Capitalize<K>}`]?: T
} & { [P in K]?: T } & {
  [P in K as `on${Capitalize<K>}Change`]?: Unregistered extends true
    ? T
    : (value: T) => void
}
type UnionToIntersectionOf<U> = (
  U extends unknown ? (x: U) => void : never
) extends (x: infer I) => void
  ? I
  : never

/**
 * Keys come from core and every installed feature, never from `F`, so TypeScript can contextually
 * type `onSelectionChange` while it infers `F`. Values depend on `F`.
 */
type StateProps<F extends FeatureMap, V> = SliceProps<'date', DateString> &
  SliceProps<'view', NoInfer<keyof V & string>> &
  SliceProps<'selectedEventId', EventId | null> &
  UnionToIntersectionOf<
    {
      [K in keyof KnownSlices]: SliceProps<
        K & string,
        SliceValue<F, K>,
        K extends StateKeys<F> ? false : true
      >
    }[keyof KnownSlices]
  > & {
    /** External atoms the calendar reads and writes directly. They win over `x` and `defaultX` (D-53). */
    atoms?: { [K in keyof CalendarState<F, V>]?: Atom<CalendarState<F, V>[K]> }
  }

export type CalendarState<F extends FeatureMap, V> = CoreState<
  keyof V & string
> &
  FeatureState<F>

export interface CoreOptions<TEventMeta> {
  /** The only required input. */
  events: DataInput<CalendarEvent<TEventMeta>, EventId>
  backgroundEvents?: DataInput<BackgroundEvent<TEventMeta>, EventId>
  /** Display zone. Default: the browser's (T-4). */
  timeZone?: TimeZoneName
  /** BCP 47 tag or `Intl.Locale`. Default: the browser's (D-40). */
  locale?: string | Intl.Locale
  /** Default Gregorian (D-82). */
  calendarSystem?: CalendarSystem
  /** Sets `dir` on the root; omitted, it's inherited (D-35). */
  dir?: 'ltr' | 'rtl' | 'auto'
  /** Default: the locale's (D-40). */
  weekStartsOn?: Weekday
  hourCycle?: 'h12' | 'h23'
  /** Replaces `showWeekends` (D-75). */
  hiddenDays?: readonly Weekday[]
  showWeekNumbers?: boolean
  /** The calendar level of the `readOnly` cascade (D-83). */
  readOnly?: boolean
  /** T-9: the length of a date-time event with no `end`. Default `PT1H`. */
  defaultEventDuration?: DurationString
  /** Custom ordering (gap #3). Ties still break by D-59. */
  eventOrder?: (
    a: ProcessedEvent<TEventMeta>,
    b: ProcessedEvent<TEventMeta>,
  ) => number
  clock?: Clock
  onDataIssue?: (issue: DataIssue) => void
  /** The loading hook (D-27). */
  onRangeChange?: (range: VisibleRange) => void
}

type ResourceInputs<F extends FeatureMap, TResourceMeta> =
  Has<F, 'resources'> extends true
    ? { resources?: DataInput<Resource<TResourceMeta>, ResourceId> }
    : {}
type SourceInputs<F extends FeatureMap> =
  Has<F, 'sources'> extends true
    ? { sources?: DataInput<EventSource, SourceId> }
    : {}

export type CalendarOptions<
  F extends FeatureMap,
  V,
  TEventMeta,
  TResourceMeta,
> = CoreOptions<TEventMeta> & {
  features: CalendarFeatures<F>
  /** Default: `DefaultViews` for the registered families. */
  views?: V & ViewMap<F>
} & StateProps<F, V> &
  ResourceInputs<F, TResourceMeta> &
  SourceInputs<F> &
  FeatureOptions<F> &
  UnregisteredOptions<F>

/** The granular API (edit model). With a collection it writes into the collection (D-58). */
export interface EventsApi<TEventMeta> {
  get(id: EventId): ProcessedEvent<TEventMeta> | undefined
  upsert(event: CalendarEvent<TEventMeta>): void
  patch(
    id: EventId,
    fields: Partial<Omit<CalendarEvent<TEventMeta>, 'id'>>,
  ): void
  remove(id: EventId): void
}

/** Specified in part 2. */
export interface Draft {}
/** Specified in part 2. */
export interface PendingChange {}

export type CalendarInstance<
  F extends FeatureMap,
  V,
  TEventMeta,
  TResourceMeta,
> = {
  /** Every slice as a read-only signal. Change state through actions only. */
  readonly state: {
    readonly [K in keyof CalendarState<F, V>]: ReadonlySignal<
      CalendarState<F, V>[K]
    >
  } & {
    readonly drafts: ReadonlySignal<readonly Draft[]>
    readonly pending: ReadonlySignal<readonly PendingChange[]>
  }
  readonly range: ReadonlySignal<VisibleRange>
  /** The toolbar's date label, already formatted. */
  readonly title: ReadonlySignal<string>
  readonly events: EventsApi<TEventMeta>
  /** Bindings call this on every render with the latest options (D-55). */
  setOptions(options: CalendarOptions<F, V, TEventMeta, TResourceMeta>): void
  navigate(direction: 'previous' | 'next' | 'today'): void
  goToDate(date: DateString): void
  setView(view: NoInfer<keyof V & string>): void
  selectEvent(id: EventId | null): void
  /** For bindings (reactivity). */
  subscribe<T>(
    selector: (state: CalendarState<F, V>) => T,
    listener: (value: T) => void,
  ): () => void
  getSnapshot(): CalendarState<F, V>
  destroy(): void
} & FeatureApi<F>

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

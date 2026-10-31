// @big-calendar/react: the binding (≤ ~600 lines, no behavior).
import type { HTMLAttributes, ReactNode, Ref } from 'react'
import type {
  CalendarInstance,
  CalendarOptions,
  CalendarState,
  DefaultViews,
  FeatureMap,
  ReadonlySignal,
  ViewDefinition,
} from '../core/index.ts'
import type { CalendarGetters, PropDescriptor } from '../interactions/index.ts'

/** A descriptor mapped to React: `class` → `className`, `tabindex` → `tabIndex`, `keydown` → `onKeyDown`, `style` vars kept as custom properties. */
export type ReactProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>
  [data: `data-${string}`]: string | undefined
}

/** The binding's `normalize` (headless API). Handlers get the native event (`event.nativeEvent`). */
export declare function normalize(descriptor: PropDescriptor): ReactProps

/**
 * Creates the calendar once, passes the latest options to `setOptions` on every render (D-55) and
 * destroys it on unmount. Before that it calls `use(temporalReady)`: React reads the promise's
 * `status`, which `@big-calendar/temporal` sets to `'fulfilled'` up front when Temporal is native,
 * so only the polyfill path suspends (D-87). Headless users need a `<Suspense>` boundary above it.
 */
export declare function useCalendar<
  const F extends FeatureMap,
  const V extends Record<string, ViewDefinition<string>> = DefaultViews<F>,
  TEventMeta = unknown,
  TResourceMeta = unknown,
>(
  options: CalendarOptions<F, V, TEventMeta, TResourceMeta>,
): CalendarInstance<F, V, TEventMeta, TResourceMeta>

/** Subscribes to one value derived from state; re-renders only when it changes (`useSyncExternalStore`). */
export declare function useCalendarState<F extends FeatureMap, V, EM, RM, T>(
  calendar: CalendarInstance<F, V, EM, RM>,
  selector: (state: CalendarState<F, V>) => T,
): T

/** Reads any facade signal, such as a lane's segments or `calendar.title`. */
export declare function useSignalValue<T>(signal: ReadonlySignal<T>): T

/** `connectCalendar` with every getter normalized for React. Families add `useDayGrid` and so on (slice specs). */
export declare function useCalendarGetters<F extends FeatureMap, V, EM, RM>(
  calendar: CalendarInstance<F, V, EM, RM>,
): {
  [K in keyof CalendarGetters]: (
    ...args: Parameters<CalendarGetters[K]>
  ) => ReactProps
}

export declare function CalendarProvider(props: {
  calendar: CalendarInstance<FeatureMap, unknown, unknown, unknown>
  children?: ReactNode
}): ReactNode

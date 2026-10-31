// Prop-getter descriptors (D-72) and the one shared merge.
import type { CalendarInstance, Draft, FeatureMap } from '../core/index.ts'

/** HTML attribute names and values: `class`, `role`, `tabindex`, `aria-*`, `data-*`, `id`, `hidden`, `inert`, `draggable`. */
export type AttrValue = string | number | boolean | undefined

/**
 * A framework-neutral description of an element's props. Each binding's `normalize` maps it to its
 * framework (React: `class` → `className`, `tabindex` → `tabIndex`, `keydown` → `onKeyDown`).
 */
export interface PropDescriptor {
  /** Always includes the part's `bc-*` class (D-72). `false` and `undefined` mean "absent". */
  readonly attrs: { readonly [name: string]: AttrValue }
  /** Geometry as inline custom properties (styling contract), set through the CSSOM (gap #15). */
  readonly style?: { readonly [name: `--bc-${string}`]: string | number }
  /** DOM event names; handlers receive the native event. */
  readonly on: {
    readonly [K in keyof HTMLElementEventMap]?: (
      event: HTMLElementEventMap[K],
    ) => void
  }
  readonly ref?: (element: HTMLElement | null) => void
}

/**
 * Merges descriptors left to right (D-72):
 * - `class` and the id-list ARIA attributes (`aria-describedby`, `aria-labelledby`, `aria-controls`,
 *   `aria-owns`) are joined with spaces, without duplicates;
 * - `data-*` attributes are combined: the same name from two sources becomes a space-separated token
 *   list (`data-state="selected pending"`, styled with `~=`);
 * - `style` variables and other attributes must not conflict: a different value is a dev-time error;
 * - handlers are chained in order; refs are all called.
 */
export declare function mergeProps(
  ...descriptors: readonly PropDescriptor[]
): PropDescriptor

/** Every getter takes one object argument (D-46) and returns a descriptor. */
export type PropGetter<Args extends object | void = void> = Args extends object
  ? (args: Args) => PropDescriptor
  : () => PropDescriptor

/** A segment of an event in a family's view model; its full shape is in each family's slice spec. */
export interface SegmentRef {
  readonly key: string
}

/** Getters shared by every family. Each family's `connect<Family>` adds its own (slice specs). */
export interface CalendarGetters {
  getRootProps: PropGetter
  /** The polite and assertive live regions the runtime announces into. */
  getLiveRegionProps: PropGetter<{ politeness: 'polite' | 'assertive' }>
  getEventProps: PropGetter<{ segment: SegmentRef }>
  /** Present when `dnd` is registered; `edge` is the resizable side. */
  getResizeHandleProps: PropGetter<{
    segment: SegmentRef
    edge: 'start' | 'end'
  }>
  /** The preview drawn for a draft; `aria-hidden` (D-50). */
  getDraftProps: PropGetter<{ draft: Draft }>
}

/** Starts the machines for a calendar and returns its getters. `destroy` stops timers and listeners. */
export declare function connectCalendar<F extends FeatureMap, V, EM, RM>(
  calendar: CalendarInstance<F, V, EM, RM>,
): CalendarGetters & { destroy(): void }

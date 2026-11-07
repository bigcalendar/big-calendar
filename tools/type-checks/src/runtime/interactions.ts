// Stand-ins for the @big-calendar/interactions runtime the slices haven't written yet, typed against the
// real package (D-99). Remove each one when its slice implements it.
import type { CalendarInstance, FeatureMap } from '@big-calendar/core'
import type {
  CalendarGetters,
  MachineDefinition,
  MachineEvent,
  MachineState,
  PropDescriptor,
  TransitionResult,
  TransitionTable,
} from '@big-calendar/interactions'

export * from '@big-calendar/interactions'

export declare function defineMachine<
  S extends MachineState,
  E extends MachineEvent,
  C,
>(definition: MachineDefinition<S, E, C>): MachineDefinition<S, E, C>

/** Pure: looks the handler up and runs it, or returns the state unchanged with no effects. */
export declare function transition<
  S extends MachineState,
  E extends MachineEvent,
  C,
>(
  machine: MachineDefinition<S, E, C>,
  state: S,
  event: E,
  ctx: C,
): TransitionResult<S>

/**
 * How a registered feature adds states and events (D-90 registration table). It may add new modes
 * and new event types; handling a (mode, event) pair the base or an earlier feature already handles
 * is a dev-time error, like a non-mergeable attribute conflict (D-72).
 */
export declare function extendMachine<
  S extends MachineState,
  E extends MachineEvent,
  C,
  S2 extends MachineState,
  E2 extends MachineEvent,
>(
  base: MachineDefinition<S, E, C>,
  extension: TransitionTable<S | S2, E | E2, C>,
): MachineDefinition<S | S2, E | E2, C>

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

/** Starts the machines for a calendar and returns its getters. `destroy` stops timers and listeners. */
export declare function connectCalendar<F extends FeatureMap, V, EM, RM>(
  calendar: CalendarInstance<F, V, EM, RM>,
): CalendarGetters & { destroy(): void }

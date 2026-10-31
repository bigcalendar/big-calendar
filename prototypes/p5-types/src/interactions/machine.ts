// The machine contract (D-90): pure transitions in a table, a closed list of effects, one runtime.
// Public and stable from 1.0 (P5 answer 9).
import type { Draft } from '../core/index.ts'

export interface MachineState {
  readonly mode: string
}
export interface MachineEvent {
  readonly type: string
}

/** A cell in the coordinate space (engine): lane index × axis index on one surface. Never pixels. */
export interface Coordinates {
  surface: 'dayGrid' | 'timeGrid' | 'timeline' | 'agenda'
  lane: number
  index: number
}

export type FocusTarget =
  | { kind: 'cell'; at: Coordinates }
  | { kind: 'event'; key: string }
  /** A named part, such as the "+N more" button or the toolbar. */
  | { kind: 'part'; part: string; key?: string }
  /** Back to whatever had focus before (popover, menu, dialog). */
  | { kind: 'restore' }

export type ScrollTarget =
  | { kind: 'intoView'; target: FocusTarget }
  /** One autoscroll step while dragging near an edge. */
  | { kind: 'by'; part: string; x: number; y: number }
  | { kind: 'toTime'; time: string }

/** Asynchronous DOM reads; the runtime replies with `{ type: reply, result }`. */
export type DomQuery =
  { kind: 'cellAt'; x: number; y: number } | { kind: 'direction' }

/**
 * The closed list of effects. Machines never touch the DOM, timers or the kernel directly; they
 * return these, and the runtime performs them in order.
 */
export type Effect =
  /** Polite, except rollbacks, which are assertive (D-89). Debounced and cleared by the runtime. */
  | { type: 'announce'; message: string; politeness: 'polite' | 'assertive' }
  /** Sets or clears this machine's draft in the kernel's `drafts`. */
  | { type: 'draft'; draft: Draft | null }
  /** Turns the draft into a `Change` and sends it down the edit pipeline. */
  | { type: 'commit'; draft: Draft }
  | { type: 'focus'; target: FocusTarget }
  | { type: 'scroll'; target: ScrollTarget }
  /** When it fires, the runtime sends `event` back to the same machine. Same id replaces. */
  | { type: 'timerStart'; id: string; ms: number; event: MachineEvent }
  | { type: 'timerCancel'; id: string }
  | { type: 'read'; query: DomQuery; reply: string }

export interface TransitionResult<S extends MachineState> {
  state: S
  effects: readonly Effect[]
}

/**
 * Transitions keyed by state mode, then event type. Each handler is pure. A missing entry means the
 * event is ignored in that state.
 */
export type TransitionTable<
  S extends MachineState,
  E extends MachineEvent,
  C,
> = {
  readonly [M in S['mode']]?: {
    readonly [T in E['type']]?: (
      state: Extract<S, { mode: M }>,
      event: Extract<E, { type: T }>,
      ctx: C,
    ) => TransitionResult<S>
  }
}

export interface MachineDefinition<
  S extends MachineState,
  E extends MachineEvent,
  C,
> {
  readonly id: string
  readonly initial: S
  readonly table: TransitionTable<S, E, C>
}

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

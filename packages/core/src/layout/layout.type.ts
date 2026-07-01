import type { EventId } from '../types/calendar.type'

/**
 * One event handed to a day-layout algorithm. The vertical placement
 * (`top`/`height`) has already been resolved by the time grid's slot metrics
 * (Task 2f); the layout algorithm only decides the *horizontal* packing.
 *
 * - `start`/`end` are numeric time positions in any single consistent unit
 *   (minutes-from-day-start, slot indices, epoch ms — the caller picks one and
 *   uses it for every event). They drive overlap grouping.
 * - `top`/`height` are fractions of the day column, `0..1`.
 */
export interface DayLayoutEvent {
  id: EventId
  start: number
  end: number
  top: number
  height: number
}

/**
 * The placement of one event in the day column. Every value is a fraction of
 * the column (`0..1`); `left`/`width` are the horizontal packing the algorithm
 * computed, `top`/`height` are passed through unchanged. `zIndex` increases
 * with paint order so later events stack above the ones they overlap.
 */
export interface DayLayoutBox {
  id: EventId
  top: number
  height: number
  left: number
  width: number
  zIndex: number
}

/**
 * Inputs shared by every day-layout algorithm.
 *
 * `minimumStartDifference` is the smallest gap (in the same unit as
 * `start`/`end`) for two events to still count as starting "together" and share
 * a row. `overlap` honours it; `no-overlap` ignores it (it packs purely by
 * vertical overlap).
 */
export interface DayLayoutArgs {
  events: DayLayoutEvent[]
  minimumStartDifference: number
}

/** A day-layout algorithm: pure, args in → boxes out (in paint order). */
export type DayLayoutAlgorithm = (args: DayLayoutArgs) => DayLayoutBox[]

/** The built-in algorithm names. Custom functions may be used in their place. */
export type DayLayoutAlgorithmKey = 'overlap' | 'no-overlap'

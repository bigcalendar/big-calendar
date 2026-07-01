import type { DayLayoutAlgorithm, DayLayoutAlgorithmKey } from './layout.type'
import { noOverlap } from './noOverlap.function'
import { overlap } from './overlap.function'

/** The built-in day-layout algorithms, keyed by name (parity with v1). */
export const DEFAULT_DAY_LAYOUT_ALGORITHMS: Record<DayLayoutAlgorithmKey, DayLayoutAlgorithm> = {
  overlap,
  'no-overlap': noOverlap,
}

/**
 * Resolve a day-layout algorithm from either a built-in key (`'overlap'` |
 * `'no-overlap'`) or a custom function. Returns the function to run; unknown
 * keys fall back to `overlap`.
 */
export function resolveDayLayoutAlgorithm(
  algorithm: DayLayoutAlgorithmKey | DayLayoutAlgorithm = 'overlap',
): DayLayoutAlgorithm {
  if (typeof algorithm === 'function') return algorithm
  return DEFAULT_DAY_LAYOUT_ALGORITHMS[algorithm] ?? overlap
}

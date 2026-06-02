import { describe, expect, it } from 'vitest'
import { DEFAULT_DAY_LAYOUT_ALGORITHMS, resolveDayLayoutAlgorithm } from './dayLayout.function'
import type { DayLayoutAlgorithm, DayLayoutAlgorithmKey } from './layout.type'
import { noOverlap } from './noOverlap.function'
import { overlap } from './overlap.function'

describe('resolveDayLayoutAlgorithm', () => {
  it('maps the built-in keys to their functions', () => {
    expect(resolveDayLayoutAlgorithm('overlap')).toBe(overlap)
    expect(resolveDayLayoutAlgorithm('no-overlap')).toBe(noOverlap)
  })

  it('defaults to overlap when nothing is given', () => {
    expect(resolveDayLayoutAlgorithm()).toBe(overlap)
  })

  it('returns a custom function untouched', () => {
    const custom: DayLayoutAlgorithm = () => []
    expect(resolveDayLayoutAlgorithm(custom)).toBe(custom)
  })

  it('falls back to overlap for an unknown key', () => {
    expect(resolveDayLayoutAlgorithm('bogus' as DayLayoutAlgorithmKey)).toBe(overlap)
  })

  it('exposes both built-ins in the registry', () => {
    expect(DEFAULT_DAY_LAYOUT_ALGORITHMS).toEqual({ overlap, 'no-overlap': noOverlap })
  })
})

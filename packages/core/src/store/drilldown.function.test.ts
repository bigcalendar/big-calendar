import { describe, expect, it, vi } from 'vitest'
import { BUILTIN_VIEWS, Views } from '../constants/views.constant'
import { resolveDrilldownView } from './drilldown.function'

const base = {
  date: '2026-06-15T00:00:00.000Z',
  view: Views.MONTH,
  views: BUILTIN_VIEWS,
} as const

describe('resolveDrilldownView', () => {
  it('returns the static drilldownView when no resolver is given', () => {
    expect(resolveDrilldownView({ ...base, drilldownView: Views.DAY })).toBe(Views.DAY)
  })

  it('returns null when drilldown is disabled and no resolver is given', () => {
    expect(resolveDrilldownView({ ...base, drilldownView: null })).toBeNull()
  })

  it('defers to getDrilldownView, passing date/view/views', () => {
    const getDrilldownView = vi.fn(() => Views.WEEK)
    expect(
      resolveDrilldownView({ ...base, drilldownView: Views.DAY, getDrilldownView }),
    ).toBe(Views.WEEK)
    expect(getDrilldownView).toHaveBeenCalledWith({
      date: base.date,
      view: Views.MONTH,
      views: BUILTIN_VIEWS,
    })
  })

  it('treats a nullish resolver result as “no drilldown”', () => {
    expect(
      resolveDrilldownView({ ...base, drilldownView: Views.DAY, getDrilldownView: () => null }),
    ).toBeNull()
    expect(
      resolveDrilldownView({ ...base, drilldownView: Views.DAY, getDrilldownView: () => undefined }),
    ).toBeNull()
  })
})

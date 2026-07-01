import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import { render } from '@testing-library/svelte'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { makeContext } from '../testing/makeContext'
import Probe from '../testing/Probe.svelte'
import type { MonthDayCell } from '../useMonthWeeks'
import type { MonthSegmentCell } from '../useMonthWeeks'
import type { UseMonthViewReturn } from './useMonthView.svelte'
import { useMonthView } from './useMonthView.svelte'

function makeWrapper(localizer: LocalizerContract, defaultView: string) {
  return { context: makeContext(localizer, defaultView) }
}

describe.each(LOCALIZER_CASES)('useMonthView [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('grid.current is null when the active view is week', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useMonthView(() => null, () => null) } },
      ...makeWrapper(localizer, Views.WEEK),
    })

    expect(result!.grid.current).toBeNull()
  })

  it('grid.current is non-null when the active view is month', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useMonthView(() => null, () => null) } },
      ...makeWrapper(localizer, Views.MONTH),
    })

    expect(result!.grid.current).not.toBeNull()
  })

  it('month grid has 7 weekdays', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useMonthView(() => null, () => null) } },
      ...makeWrapper(localizer, Views.MONTH),
    })

    expect(result!.grid.current!.weekdays).toHaveLength(7)
  })

  it('month grid has at least 4 weeks', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useMonthView(() => null, () => null) } },
      ...makeWrapper(localizer, Views.MONTH),
    })

    expect(result!.grid.current!.weeks.length).toBeGreaterThanOrEqual(4)
  })

  it('returns correct class names for static layout props', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useMonthView(() => null, () => null) } },
      ...makeWrapper(localizer, Views.MONTH),
    })

    expect(result!.monthHeader.class).toBe('bc-month-header')
    expect(result!.getMonthGridProps().class).toContain('bc-month-grid')
    expect(result!.weekRow.class).toBe('bc-month-week')
    expect(result!.slotsContainer.class).toBe('bc-month-slots')
    expect(result!.eventsContainer.class).toBe('bc-week-events')
    expect(result!.getRootProps().class).toBe('bc-month')
  })

  it('getMessages exposes showMore function', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useMonthView(() => null, () => null) } },
      ...makeWrapper(localizer, Views.MONTH),
    })

    expect(typeof result!.getMessages().showMore).toBe('function')
    expect(typeof result!.getMessages().showMore(3)).toBe('string')
  })

  it('getDaySlotProps returns correct data attributes and slot index', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useMonthView(() => null, () => null) } },
      ...makeWrapper(localizer, Views.MONTH),
    })

    const fakeCell: MonthDayCell<unknown> = {
      day: '2024-01-15', label: '15', isToday: false, isOffRange: false, extra: null,
    }
    const props = result!.getDaySlotProps(fakeCell, 2, 3)
    expect(props.class).toBe('bc-month-slot')
    expect(props['data-date']).toBe('2024-01-15')
    expect(props['data-slot-index']).toBe(17)
  })

  it('getSegmentProps returns class bc-segment with resize edges', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useMonthView(() => null, () => null) } },
      ...makeWrapper(localizer, Views.MONTH),
    })

    const fakeSegment: MonthSegmentCell<unknown> = {
      key: 'k', event: {}, title: 'Test',
      left: 2, span: 3, row: 1,
      resizeStart: true, resizeEnd: false,
    }
    const props = result!.getSegmentProps(fakeSegment)
    expect(props.class).toBe('bc-segment')
    expect(typeof props.style).toBe('string')
    expect(props.resizeEdges).toEqual(['start'])
  })

  it('getShowMoreCellProps returns null when cell has no extra', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useMonthView(() => null, () => null) } },
      ...makeWrapper(localizer, Views.MONTH),
    })

    const cell: MonthDayCell<unknown> = {
      day: '2024-01-01', label: '1', isToday: false, isOffRange: false, extra: null,
    }
    expect(result!.getShowMoreCellProps(cell, 0, 2)).toBeNull()
  })

  it('getShowMoreCellProps returns props when cell has extra', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useMonthView(() => null, () => null) } },
      ...makeWrapper(localizer, Views.MONTH),
    })

    const cell: MonthDayCell<unknown> = {
      day: '2024-01-01', label: '1', isToday: false, isOffRange: false,
      extra: { count: 3, events: [{ key: 'a', event: {}, title: 'E' }] },
    }
    const props = result!.getShowMoreCellProps(cell, 1, 3)
    expect(props).not.toBeNull()
    expect(props!.class).toBe('bc-show-more-cell')
    expect(props!.count).toBe(3)
    expect(typeof props!.label).toBe('string')
  })

  it('getWeekSelectionBand returns null when no selection is active', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useMonthView(() => null, () => null) } },
      ...makeWrapper(localizer, Views.MONTH),
    })

    expect(result!.getWeekSelectionBand(0)).toBeNull()
  })

  it('drilldown is a callable function', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useMonthView(() => null, () => null) } },
      ...makeWrapper(localizer, Views.MONTH),
    })

    expect(() => result!.drilldown('2024-01-01')).not.toThrow()
  })

  it('announcer has role=status and aria-live=polite', () => {
    let result: UseMonthViewReturn<unknown> | undefined

    render(Probe, {
      props: { run: () => { result = useMonthView(() => null, () => null) } },
      ...makeWrapper(localizer, Views.MONTH),
    })

    expect(result!.announcer.role).toBe('status')
    expect(result!.announcer['aria-live']).toBe('polite')
    expect(result!.announcer.class).toContain('bc-sr-only')
  })
})

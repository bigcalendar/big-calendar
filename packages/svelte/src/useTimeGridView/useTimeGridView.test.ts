import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import { render } from '@testing-library/svelte'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { makeContext } from '../testing/makeContext'
import Probe from '../testing/Probe.svelte'
import type { TimeColumn } from '../useTimeGrid'
import type { UseTimeGridViewReturn } from './useTimeGridView.svelte'
import { useTimeGridView } from './useTimeGridView.svelte'

const NULL3 = { getRootEl: () => null, getAllDayRowEl: () => null, getBodyEl: () => null }

function probe(localizer: LocalizerContract, defaultView: string) {
  return { context: makeContext(localizer, defaultView) }
}

// ---------------------------------------------------------------------------
// useTimeGridView
// ---------------------------------------------------------------------------

describe.each(LOCALIZER_CASES)('useTimeGridView [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('grid.current is null when active view is month', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.MONTH),
    })

    expect(result!.grid.current).toBeNull()
  })

  it('grid.current is non-null when active view is week', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    expect(result!.grid.current).not.toBeNull()
  })

  it('getRootClass returns bc-time-grid for plain week view', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    expect(result!.getRootClass()).toBe('bc-time-grid')
  })

  it('announcer has role=status and aria-live=polite', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    expect(result!.announcer.role).toBe('status')
    expect(result!.announcer['aria-live']).toBe('polite')
    expect(result!.announcer.class).toContain('bc-sr-only')
  })

  it('getRootStyle returns an object with CSS custom properties', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    const style = result!.getRootStyle(7)
    expect(typeof style).toBe('string')
    expect(style.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// useTimeGridHeader (accessed via useTimeGridView)
// ---------------------------------------------------------------------------

describe.each(LOCALIZER_CASES)('useTimeGridHeader [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('timeHead has class bc-time-head', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    expect(result!.header.timeHead.class).toBe('bc-time-head')
  })

  it('allDayRowClass contains bc-allday-row', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    expect(result!.header.allDayRowClass).toContain('bc-allday-row')
  })

  it('exposes onAllDayPointerdown, onAllDayKeydown, onAllDayFocusCapture handlers', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    expect(typeof result!.header.onAllDayPointerdown).toBe('function')
    expect(typeof result!.header.onAllDayKeydown).toBe('function')
    expect(typeof result!.header.onAllDayFocusCapture).toBe('function')
  })

  it('getAllDaySelectionBand returns null when no selection is active', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    expect(result!.header.getAllDaySelectionBand()).toBeNull()
  })

  it('getAllDaySlotProps returns correct data attributes', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    const fakeColumn: TimeColumn<unknown> = {
      key: '0', day: '2024-01-15', resourceId: null,
      min: '', max: '', isToday: false,
      events: [], backgroundEvents: [], nowTop: null, slots: [],
    }
    const props = result!.header.getAllDaySlotProps(fakeColumn, 2)
    expect(props.class).toBe('bc-allday-slot')
    expect(props['data-date']).toBe('2024-01-15')
    expect(props['data-slot-index']).toBe(2)
    expect(props['data-bc-allday']).toBe('2024-01-15')
    expect(typeof props.tabIndex).toBe('number')
  })

  it('getAllDaySlotProps adds bc-today class for today column', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    const todayColumn: TimeColumn<unknown> = {
      key: '0', day: '2024-01-15', resourceId: null,
      min: '', max: '', isToday: true,
      events: [], backgroundEvents: [], nowTop: null, slots: [],
    }
    const props = result!.header.getAllDaySlotProps(todayColumn, 0)
    expect(props.class).toContain('bc-today')
  })

  it('getHeadingProps enriches heading with onDrillDown callback', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    const heading = { day: '2024-01-15', label: 'Mon Jan 15', isToday: false }
    const props = result!.header.getHeadingProps(heading)
    expect(typeof props.onDrillDown).toBe('function')
    expect(() => props.onDrillDown()).not.toThrow()
  })

  it('getAllDaySegmentProps returns class bc-segment with style', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    const seg = { key: 'a', event: {}, title: 'Test', left: 1, span: 2, row: 1, resizeStart: false, resizeEnd: false }
    const props = result!.header.getAllDaySegmentProps(seg)
    expect(props.class).toBe('bc-segment')
    expect(typeof props.style).toBe('string')
  })

  it('getStackedSegmentProps returns bc-segment bc-segment-stacked', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    const seg = { key: 'a', event: {}, title: 'Test', left: 1, span: 1, row: 1, resizeStart: false, resizeEnd: false }
    const props = result!.header.getStackedSegmentProps(seg)
    expect(props.class).toBe('bc-segment bc-segment-stacked')
  })

  it('drilldown is callable', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    expect(() => result!.header.drilldown('2024-01-15')).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// useTimeGridBody (accessed via useTimeGridView)
// ---------------------------------------------------------------------------

describe.each(LOCALIZER_CASES)('useTimeGridBody [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('gutter has class bc-time-gutter', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    expect(result!.body.gutter.class).toBe('bc-time-gutter')
  })

  it('getBody returns class bc-time-body with handlers', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    const body = result!.body.getBody()
    expect(body.class).toBe('bc-time-body')
    expect(typeof body.onKeydown).toBe('function')
    expect(typeof body.onFocusCapture).toBe('function')
    expect(typeof body.onPointerdown).toBe('function')
  })

  it('getColumnProps adds bc-today for today columns', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    const today: TimeColumn<unknown> = {
      key: 'k', day: '2024-01-15', resourceId: null,
      min: '', max: '', isToday: true,
      events: [], backgroundEvents: [], nowTop: null, slots: [],
    }
    const notToday = { ...today, isToday: false }
    expect(result!.body.getColumnProps(today).class).toContain('bc-today')
    expect(result!.body.getColumnProps(notToday).class).not.toContain('bc-today')
  })

  it('getSlotProps returns correct data attributes and tabIndex', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    const col: TimeColumn<unknown> = {
      key: 'k', day: '2024-01-15', resourceId: null,
      min: '', max: '', isToday: false,
      events: [], backgroundEvents: [], nowTop: null,
      slots: ['2024-01-15T08:00:00Z', '2024-01-15T08:30:00Z'],
    }
    const props = result!.body.getSlotProps(col, 0, 1)
    expect(props.class).toBe('bc-time-slot')
    expect(props['data-date']).toBe('2024-01-15')
    expect(typeof props['data-slot-index']).toBe('number')
    expect(typeof props.tabIndex).toBe('number')
  })

  it('getNowIndicatorProps returns null when nowTop is null', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    const col: TimeColumn<unknown> = {
      key: 'k', day: '2024-01-15', resourceId: null,
      min: '', max: '', isToday: false,
      events: [], backgroundEvents: [], nowTop: null, slots: [],
    }
    expect(result!.body.getNowIndicatorProps(col)).toBeNull()
  })

  it('getNowIndicatorProps returns props when nowTop is set', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    const col: TimeColumn<unknown> = {
      key: 'k', day: '2024-01-15', resourceId: null,
      min: '', max: '', isToday: true,
      events: [], backgroundEvents: [], nowTop: 0.5, slots: [],
    }
    const props = result!.body.getNowIndicatorProps(col)
    expect(props).not.toBeNull()
    expect(props!.class).toBe('bc-now-indicator')
  })

  it('getTimeSelectionDivProps returns null when no selection is active', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    expect(result!.body.getTimeSelectionDivProps(0)).toBeNull()
  })

  it('getPreviewDivProps returns null (no active preview)', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    expect(result!.body.getPreviewDivProps({ min: '', max: '' })).toBeNull()
  })

  it('getBgEventProps returns correct class string', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    const bg = { key: 'bg', event: {}, title: '', top: 0.1, height: 0.2, left: 0, width: 1, isStart: true, isEnd: false }
    const props = result!.body.getBgEventProps(bg)
    expect(props.class).toContain('bc-bg-event')
    expect(props.class).toContain('bc-bg-event--start')
    expect(props.class).not.toContain('bc-bg-event--end')
  })

  it('getEventProps returns bc-event class with style and time', () => {
    let result: UseTimeGridViewReturn<unknown> | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useTimeGridView(NULL3.getRootEl, NULL3.getAllDayRowEl, NULL3.getBodyEl)
        },
      },
      ...probe(localizer, Views.WEEK),
    })

    const ev = { key: 'ev', event: {}, title: 'Test', time: '9:00 AM', top: 0.1, height: 0.05, left: 0, width: 0.5, zIndex: 1 }
    const props = result!.body.getEventProps(ev)
    expect(props.class).toBe('bc-event')
    expect(props.time).toBe('9:00 AM')
    expect(typeof props.style).toBe('string')
  })
})

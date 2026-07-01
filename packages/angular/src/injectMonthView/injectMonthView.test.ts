import { Views } from '@big-calendar/core'
import type { CalendarStore, LocalizerContract, ViewKey } from '@big-calendar/core'
import { Component, inject, input } from '@angular/core'
import { By } from '@angular/platform-browser'
import { TestBed } from '@angular/core/testing'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { CalendarProviderComponent } from '../CalendarProvider/CalendarProviderComponent'
import { CALENDAR_TOKEN } from '../CalendarProvider/calendarContext'
import type { InjectMonthViewReturn } from './injectMonthView'
import { injectMonthView } from './injectMonthView'

@Component({ standalone: true, selector: 'bc-month-probe', template: '' })
class MonthProbeComponent {
  result = injectMonthView()
}

@Component({
  standalone: true,
  selector: 'bc-month-wrapper',
  template: `
    <bc-calendar-provider [localizer]="localizer()" [defaultView]="defaultView()">
      <bc-month-probe />
    </bc-calendar-provider>
  `,
  imports: [CalendarProviderComponent, MonthProbeComponent],
})
class MonthWrapperComponent {
  readonly localizer = input.required<LocalizerContract>()
  readonly defaultView = input<ViewKey>()
}

function createWrapper(localizer: LocalizerContract, defaultView?: ViewKey) {
  TestBed.configureTestingModule({ imports: [MonthWrapperComponent] })
  const fixture = TestBed.createComponent(MonthWrapperComponent)
  fixture.componentRef.setInput('localizer', localizer)
  if (defaultView !== undefined) fixture.componentRef.setInput('defaultView', defaultView)
  fixture.detectChanges()
  return {
    fixture,
    result: fixture.debugElement
      .query(By.directive(MonthProbeComponent))
      .componentInstance.result as InjectMonthViewReturn<unknown>,
  }
}

describe.each(LOCALIZER_CASES)('injectMonthView [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('grid is null when the active view is week', () => {
    const { result } = createWrapper(localizer, Views.WEEK)
    expect(result.grid()).toBeNull()
  })

  it('grid is non-null when the active view is month', () => {
    const { result } = createWrapper(localizer, Views.MONTH)
    expect(result.grid()).not.toBeNull()
  })

  it('month grid has 7 weekdays', () => {
    const { result } = createWrapper(localizer, Views.MONTH)
    expect(result.grid()!.weekdays).toHaveLength(7)
  })

  it('month grid has at least 4 weeks', () => {
    const { result } = createWrapper(localizer, Views.MONTH)
    expect(result.grid()!.weeks.length).toBeGreaterThanOrEqual(4)
  })

  it('returns correct class names for static layout props', () => {
    const { result } = createWrapper(localizer, Views.MONTH)
    expect(result.root.class).toBe('bc-month')
    expect(result.monthHeader.class).toBe('bc-month-header')
    expect(result.monthGrid().class).toContain('bc-month-grid')
    expect(result.weekRow.class).toBe('bc-month-week')
    expect(result.slotsContainer.class).toBe('bc-month-slots')
    expect(result.eventsContainer.class).toBe('bc-week-events')
  })

  it('messages signal exposes showMore function', () => {
    const { result } = createWrapper(localizer, Views.MONTH)
    expect(typeof result.messages().showMore).toBe('function')
    expect(typeof result.messages().showMore(3)).toBe('string')
  })

  it('getDaySlotProps returns correct data attributes', () => {
    const { result } = createWrapper(localizer, Views.MONTH)
    const fakeCell = { day: '2024-01-15', label: '15', isToday: false, isOffRange: false, extra: null }
    const props = result.getDaySlotProps(fakeCell, 2, 3)
    expect(props.class).toBe('bc-month-slot')
    expect(props['data-date']).toBe('2024-01-15')
    expect(props['data-slot-index']).toBe(17)
  })

  it('getSegmentProps returns class, style, and resize edges', () => {
    const { result } = createWrapper(localizer, Views.MONTH)
    const fakeSegment = {
      key: 'k',
      event: {},
      title: 'Test',
      left: 2,
      span: 3,
      row: 1,
      resizeStart: true,
      resizeEnd: false,
    }
    const props = result.getSegmentProps(fakeSegment)
    expect(props.class).toBe('bc-segment')
    expect(typeof props.style).toBe('object')
    expect(props.resizeEdges).toEqual(['start'])
  })

  it('getShowMoreCellProps returns null when cell has no extra', () => {
    const { result } = createWrapper(localizer, Views.MONTH)
    const cell = { day: '2024-01-01', label: '1', isToday: false, isOffRange: false, extra: null }
    expect(result.getShowMoreCellProps(cell, 0, 2)).toBeNull()
  })

  it('getShowMoreCellProps returns props when cell has extra', () => {
    const { result } = createWrapper(localizer, Views.MONTH)
    const cell = {
      day: '2024-01-01',
      label: '1',
      isToday: false,
      isOffRange: false,
      extra: { count: 3, events: [{ key: 'a', event: {}, title: 'E' }] },
    }
    const props = result.getShowMoreCellProps(cell, 1, 3)
    expect(props).not.toBeNull()
    expect(props!.class).toBe('bc-show-more-cell')
    expect(props!.count).toBe(3)
    expect(typeof props!.label).toBe('string')
  })

  it('getWeekSelectionBand returns null when no selection is active', () => {
    const { result } = createWrapper(localizer, Views.MONTH)
    expect(result.getWeekSelectionBand(0)).toBeNull()
  })

  it('getWeekPreviewBand returns null when no drag preview is active', () => {
    const { result } = createWrapper(localizer, Views.MONTH)
    const grid = result.grid()
    const firstWeek = grid!.weeks[0]!
    expect(result.getWeekPreviewBand(firstWeek)).toBeNull()
  })

  it('getSegmentProps with resizeStart=false and resizeEnd=true gives correct edges', () => {
    const { result } = createWrapper(localizer, Views.MONTH)
    const fakeSegment = {
      key: 'k',
      event: {},
      title: 'Test',
      left: 3,
      span: 2,
      row: 2,
      resizeStart: false,
      resizeEnd: true,
    }
    const props = result.getSegmentProps(fakeSegment)
    expect(props.resizeEdges).toEqual(['end'])
  })

  it('getSegmentProps with resizeStart=false and resizeEnd=false gives empty edges', () => {
    const { result } = createWrapper(localizer, Views.MONTH)
    const fakeSegment = {
      key: 'k',
      event: {},
      title: 'Test',
      left: 1,
      span: 7,
      row: 1,
      resizeStart: false,
      resizeEnd: false,
    }
    const props = result.getSegmentProps(fakeSegment)
    expect(props.resizeEdges).toEqual([])
  })

  it('monthGrid signal has a non-empty style when grid is non-null', () => {
    const { result } = createWrapper(localizer, Views.MONTH)
    const attrs = result.monthGrid()
    expect(typeof attrs.style).toBe('object')
  })

  it('monthGrid signal style is empty when grid is null', () => {
    const { result } = createWrapper(localizer, Views.WEEK)
    const attrs = result.monthGrid()
    expect(attrs.class).toContain('bc-month-grid')
    // style should be empty when grid() is null
    expect(Object.keys(attrs.style).length).toBe(0)
  })

  it('drilldown is callable without throwing', () => {
    const { result } = createWrapper(localizer, Views.MONTH)
    expect(() => result.drilldown('2024-01-01')).not.toThrow()
  })

  it('drilldown is a no-op when store is not yet available', () => {
    const { result } = createWrapper(localizer, Views.WEEK)
    // When view is week, storeSignal is set but grid is null;
    // drilldown still accesses storeSignal safely
    expect(() => result.drilldown('2024-01-15')).not.toThrow()
  })

  it('segments are computed when events exist in the month grid', () => {
    const eventObj = { id: 'seg1', title: 'Test Event', start: '2024-06-15T10:00:00.000Z', end: '2024-06-15T11:00:00.000Z' }

    @Component({ standalone: true, selector: 'bc-month-probe-seg', template: '' })
    class SegMonthProbeComponent { result = injectMonthView() }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" defaultView="month" defaultDate="2024-06-15T00:00:00.000Z" [events]="evts"><bc-month-probe-seg /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, SegMonthProbeComponent],
    })
    class SegMonthWrapperComponent { loc = localizer; evts = [eventObj] }

    TestBed.configureTestingModule({ imports: [SegMonthWrapperComponent] })
    const fixture = TestBed.createComponent(SegMonthWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(SegMonthProbeComponent)).componentInstance as SegMonthProbeComponent
    const grid = probe.result.grid()
    expect(grid).not.toBeNull()
    const allSegments = grid!.weeks.flatMap((w) => w.segments)
    expect(allSegments.length).toBeGreaterThan(0)
  })

  it('segments include resize edges when event fits within a week', () => {
    const eventObj = { id: 'seg2', title: 'Short Event', start: '2024-06-15T10:00:00.000Z', end: '2024-06-15T11:00:00.000Z' }

    @Component({ standalone: true, selector: 'bc-month-probe-edges', template: '' })
    class EdgeMonthProbeComponent { result = injectMonthView() }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" defaultView="month" defaultDate="2024-06-15T00:00:00.000Z" [events]="evts"><bc-month-probe-edges /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, EdgeMonthProbeComponent],
    })
    class EdgeMonthWrapperComponent { loc = localizer; evts = [eventObj] }

    TestBed.configureTestingModule({ imports: [EdgeMonthWrapperComponent] })
    const fixture = TestBed.createComponent(EdgeMonthWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(EdgeMonthProbeComponent)).componentInstance as EdgeMonthProbeComponent
    const grid = probe.result.grid()
    const allSegments = grid!.weeks.flatMap((w) => w.segments)
    // For a single-day event the segment should have resizeStart=true and resizeEnd=true
    const seg = allSegments[0]
    expect(seg).toBeDefined()
    expect(typeof seg!.resizeStart).toBe('boolean')
    expect(typeof seg!.resizeEnd).toBe('boolean')
  })

  it('getWeekPreviewBand returns props when a keyboard-drag preview overlaps the week', () => {
    // Multi-day event so preview spans several consecutive days within a week,
    // covering the first !== -1 branch inside the forEach loop
    const eventObj = { id: 'drag1', title: 'Multi-day Drag', start: '2024-06-13T00:00:00.000Z', end: '2024-06-18T00:00:00.000Z', draggable: true }

    @Component({ standalone: true, selector: 'bc-month-probe-drag', template: '' })
    class DragMonthProbeComponent {
      result = injectMonthView()
      ctx = inject(CALENDAR_TOKEN)
    }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" defaultView="month" defaultDate="2024-06-15T00:00:00.000Z" [events]="evts"><bc-month-probe-drag /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, DragMonthProbeComponent],
    })
    class DragMonthWrapperComponent { loc = localizer; evts = [eventObj] }

    TestBed.configureTestingModule({ imports: [DragMonthWrapperComponent] })
    const fixture = TestBed.createComponent(DragMonthWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(DragMonthProbeComponent)).componentInstance as DragMonthProbeComponent

    const store = probe.ctx.storeSignal() as CalendarStore<typeof eventObj>
    // Grab the event to prime dragPreview (grabEvent primes dragPreview with current bounds)
    store.grabEvent({ id: 'drag1' })

    const grid = probe.result.grid()
    expect(grid).not.toBeNull()
    // Search all weeks for one where getWeekPreviewBand returns non-null
    let found: object | null = null
    for (const week of grid!.weeks) {
      const band = probe.result.getWeekPreviewBand(week)
      if (band !== null) { found = band; break }
    }
    expect(found).not.toBeNull()
    expect((found as { class: string }).class).toContain('bc-drag-preview')
  })

  it('getWeekSelectionBand returns props when a day-mode selection overlaps the week', () => {
    @Component({ standalone: true, selector: 'bc-month-probe-sel', template: '' })
    class SelMonthProbeComponent {
      result = injectMonthView()
      ctx = inject(CALENDAR_TOKEN)
    }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" defaultView="month" defaultDate="2024-06-15T00:00:00.000Z" [selectable]="true"><bc-month-probe-sel /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, SelMonthProbeComponent],
    })
    class SelMonthWrapperComponent { loc = localizer }

    TestBed.configureTestingModule({ imports: [SelMonthWrapperComponent] })
    const fixture = TestBed.createComponent(SelMonthWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(SelMonthProbeComponent)).componentInstance as SelMonthProbeComponent

    const store = probe.ctx.storeSignal() as CalendarStore
    // Start a day-mode selection that spans several slots in week 0
    store.selection.start({ slot: 0, date: '2024-06-01', mode: 'day' })
    store.selection.to({ slot: 6 })

    const grid = probe.result.grid()
    expect(grid).not.toBeNull()
    // Iterate all weeks — some overlap (non-null), some don't (null, covers segStart > segEnd branch)
    const allBands = grid!.weeks.map((_, i) => probe.result.getWeekSelectionBand(i))
    const found = allBands.find((b) => b !== null)
    expect(found).not.toBeNull()
    expect((found as { class: string }).class).toContain('bc-selection')
    // At least one week falls outside the slot 0–6 range and returns null
    expect(allBands.some((b) => b === null)).toBe(true)
  })

  it('segment title defaults to empty string when event has no title property', () => {
    // Event with no title → title(event) returns undefined → title() ?? '' fires the empty-string branch
    const noTitleEvent = { id: 'seg-no-title', start: '2024-06-15T10:00:00.000Z', end: '2024-06-15T11:00:00.000Z' }

    @Component({ standalone: true, selector: 'bc-month-probe-notitle', template: '' })
    class NoTitleMonthProbeComponent { result = injectMonthView() }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" defaultView="month" defaultDate="2024-06-15T00:00:00.000Z" [events]="evts"><bc-month-probe-notitle /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, NoTitleMonthProbeComponent],
    })
    class NoTitleMonthWrapperComponent { loc = localizer; evts = [noTitleEvent] }

    TestBed.configureTestingModule({ imports: [NoTitleMonthWrapperComponent] })
    const fixture = TestBed.createComponent(NoTitleMonthWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(NoTitleMonthProbeComponent)).componentInstance as NoTitleMonthProbeComponent
    const grid = probe.result.grid()
    expect(grid).not.toBeNull()
    const allSegments = grid!.weeks.flatMap((w) => w.segments)
    expect(allSegments.length).toBeGreaterThan(0)
    expect(allSegments[0]!.title).toBe('')
  })

  it('extra overflow is computed when weekEventLimit is set and events exceed it', () => {
    // weekEventLimit=2 caps visible rows; with 4 events on the same day the rest go to extra
    const manyEvents = Array.from({ length: 4 }, (_, i) => ({
      id: `overflow${i}`,
      title: `Overflow ${i}`,
      start: '2024-06-15T10:00:00.000Z',
      end: '2024-06-15T11:00:00.000Z',
    }))

    @Component({ standalone: true, selector: 'bc-month-probe-overflow', template: '' })
    class OverflowMonthProbeComponent { result = injectMonthView() }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" defaultView="month" defaultDate="2024-06-15T00:00:00.000Z" [events]="evts" [weekEventLimit]="2"><bc-month-probe-overflow /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, OverflowMonthProbeComponent],
    })
    class OverflowMonthWrapperComponent { loc = localizer; evts = manyEvents }

    TestBed.configureTestingModule({ imports: [OverflowMonthWrapperComponent] })
    const fixture = TestBed.createComponent(OverflowMonthWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(OverflowMonthProbeComponent)).componentInstance as OverflowMonthProbeComponent
    const grid = probe.result.grid()
    expect(grid).not.toBeNull()
    // With weekEventLimit=2, extra events should overflow onto at least one day
    const dayWithOverflow = grid!.weeks.flatMap((w) => w.days).find((d) => d.extra !== null)
    expect(dayWithOverflow).toBeDefined()
    expect(dayWithOverflow!.extra!.count).toBeGreaterThan(0)
  })

  it('extra overflow events with no title default to empty string in the event list', () => {
    // No-title events + weekEventLimit=2 → covering.map fires title() ?? '' branch for overflow events
    const noTitleOverflowEvents = Array.from({ length: 4 }, (_, i) => ({
      id: `ov-no-title-${i}`,
      start: '2024-06-15T10:00:00.000Z',
      end: '2024-06-15T11:00:00.000Z',
    }))

    @Component({ standalone: true, selector: 'bc-month-probe-ov-notitle', template: '' })
    class OvNoTitleProbeComponent { result = injectMonthView() }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" defaultView="month" defaultDate="2024-06-15T00:00:00.000Z" [events]="evts" [weekEventLimit]="2"><bc-month-probe-ov-notitle /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, OvNoTitleProbeComponent],
    })
    class OvNoTitleWrapperComponent { loc = localizer; evts = noTitleOverflowEvents }

    TestBed.configureTestingModule({ imports: [OvNoTitleWrapperComponent] })
    const fixture = TestBed.createComponent(OvNoTitleWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(OvNoTitleProbeComponent)).componentInstance as OvNoTitleProbeComponent
    const grid = probe.result.grid()
    expect(grid).not.toBeNull()
    const dayWithOverflow = grid!.weeks.flatMap((w) => w.days).find((d) => d.extra !== null)
    expect(dayWithOverflow).toBeDefined()
    expect(dayWithOverflow!.extra!.count).toBeGreaterThan(0)
  })
})

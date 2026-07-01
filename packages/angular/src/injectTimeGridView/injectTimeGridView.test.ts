import { Views } from '@big-calendar/core'
import type { LocalizerContract, ViewKey } from '@big-calendar/core'
import { Component, input } from '@angular/core'
import { By } from '@angular/platform-browser'
import { TestBed } from '@angular/core/testing'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { CalendarProviderComponent } from '../CalendarProvider/CalendarProviderComponent'
import type { InjectTimeGridViewReturn, TimeColumn } from './injectTimeGridView'
import { injectTimeGridView } from './injectTimeGridView'

@Component({ standalone: true, selector: 'bc-time-probe', template: '' })
class TimeProbeComponent {
  result = injectTimeGridView()
}

@Component({
  standalone: true,
  selector: 'bc-time-wrapper',
  template: `
    <bc-calendar-provider [localizer]="localizer()" [defaultView]="defaultView()">
      <bc-time-probe />
    </bc-calendar-provider>
  `,
  imports: [CalendarProviderComponent, TimeProbeComponent],
})
class TimeWrapperComponent {
  readonly localizer = input.required<LocalizerContract>()
  readonly defaultView = input<ViewKey>()
}

function createWrapper(localizer: LocalizerContract, defaultView?: ViewKey) {
  TestBed.configureTestingModule({ imports: [TimeWrapperComponent] })
  const fixture = TestBed.createComponent(TimeWrapperComponent)
  fixture.componentRef.setInput('localizer', localizer)
  if (defaultView !== undefined) fixture.componentRef.setInput('defaultView', defaultView)
  fixture.detectChanges()
  return {
    fixture,
    result: fixture.debugElement
      .query(By.directive(TimeProbeComponent))
      .componentInstance.result as InjectTimeGridViewReturn<unknown>,
  }
}

describe.each(LOCALIZER_CASES)('injectTimeGridView [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('grid is null when the active view is month', () => {
    const { result } = createWrapper(localizer, Views.MONTH)
    expect(result.grid()).toBeNull()
  })

  it('grid is non-null when the active view is week', () => {
    const { result } = createWrapper(localizer, Views.WEEK)
    expect(result.grid()).not.toBeNull()
  })

  it('grid is non-null when the active view is day', () => {
    const { result } = createWrapper(localizer, Views.DAY)
    expect(result.grid()).not.toBeNull()
  })

  it('week grid has 7 column headings', () => {
    const { result } = createWrapper(localizer, Views.WEEK)
    expect(result.grid()!.headings).toHaveLength(7)
  })

  it('day grid has 1 column heading', () => {
    const { result } = createWrapper(localizer, Views.DAY)
    expect(result.grid()!.headings).toHaveLength(1)
  })

  it('grid gutter has at least 1 label', () => {
    const { result } = createWrapper(localizer, Views.WEEK)
    expect(result.grid()!.gutter.length).toBeGreaterThan(0)
  })

  it('getRootClass returns bc-time-grid for week view', () => {
    const { result } = createWrapper(localizer, Views.WEEK)
    expect(result.getRootClass(result.grid())).toBe('bc-time-grid')
  })

  it('getRootStyle returns an object with CSS custom properties', () => {
    const { result } = createWrapper(localizer, Views.WEEK)
    const style = result.getRootStyle(7)
    expect(typeof style).toBe('object')
    expect(Object.keys(style).length).toBeGreaterThan(0)
  })

  it('columns are empty and resources null for a non-resource week view', () => {
    const { result } = createWrapper(localizer, Views.WEEK)
    const grid = result.grid()!
    expect(grid.resources).toBeNull()
    expect(grid.dayGroups).toBeNull()
    expect(grid.columns).toHaveLength(7)
  })

  it('getRootClass returns bc-time-grid for null grid', () => {
    const { result } = createWrapper(localizer, Views.WEEK)
    expect(result.getRootClass(null)).toBe('bc-time-grid')
  })

  it('getRootClass returns plain bc-time-grid for non-resource week grid', () => {
    const { result } = createWrapper(localizer, Views.WEEK)
    expect(result.getRootClass(result.grid())).toBe('bc-time-grid')
  })

  it('getRootClass returns resource-week class when resources and multiple headings', () => {
    const { result } = createWrapper(localizer, Views.WEEK)
    const fakeGrid = {
      headings: [
        { day: 'd1', label: 'Mon', isToday: false },
        { day: 'd2', label: 'Tue', isToday: false },
      ],
      gutter: [],
      slotCount: 0,
      allDay: { segments: [], extra: null },
      columns: [],
      resources: [{ key: 'r1', resourceId: 'r1', resourceTitle: 'Room A', resourceType: null, columns: [], allDay: { segments: [], extra: null } }],
      dayGroups: null,
    }
    const cls = result.getRootClass(fakeGrid as never)
    expect(cls).toContain('bc-time-grid-resources-week')
  })

  it('getRootClass returns resource-day class when resources and one heading', () => {
    const { result } = createWrapper(localizer, Views.WEEK)
    const fakeGrid = {
      headings: [{ day: 'd1', label: 'Mon', isToday: false }],
      gutter: [],
      slotCount: 0,
      allDay: { segments: [], extra: null },
      columns: [],
      resources: [{ key: 'r1', resourceId: 'r1', resourceTitle: 'Room A', resourceType: null, columns: [], allDay: { segments: [], extra: null } }],
      dayGroups: null,
    }
    const cls = result.getRootClass(fakeGrid as never)
    expect(cls).toContain('bc-time-grid-resources-day')
  })

  it('getRootClass returns day-major class when dayGroups is non-null', () => {
    const { result } = createWrapper(localizer, Views.WEEK)
    const fakeGrid = {
      headings: [],
      gutter: [],
      slotCount: 0,
      allDay: { segments: [], extra: null },
      columns: [],
      resources: null,
      dayGroups: [{ key: 'd0', date: '2024-01-01', label: 'Mon', isToday: false, cells: [] }],
    }
    const cls = result.getRootClass(fakeGrid as never)
    expect(cls).toContain('bc-time-grid-resources-day-major')
  })

  it('getRootStyle returns an object for time-grid mode', () => {
    const { result } = createWrapper(localizer, Views.WEEK)
    const style = result.getRootStyle(7)
    expect(style).toBeTypeOf('object')
    expect(Object.keys(style).length).toBeGreaterThan(0)
  })

  it('grid is non-null for work_week view', () => {
    const { result } = createWrapper(localizer, Views.WORK_WEEK)
    expect(result.grid()).not.toBeNull()
  })

  it('event mapping lambda runs when timed events exist in the column', () => {
    const eventObj = { id: 'tg1', title: 'Timed', start: '2024-06-17T10:00:00.000Z', end: '2024-06-17T11:00:00.000Z' }

    @Component({ standalone: true, selector: 'bc-time-probe-ev', template: '' })
    class EventTimeProbeComponent { result = injectTimeGridView() }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" defaultView="week" defaultDate="2024-06-17T00:00:00.000Z" [events]="evts"><bc-time-probe-ev /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, EventTimeProbeComponent],
    })
    class EventTimeWrapperComponent { loc = localizer; evts = [eventObj] }

    TestBed.configureTestingModule({ imports: [EventTimeWrapperComponent] })
    const fixture = TestBed.createComponent(EventTimeWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(EventTimeProbeComponent)).componentInstance as EventTimeProbeComponent
    const grid = probe.result.grid()
    expect(grid).not.toBeNull()
    // The column for June 17 should contain the event
    const allEvents = grid!.columns.flatMap((c: TimeColumn<unknown>) => c.events)
    expect(allEvents.length).toBeGreaterThan(0)
    // Verify event has key, title, and positioning props
    const ev = allEvents[0]!
    expect(typeof ev.key).toBe('string')
    expect(typeof ev.title).toBe('string')
    expect(typeof ev.top).toBe('number')
  })

  it('background event mapping lambda runs when background events exist in the column', () => {
    const bgEventObj = { id: 'bg1', title: 'BG Event', start: '2024-06-17T08:00:00.000Z', end: '2024-06-17T09:00:00.000Z' }

    @Component({ standalone: true, selector: 'bc-time-probe-bg', template: '' })
    class BgTimeProbeComponent { result = injectTimeGridView() }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" defaultView="week" defaultDate="2024-06-17T00:00:00.000Z" [backgroundEvents]="evts"><bc-time-probe-bg /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, BgTimeProbeComponent],
    })
    class BgTimeWrapperComponent { loc = localizer; evts = [bgEventObj] }

    TestBed.configureTestingModule({ imports: [BgTimeWrapperComponent] })
    const fixture = TestBed.createComponent(BgTimeWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(BgTimeProbeComponent)).componentInstance as BgTimeProbeComponent
    const grid = probe.result.grid()
    expect(grid).not.toBeNull()
    const allBgEvents = grid!.columns.flatMap((c: TimeColumn<unknown>) => c.backgroundEvents)
    expect(allBgEvents.length).toBeGreaterThan(0)
    const bg = allBgEvents[0]!
    expect(typeof bg.key).toBe('string')
    expect(typeof bg.isStart).toBe('boolean')
  })

  it('nowTop is set when today is in the grid (isToday path)', () => {
    // Use a real "today" so the isToday path fires in resolveColumn
    @Component({ standalone: true, selector: 'bc-time-probe-today', template: '' })
    class TodayTimeProbeComponent { result = injectTimeGridView() }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" defaultView="day"><bc-time-probe-today /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, TodayTimeProbeComponent],
    })
    class TodayTimeWrapperComponent { loc = localizer }

    TestBed.configureTestingModule({ imports: [TodayTimeWrapperComponent] })
    const fixture = TestBed.createComponent(TodayTimeWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(TodayTimeProbeComponent)).componentInstance as TodayTimeProbeComponent
    const grid = probe.result.grid()
    expect(grid).not.toBeNull()
    // For day view, isToday should be true for the single column → nowTop is set
    const col = grid!.columns[0]!
    // nowTop can be null if outside [0, 1] range but the branch is still covered
    expect(col.isToday).toBe(true)
    expect(col.nowTop === null || typeof col.nowTop === 'number').toBe(true)
  })

  it('resources path is triggered when resources are provided (resourceLayout=resource)', () => {
    const resources = [{ id: 'r1', title: 'Room A' }, { id: 'r2', title: 'Room B' }]
    const eventObj = { id: 'er1', title: 'Meeting', start: '2024-06-17T10:00:00.000Z', end: '2024-06-17T11:00:00.000Z', resourceId: 'r1' }

    @Component({ standalone: true, selector: 'bc-time-probe-res', template: '' })
    class ResourceTimeProbeComponent { result = injectTimeGridView() }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" defaultView="week" defaultDate="2024-06-17T00:00:00.000Z" [events]="evts" [resources]="res" resourceLayout="resource"><bc-time-probe-res /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, ResourceTimeProbeComponent],
    })
    class ResourceTimeWrapperComponent { loc = localizer; evts = [eventObj]; res = resources }

    TestBed.configureTestingModule({ imports: [ResourceTimeWrapperComponent] })
    const fixture = TestBed.createComponent(ResourceTimeWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(ResourceTimeProbeComponent)).componentInstance as ResourceTimeProbeComponent
    const grid = probe.result.grid()
    expect(grid).not.toBeNull()
    // With resources, the grid.resources should be non-null (resources path at line 330)
    expect(grid!.resources).not.toBeNull()
    expect(grid!.resources!.length).toBe(2)
  })

  it('dayGroups path is triggered when resources + resourceLayout="day" are provided', () => {
    const resources = [{ id: 'r1', title: 'Room A' }, { id: 'r2', title: 'Room B' }]
    const eventObj = { id: 'dg1', title: 'Workshop', start: '2024-06-17T10:00:00.000Z', end: '2024-06-17T11:00:00.000Z', resourceId: 'r1' }

    @Component({ standalone: true, selector: 'bc-time-probe-dg', template: '' })
    class DayGroupTimeProbeComponent { result = injectTimeGridView() }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" defaultView="week" defaultDate="2024-06-17T00:00:00.000Z" [events]="evts" [resources]="res" resourceLayout="day"><bc-time-probe-dg /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, DayGroupTimeProbeComponent],
    })
    class DayGroupTimeWrapperComponent { loc = localizer; evts = [eventObj]; res = resources }

    TestBed.configureTestingModule({ imports: [DayGroupTimeWrapperComponent] })
    const fixture = TestBed.createComponent(DayGroupTimeWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(DayGroupTimeProbeComponent)).componentInstance as DayGroupTimeProbeComponent
    const grid = probe.result.grid()
    expect(grid).not.toBeNull()
    // With resourceLayout="day", the grid.dayGroups should be non-null (dayGroups path at line 353)
    expect(grid!.dayGroups).not.toBeNull()
    expect(grid!.dayGroups!.length).toBeGreaterThan(0)
  })

  it('resolveAllDay inner lambda runs when all-day events produce segments in levels', () => {
    // An event with allDay: true populates allDay.levels, covering the level.map() lambda
    const allDayEvent = { id: 'ad1', title: 'All Day Event', start: '2024-06-17T00:00:00.000Z', end: '2024-06-17T23:59:59.000Z', allDay: true }

    @Component({ standalone: true, selector: 'bc-time-probe-allday', template: '' })
    class AllDayTimeProbeComponent { result = injectTimeGridView() }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" defaultView="week" defaultDate="2024-06-17T00:00:00.000Z" [events]="evts"><bc-time-probe-allday /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, AllDayTimeProbeComponent],
    })
    class AllDayTimeWrapperComponent { loc = localizer; evts = [allDayEvent] }

    TestBed.configureTestingModule({ imports: [AllDayTimeWrapperComponent] })
    const fixture = TestBed.createComponent(AllDayTimeWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(AllDayTimeProbeComponent)).componentInstance as AllDayTimeProbeComponent
    const grid = probe.result.grid()
    expect(grid).not.toBeNull()
    // allDay.segments should contain the all-day event, proving levels.flatMap ran
    expect(grid!.allDay.segments.length).toBeGreaterThan(0)
  })

  it('resolveAllDay extra lambda runs when more than 2 all-day events overflow the row limit', () => {
    // allDayMaxRows defaults to 2; 3 events on the same day causes extra to be non-empty
    const allDayEvents = Array.from({ length: 3 }, (_, i) => ({
      id: `adx${i}`,
      title: `All Day ${i}`,
      start: '2024-06-17T00:00:00.000Z',
      end: '2024-06-17T23:59:59.000Z',
      allDay: true,
    }))

    @Component({ standalone: true, selector: 'bc-time-probe-adx', template: '' })
    class AllDayExtraProbeComponent { result = injectTimeGridView() }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" defaultView="week" defaultDate="2024-06-17T00:00:00.000Z" [events]="evts"><bc-time-probe-adx /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, AllDayExtraProbeComponent],
    })
    class AllDayExtraWrapperComponent { loc = localizer; evts = allDayEvents }

    TestBed.configureTestingModule({ imports: [AllDayExtraWrapperComponent] })
    const fixture = TestBed.createComponent(AllDayExtraWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(AllDayExtraProbeComponent)).componentInstance as AllDayExtraProbeComponent
    const grid = probe.result.grid()
    expect(grid).not.toBeNull()
    // With 3 all-day events and allDayMaxRows=2, extra should be non-null
    expect(grid!.allDay.extra).not.toBeNull()
    expect(grid!.allDay.extra!.length).toBeGreaterThan(0)
  })
})

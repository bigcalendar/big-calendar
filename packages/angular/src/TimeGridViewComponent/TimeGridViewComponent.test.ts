import { Views } from '@big-calendar/core'
import type { LocalizerContract, ViewKey } from '@big-calendar/core'
import { Component, input } from '@angular/core'
import { By } from '@angular/platform-browser'
import { TestBed } from '@angular/core/testing'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { CalendarProviderComponent } from '../CalendarProvider/CalendarProviderComponent'
import { TimeGridViewComponent } from './TimeGridViewComponent'

@Component({
  standalone: true,
  selector: 'bc-timegrid-wrapper',
  template: `
    <bc-calendar-provider [localizer]="localizer()" [defaultView]="defaultView()">
      <bc-time-grid-view />
    </bc-calendar-provider>
  `,
  imports: [CalendarProviderComponent, TimeGridViewComponent],
})
class TimeGridWrapperComponent {
  readonly localizer = input.required<LocalizerContract>()
  readonly defaultView = input<ViewKey>()
}

function createWrapper(localizer: LocalizerContract, defaultView?: ViewKey) {
  TestBed.configureTestingModule({ imports: [TimeGridWrapperComponent] })
  const fixture = TestBed.createComponent(TimeGridWrapperComponent)
  fixture.componentRef.setInput('localizer', localizer)
  if (defaultView !== undefined) fixture.componentRef.setInput('defaultView', defaultView)
  fixture.detectChanges()
  return fixture
}

describe.each(LOCALIZER_CASES)('TimeGridViewComponent [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('renders nothing when active view is month', () => {
    const fixture = createWrapper(localizer, Views.MONTH)
    expect(fixture.nativeElement.querySelector('.bc-time-grid')).toBeNull()
  })

  it('renders the time grid root when active view is week', () => {
    const fixture = createWrapper(localizer, Views.WEEK)
    expect(fixture.nativeElement.querySelector('.bc-time-grid')).not.toBeNull()
  })

  it('renders the time grid root when active view is day', () => {
    const fixture = createWrapper(localizer, Views.DAY)
    expect(fixture.nativeElement.querySelector('.bc-time-grid')).not.toBeNull()
  })

  it('renders the header section for week view', () => {
    const fixture = createWrapper(localizer, Views.WEEK)
    expect(fixture.nativeElement.querySelector('.bc-time-head')).not.toBeNull()
  })

  it('renders 7 day column headings for week view', () => {
    const fixture = createWrapper(localizer, Views.WEEK)
    const headings = fixture.nativeElement.querySelectorAll('[role="columnheader"]')
    expect(headings.length).toBe(7)
  })

  it('renders 1 day column heading for day view', () => {
    const fixture = createWrapper(localizer, Views.DAY)
    const headings = fixture.nativeElement.querySelectorAll('[role="columnheader"]')
    expect(headings.length).toBe(1)
  })

  it('renders the time body section', () => {
    const fixture = createWrapper(localizer, Views.WEEK)
    expect(fixture.nativeElement.querySelector('.bc-time-body')).not.toBeNull()
  })

  it('renders the time gutter', () => {
    const fixture = createWrapper(localizer, Views.WEEK)
    expect(fixture.nativeElement.querySelector('.bc-time-gutter')).not.toBeNull()
  })

  it('renders time columns matching day count', () => {
    const fixture = createWrapper(localizer, Views.WEEK)
    const columns = fixture.nativeElement.querySelectorAll('.bc-day-column')
    expect(columns.length).toBe(7)
  })

  it('leafColumnCount returns 1 when grid is null (month view)', () => {
    const fixture = createWrapper(localizer, Views.MONTH)
    const comp = fixture.debugElement
      .query(By.directive(TimeGridViewComponent))
      .componentInstance as TimeGridViewComponent
    expect(comp.leafColumnCount()).toBe(1)
  })

  it('leafColumnCount returns the column count for a plain week view', () => {
    const fixture = createWrapper(localizer, Views.WEEK)
    const comp = fixture.debugElement
      .query(By.directive(TimeGridViewComponent))
      .componentInstance as TimeGridViewComponent
    expect(comp.leafColumnCount()).toBe(7)
  })

  it('leafColumnCount returns 5 for work_week view', () => {
    const fixture = createWrapper(localizer, Views.WORK_WEEK)
    const comp = fixture.debugElement
      .query(By.directive(TimeGridViewComponent))
      .componentInstance as TimeGridViewComponent
    expect(comp.leafColumnCount()).toBe(5)
  })

  it('leafColumnCount with dayGroups returns sum of all cell lengths', () => {
    const fixture = createWrapper(localizer, Views.MONTH)
    const comp = fixture.debugElement
      .query(By.directive(TimeGridViewComponent))
      .componentInstance as TimeGridViewComponent
    const fakeGrid = {
      dayGroups: [{ cells: [{}, {}] }, { cells: [{}] }],
      resources: null,
      columns: [],
      headings: [],
      gutter: [],
      allDayRows: [],
      allDayBands: null,
    }
    const origGrid = comp.state.grid
    // Temporarily replace the grid signal with one that returns a fake dayGroups grid
    vi.spyOn(comp.state, 'grid').mockReturnValue(fakeGrid as never)
    expect(comp.leafColumnCount()).toBe(3)
    vi.restoreAllMocks()
    comp.state.grid = origGrid
  })

  it('leafColumnCount with resources returns sum of all column lengths', () => {
    const fixture = createWrapper(localizer, Views.MONTH)
    const comp = fixture.debugElement
      .query(By.directive(TimeGridViewComponent))
      .componentInstance as TimeGridViewComponent
    const fakeGrid = {
      dayGroups: null,
      resources: [{ columns: [{}, {}] }, { columns: [{}] }],
      columns: [],
      headings: [],
      gutter: [],
      allDayRows: [],
      allDayBands: null,
    }
    const origGrid = comp.state.grid
    vi.spyOn(comp.state, 'grid').mockReturnValue(fakeGrid as never)
    expect(comp.leafColumnCount()).toBe(3)
    vi.restoreAllMocks()
    comp.state.grid = origGrid
  })
})

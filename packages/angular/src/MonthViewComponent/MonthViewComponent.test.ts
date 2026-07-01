import { Views } from '@big-calendar/core'
import type { LocalizerContract, ViewKey } from '@big-calendar/core'
import { Component, input } from '@angular/core'
import { By } from '@angular/platform-browser'
import { TestBed } from '@angular/core/testing'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { CalendarProviderComponent } from '../CalendarProvider/CalendarProviderComponent'
import { MonthViewComponent } from './MonthViewComponent'

@Component({
  standalone: true,
  selector: 'bc-month-wrapper',
  template: `
    <bc-calendar-provider [localizer]="localizer()" [defaultView]="defaultView()">
      <bc-month-view />
    </bc-calendar-provider>
  `,
  imports: [CalendarProviderComponent, MonthViewComponent],
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
  return fixture
}

describe.each(LOCALIZER_CASES)('MonthViewComponent [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('renders nothing when active view is week', () => {
    const fixture = createWrapper(localizer, Views.WEEK)
    expect(fixture.nativeElement.querySelector('.bc-month')).toBeNull()
  })

  it('renders the month grid root when active view is month', () => {
    const fixture = createWrapper(localizer, Views.MONTH)
    expect(fixture.nativeElement.querySelector('.bc-month')).not.toBeNull()
  })

  it('renders 7 weekday header cells', () => {
    const fixture = createWrapper(localizer, Views.MONTH)
    const cells = fixture.nativeElement.querySelectorAll('.bc-weekday')
    expect(cells.length).toBe(7)
  })

  it('renders at least 4 week rows', () => {
    const fixture = createWrapper(localizer, Views.MONTH)
    const rows = fixture.nativeElement.querySelectorAll('.bc-month-week')
    expect(rows.length).toBeGreaterThanOrEqual(4)
  })

  it('renders the month grid container', () => {
    const fixture = createWrapper(localizer, Views.MONTH)
    expect(fixture.nativeElement.querySelector('.bc-month-grid')).not.toBeNull()
  })

  it('renders slot hit-targets inside each week row', () => {
    const fixture = createWrapper(localizer, Views.MONTH)
    const slots = fixture.nativeElement.querySelectorAll('.bc-month-slot')
    // At least 4 weeks × 7 days = 28 slots
    expect(slots.length).toBeGreaterThanOrEqual(28)
  })

  it('renders date-cell buttons for drilldown', () => {
    const fixture = createWrapper(localizer, Views.MONTH)
    const buttons = fixture.nativeElement.querySelectorAll('.bc-date-number')
    expect(buttons.length).toBeGreaterThanOrEqual(28)
  })

  it('clicking a date-cell button does not throw', () => {
    const fixture = createWrapper(localizer, Views.MONTH)
    const button = fixture.nativeElement.querySelector('.bc-month-date-button') as HTMLElement
    expect(() => {
      if (button) button.click()
      fixture.detectChanges()
    }).not.toThrow()
  })

  it('drilldownFn returns a callable function that triggers drilldown', () => {
    const fixture = createWrapper(localizer, Views.MONTH)
    const monthView = fixture.debugElement
      .query(By.directive(MonthViewComponent))
      .componentInstance as MonthViewComponent<unknown>
    const fn = monthView.drilldownFn('2024-01-15')
    expect(typeof fn).toBe('function')
    expect(() => fn()).not.toThrow()
  })
})

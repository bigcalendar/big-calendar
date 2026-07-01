import { Views } from '@big-calendar/core'
import type { LocalizerContract, ViewKey } from '@big-calendar/core'
import { Component, input } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { CalendarProviderComponent } from '../CalendarProvider/CalendarProviderComponent'
import { CalendarComponent } from './CalendarComponent'

@Component({
  standalone: true,
  selector: 'bc-calendar-wrapper',
  template: `
    <bc-calendar-provider [localizer]="localizer()" [defaultView]="defaultView()">
      <bc-calendar [toolbar]="showToolbar()" />
    </bc-calendar-provider>
  `,
  imports: [CalendarProviderComponent, CalendarComponent],
})
class CalendarWrapperComponent {
  readonly localizer = input.required<LocalizerContract>()
  readonly defaultView = input<ViewKey>()
  readonly showToolbar = input(true)
}

function createWrapper(localizer: LocalizerContract, defaultView?: ViewKey, showToolbar = true) {
  TestBed.configureTestingModule({ imports: [CalendarWrapperComponent] })
  const fixture = TestBed.createComponent(CalendarWrapperComponent)
  fixture.componentRef.setInput('localizer', localizer)
  if (defaultView !== undefined) fixture.componentRef.setInput('defaultView', defaultView)
  fixture.componentRef.setInput('showToolbar', showToolbar)
  fixture.detectChanges()
  return fixture
}

describe.each(LOCALIZER_CASES)('CalendarComponent [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('renders the calendar container', () => {
    const fixture = createWrapper(localizer, Views.MONTH)
    expect(fixture.nativeElement.querySelector('.bc-calendar')).not.toBeNull()
  })

  it('renders the toolbar by default', () => {
    const fixture = createWrapper(localizer, Views.MONTH)
    expect(fixture.nativeElement.querySelector('.bc-toolbar')).not.toBeNull()
  })

  it('hides the toolbar when toolbar=false', () => {
    const fixture = createWrapper(localizer, Views.MONTH, false)
    expect(fixture.nativeElement.querySelector('.bc-toolbar')).toBeNull()
  })

  it('shows the month grid when defaultView is month', () => {
    const fixture = createWrapper(localizer, Views.MONTH)
    expect(fixture.nativeElement.querySelector('.bc-month')).not.toBeNull()
  })

  it('shows the time grid when defaultView is week', () => {
    const fixture = createWrapper(localizer, Views.WEEK)
    expect(fixture.nativeElement.querySelector('.bc-time-grid')).not.toBeNull()
  })

  it('shows the agenda when defaultView is agenda', () => {
    const fixture = createWrapper(localizer, Views.AGENDA)
    expect(fixture.nativeElement.querySelector('.bc-agenda')).not.toBeNull()
  })

  it('does not show month grid when defaultView is week', () => {
    const fixture = createWrapper(localizer, Views.WEEK)
    expect(fixture.nativeElement.querySelector('.bc-month')).toBeNull()
  })
})

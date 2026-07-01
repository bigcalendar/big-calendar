import { Views } from '@big-calendar/core'
import type { LocalizerContract, ViewKey } from '@big-calendar/core'
import { Component, input } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { CalendarProviderComponent } from '../CalendarProvider/CalendarProviderComponent'
import { AgendaViewComponent } from './AgendaViewComponent'

@Component({
  standalone: true,
  selector: 'bc-agenda-wrapper',
  template: `
    <bc-calendar-provider [localizer]="localizer()" [defaultView]="defaultView()" [defaultDate]="defaultDate()" [events]="events()">
      <bc-agenda-view />
    </bc-calendar-provider>
  `,
  imports: [CalendarProviderComponent, AgendaViewComponent],
})
class AgendaWrapperComponent {
  readonly localizer = input.required<LocalizerContract>()
  readonly defaultView = input<ViewKey>()
  readonly defaultDate = input<string>()
  readonly events = input<unknown[]>([])
}

function createWrapper(localizer: LocalizerContract, defaultView?: ViewKey, events: unknown[] = [], defaultDate?: string) {
  TestBed.configureTestingModule({ imports: [AgendaWrapperComponent] })
  const fixture = TestBed.createComponent(AgendaWrapperComponent)
  fixture.componentRef.setInput('localizer', localizer)
  if (defaultView !== undefined) fixture.componentRef.setInput('defaultView', defaultView)
  if (defaultDate !== undefined) fixture.componentRef.setInput('defaultDate', defaultDate)
  fixture.componentRef.setInput('events', events)
  fixture.detectChanges()
  return fixture
}

describe.each(LOCALIZER_CASES)('AgendaViewComponent [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('renders nothing when active view is month', () => {
    const fixture = createWrapper(localizer, Views.MONTH)
    expect(fixture.nativeElement.querySelector('.bc-agenda')).toBeNull()
  })

  it('renders the agenda root when active view is agenda', () => {
    const fixture = createWrapper(localizer, Views.AGENDA)
    expect(fixture.nativeElement.querySelector('.bc-agenda')).not.toBeNull()
  })

  it('renders three column heading cells', () => {
    const fixture = createWrapper(localizer, Views.AGENDA)
    expect(fixture.nativeElement.querySelector('.bc-agenda-header')).not.toBeNull()
    const cells = fixture.nativeElement.querySelectorAll('.bc-agenda-heading')
    expect(cells.length).toBe(3)
  })

  it('renders the empty-state when no events', () => {
    const fixture = createWrapper(localizer, Views.AGENDA)
    expect(fixture.nativeElement.querySelector('.bc-agenda-empty')).not.toBeNull()
  })

  it('renders event body when events are present', () => {
    const events = [{ id: '1', title: 'Test Event', start: '2025-06-15T10:00:00.000Z', end: '2025-06-15T11:00:00.000Z' }]
    const fixture = createWrapper(localizer, Views.AGENDA, events, '2025-06-15T00:00:00.000Z')
    expect(fixture.nativeElement.querySelector('.bc-agenda-body')).not.toBeNull()
    expect(fixture.nativeElement.querySelector('.bc-agenda-empty')).toBeNull()
  })
})

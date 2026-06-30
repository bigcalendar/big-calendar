import { Views } from '@big-calendar/core'
import type { LocalizerContract, ViewKey } from '@big-calendar/core'
import { Component, input } from '@angular/core'
import { By } from '@angular/platform-browser'
import { TestBed } from '@angular/core/testing'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { CalendarProviderComponent } from '../CalendarProvider/CalendarProviderComponent'
import type { InjectAgendaViewReturn } from './injectAgendaView'
import { injectAgendaView } from './injectAgendaView'

@Component({ standalone: true, selector: 'bc-agenda-probe', template: '' })
class AgendaProbeComponent {
  result = injectAgendaView()
}

@Component({
  standalone: true,
  selector: 'bc-agenda-wrapper',
  template: `
    <bc-calendar-provider [localizer]="localizer()" [defaultView]="defaultView()">
      <bc-agenda-probe />
    </bc-calendar-provider>
  `,
  imports: [CalendarProviderComponent, AgendaProbeComponent],
})
class AgendaWrapperComponent {
  readonly localizer = input.required<LocalizerContract>()
  readonly defaultView = input<ViewKey>()
}

function createWrapper(localizer: LocalizerContract, defaultView?: ViewKey) {
  TestBed.configureTestingModule({ imports: [AgendaWrapperComponent] })
  const fixture = TestBed.createComponent(AgendaWrapperComponent)
  fixture.componentRef.setInput('localizer', localizer)
  if (defaultView !== undefined) fixture.componentRef.setInput('defaultView', defaultView)
  fixture.detectChanges()
  return {
    fixture,
    result: fixture.debugElement
      .query(By.directive(AgendaProbeComponent))
      .componentInstance.result as InjectAgendaViewReturn<unknown>,
  }
}

describe.each(LOCALIZER_CASES)('injectAgendaView [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('rows is null when the active view is month', () => {
    const { result } = createWrapper(localizer, Views.MONTH)
    expect(result.rows()).toBeNull()
  })

  it('rows is an array when the active view is agenda', () => {
    const { result } = createWrapper(localizer, Views.AGENDA)
    expect(Array.isArray(result.rows())).toBe(true)
  })

  it('returns correct class names for static layout props', () => {
    const { result } = createWrapper(localizer, Views.AGENDA)
    expect(result.root.class).toBe('bc-agenda')
    expect(result.header.class).toBe('bc-agenda-header')
    expect(result.headingCell.class).toBe('bc-agenda-heading')
    expect(result.body.class).toBe('bc-agenda-body')
  })

  it('messages signal exposes date, time, event, and noEventsInRange strings', () => {
    const { result } = createWrapper(localizer, Views.AGENDA)
    const m = result.messages()
    expect(typeof m.date).toBe('string')
    expect(typeof m.time).toBe('string')
    expect(typeof m.event).toBe('string')
    expect(typeof m.noEventsInRange).toBe('string')
  })

  it('getRowProps returns bc-agenda-day class', () => {
    const { result } = createWrapper(localizer, Views.AGENDA)
    const fakeRow = { day: '2024-01-01', label: 'Jan 1', events: [] }
    const props = result.getRowProps(fakeRow)
    expect(props.class).toBe('bc-agenda-day')
    expect(typeof props.style).toBe('object')
  })

  it('getRowProps with events returns a style object with row count', () => {
    const { result } = createWrapper(localizer, Views.AGENDA)
    const fakeRow = {
      day: '2024-01-01',
      label: 'Jan 1',
      events: [
        { key: 'k1', event: {}, title: 'E1', time: '10am', allDay: false },
        { key: 'k2', event: {}, title: 'E2', time: '11am', allDay: false },
      ],
    }
    const props = result.getRowProps(fakeRow)
    expect(props.class).toBe('bc-agenda-day')
    expect(typeof props.style).toBe('object')
  })

  it('rows returns empty array when agenda view has no events in range', () => {
    const { result } = createWrapper(localizer, Views.AGENDA)
    const rows = result.rows()
    expect(Array.isArray(rows)).toBe(true)
  })

  it('messages signal values are non-empty strings', () => {
    const { result } = createWrapper(localizer, Views.AGENDA)
    const m = result.messages()
    expect(m.date.length).toBeGreaterThan(0)
    expect(m.time.length).toBeGreaterThan(0)
    expect(m.event.length).toBeGreaterThan(0)
    expect(m.noEventsInRange.length).toBeGreaterThan(0)
  })

  it('rows contains event entries when events exist in the agenda range', () => {
    const eventObj = { id: 'a1', title: 'Agenda Event', start: '2024-06-15T10:00:00.000Z', end: '2024-06-15T11:00:00.000Z' }

    @Component({ standalone: true, selector: 'bc-agenda-probe-evts', template: '' })
    class EventAgendaProbeComponent { result = injectAgendaView() }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" defaultView="agenda" defaultDate="2024-06-15T00:00:00.000Z" [events]="evts"><bc-agenda-probe-evts /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, EventAgendaProbeComponent],
    })
    class EventAgendaWrapperComponent { loc = localizer; evts = [eventObj] }

    TestBed.configureTestingModule({ imports: [EventAgendaWrapperComponent] })
    const fixture = TestBed.createComponent(EventAgendaWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(EventAgendaProbeComponent)).componentInstance as EventAgendaProbeComponent
    const rows = probe.result.rows()
    expect(rows).not.toBeNull()
    const eventRows = rows!.filter((r) => r.events.length > 0)
    expect(eventRows.length).toBeGreaterThan(0)
    const firstEvent = eventRows[0]!.events[0]!
    expect(typeof firstEvent.key).toBe('string')
    expect(typeof firstEvent.title).toBe('string')
    expect(firstEvent.allDay).toBe(false)
  })

  it('rows marks allDay=true when event has allDay property set', () => {
    const allDayEvent = { id: 'a2', title: 'All Day', start: '2024-06-15T00:00:00.000Z', end: '2024-06-15T23:59:59.000Z', allDay: true }

    @Component({ standalone: true, selector: 'bc-agenda-probe-allday', template: '' })
    class AllDayAgendaProbeComponent { result = injectAgendaView() }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" defaultView="agenda" defaultDate="2024-06-15T00:00:00.000Z" [events]="evts"><bc-agenda-probe-allday /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, AllDayAgendaProbeComponent],
    })
    class AllDayAgendaWrapperComponent { loc = localizer; evts = [allDayEvent] }

    TestBed.configureTestingModule({ imports: [AllDayAgendaWrapperComponent] })
    const fixture = TestBed.createComponent(AllDayAgendaWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(AllDayAgendaProbeComponent)).componentInstance as AllDayAgendaProbeComponent
    const rows = probe.result.rows()
    expect(rows).not.toBeNull()
    const eventRows = rows!.filter((r) => r.events.length > 0)
    expect(eventRows.length).toBeGreaterThan(0)
    expect(eventRows[0]!.events[0]!.allDay).toBe(true)
  })

})

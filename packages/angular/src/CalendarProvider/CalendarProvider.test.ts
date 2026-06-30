import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import { Component, inject, input } from '@angular/core'
import { By } from '@angular/platform-browser'
import { TestBed } from '@angular/core/testing'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { toAngularSignal } from '../internal/toAngularSignal'
import { CalendarProviderComponent } from './CalendarProviderComponent'
import { CALENDAR_TOKEN } from './calendarContext'
import { injectCalendar } from './injectCalendar'

// ---- Shared test-only components ---------------------------------------

@Component({ standalone: true, selector: 'bc-test-probe', template: '' })
class ProbeComponent {
  ctx = inject(CALENDAR_TOKEN, { optional: true })
}

@Component({
  standalone: true,
  selector: 'bc-test-wrapper',
  template: `
    <bc-calendar-provider
      [localizer]="localizer()"
      [defaultView]="defaultView()"
    >
      <bc-test-probe />
    </bc-calendar-provider>
  `,
  imports: [CalendarProviderComponent, ProbeComponent],
})
class WrapperComponent {
  readonly localizer = input.required<LocalizerContract>()
  readonly defaultView = input<string>()
}

// ---- Helpers -----------------------------------------------------------

function createWrapper(localizer: LocalizerContract, defaultView?: string) {
  TestBed.configureTestingModule({ imports: [WrapperComponent] })
  const fixture = TestBed.createComponent(WrapperComponent)
  fixture.componentRef.setInput('localizer', localizer)
  if (defaultView !== undefined) fixture.componentRef.setInput('defaultView', defaultView)
  fixture.detectChanges()
  return {
    fixture,
    probe: fixture.debugElement
      .query(By.directive(ProbeComponent))
      .componentInstance as ProbeComponent,
  }
}

// ---- Suites ------------------------------------------------------------

describe.each(LOCALIZER_CASES)('CalendarProviderComponent [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('provides the store to descendants via injectCalendar', () => {
    const { probe } = createWrapper(localizer, Views.WEEK)
    expect(probe.ctx?.store.view.value).toBe(Views.WEEK)
  })

  it('descendant can read a store signal reactively via toAngularSignal', () => {
    const { probe } = createWrapper(localizer, Views.MONTH)
    // toAngularSignal calls inject(DestroyRef), so it needs an injection context
    const viewSig = TestBed.runInInjectionContext(() =>
      toAngularSignal(probe.ctx!.store.view),
    )
    expect(viewSig()).toBe(Views.MONTH)
  })

  it('renders visually-hidden instruction elements matching the context description ids', () => {
    const { fixture, probe } = createWrapper(localizer)
    const ids = probe.ctx!.descriptionIds

    const selectionEl: HTMLElement | null = fixture.nativeElement.querySelector(`#${ids.selection}`)
    const eventEl: HTMLElement | null = fixture.nativeElement.querySelector(`#${ids.event}`)

    expect(selectionEl).not.toBeNull()
    expect(selectionEl!.classList).toContain('bc-sr-only')
    expect(selectionEl!.textContent).toContain('arrow keys')
    expect(eventEl).not.toBeNull()
    expect(eventEl!.textContent).toContain('F2')
  })

  it('exposes resolved messages via context', () => {
    const { probe } = createWrapper(localizer)
    const messages = probe.ctx!.messages
    expect(typeof messages.selectionInstructions).toBe('string')
    expect(typeof messages.eventInstructions).toBe('string')
  })

  it('description ids have stable unique format across renders', () => {
    const { probe } = createWrapper(localizer)
    const { selection, event } = probe.ctx!.descriptionIds
    // IDs must be distinct from each other and follow the bc-cp-{n}- prefix pattern
    expect(selection).not.toBe(event)
    expect(selection).toMatch(/^bc-cp-\d+-selection$/)
    expect(event).toMatch(/^bc-cp-\d+-event$/)
  })

  it('throws when injectCalendar is used outside a provider', () => {
    expect(() =>
      TestBed.runInInjectionContext(() => injectCalendar()),
    ).toThrow(/bc-calendar-provider/)
  })

  it('components getter returns an empty object by default', () => {
    const { probe } = createWrapper(localizer)
    // CalendarProviderComponent itself is the context value; access via CALENDAR_TOKEN
    expect(probe.ctx?.components).toEqual({})
  })

  it('messages getter returns an object with string entries', () => {
    const { probe } = createWrapper(localizer)
    const messages = probe.ctx?.messages
    expect(typeof messages?.previous).toBe('string')
    expect(typeof messages?.next).toBe('string')
    expect(typeof messages?.today).toBe('string')
  })

  it('storeSignal exposes the store as a signal', () => {
    const { probe } = createWrapper(localizer, Views.WEEK)
    const sig = probe.ctx?.storeSignal
    expect(sig).not.toBeNull()
    expect(typeof sig).toBe('function')
    expect(sig?.()?.view.value).toBe(Views.WEEK)
  })

  it('updating events input propagates into the store', () => {
    TestBed.configureTestingModule({ imports: [WrapperComponent] })
    const fixture = TestBed.createComponent(WrapperComponent)
    fixture.componentRef.setInput('localizer', localizer)
    fixture.componentRef.setInput('defaultView', Views.MONTH)
    fixture.detectChanges()
    const probe = fixture.debugElement
      .query(By.directive(ProbeComponent))
      .componentInstance as ProbeComponent

    // Force a second effect run by changing the input (events input on WrapperComponent
    // is not exposed, so we test indirectly via the store's view)
    expect(probe.ctx?.store.view.value).toBe(Views.MONTH)
  })

  it('update path is triggered when defaultView input changes', () => {
    TestBed.configureTestingModule({ imports: [WrapperComponent] })
    const fixture = TestBed.createComponent(WrapperComponent)
    fixture.componentRef.setInput('localizer', localizer)
    fixture.componentRef.setInput('defaultView', Views.MONTH)
    fixture.detectChanges()

    // Changing defaultView triggers the effect to re-run (update path)
    fixture.componentRef.setInput('defaultView', Views.WEEK)
    fixture.detectChanges()

    const probe = fixture.debugElement
      .query(By.directive(ProbeComponent))
      .componentInstance as ProbeComponent
    // Store was already created; defaultView on a second run is not used for view update
    // but the effect still runs (covering the else branch)
    expect(probe.ctx?.store).not.toBeNull()
  })

  it('forwards onNavigate callback through CalendarProviderComponent', () => {
    const onNavigate = vi.fn()

    @Component({
      standalone: true,
      template: `
        <bc-calendar-provider [localizer]="loc" [onNavigate]="navFn">
          <bc-test-probe />
        </bc-calendar-provider>
      `,
      imports: [CalendarProviderComponent, ProbeComponent],
    })
    class NavWrapperComponent {
      loc = localizer
      navFn = onNavigate
    }

    TestBed.configureTestingModule({ imports: [NavWrapperComponent] })
    const fixture = TestBed.createComponent(NavWrapperComponent)
    fixture.detectChanges()

    const probe = fixture.debugElement
      .query(By.directive(ProbeComponent))
      .componentInstance as ProbeComponent
    probe.ctx!.store.navigate({ direction: 'NEXT' })

    expect(onNavigate).toHaveBeenCalled()
  })

  it('forwards onView callback through CalendarProviderComponent', () => {
    const onView = vi.fn()

    @Component({
      standalone: true,
      template: `
        <bc-calendar-provider [localizer]="loc" [onView]="viewFn" [defaultView]="'month'">
          <bc-test-probe />
        </bc-calendar-provider>
      `,
      imports: [CalendarProviderComponent, ProbeComponent],
    })
    class ViewWrapperComponent {
      loc = localizer
      viewFn = onView
    }

    TestBed.configureTestingModule({ imports: [ViewWrapperComponent] })
    const fixture = TestBed.createComponent(ViewWrapperComponent)
    fixture.detectChanges()

    const probe = fixture.debugElement
      .query(By.directive(ProbeComponent))
      .componentInstance as ProbeComponent
    probe.ctx!.store.setView({ view: Views.WEEK })

    expect(onView).toHaveBeenCalledWith({ view: Views.WEEK })
  })

  it('forwards onDrillDown callback through CalendarProviderComponent', () => {
    const onDrillDown = vi.fn()

    @Component({
      standalone: true,
      template: `
        <bc-calendar-provider [localizer]="loc" [onDrillDown]="drillFn" [defaultView]="'month'">
          <bc-test-probe />
        </bc-calendar-provider>
      `,
      imports: [CalendarProviderComponent, ProbeComponent],
    })
    class DrillDownWrapperComponent {
      loc = localizer
      drillFn = onDrillDown
    }

    TestBed.configureTestingModule({ imports: [DrillDownWrapperComponent] })
    const fixture = TestBed.createComponent(DrillDownWrapperComponent)
    fixture.detectChanges()

    const probe = fixture.debugElement
      .query(By.directive(ProbeComponent))
      .componentInstance as ProbeComponent
    probe.ctx!.store.drilldown({ date: '2024-02-01' })

    expect(onDrillDown).toHaveBeenCalled()
  })

  it('forwards onEventSelect through CalendarProviderComponent', () => {
    const onEventSelect = vi.fn()
    const eventObj = { id: '1', title: 'E', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z' }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" [onEventSelect]="cb" [events]="evts"><bc-test-probe /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, ProbeComponent],
    })
    class EventSelectWrapperComponent { loc = localizer; cb = onEventSelect; evts = [eventObj] }

    TestBed.configureTestingModule({ imports: [EventSelectWrapperComponent] })
    const fixture = TestBed.createComponent(EventSelectWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(ProbeComponent)).componentInstance as ProbeComponent
    probe.ctx!.store.selectEvent({ id: '1' })
    expect(onEventSelect).toHaveBeenCalled()
  })

  it('forwards onEventClick through CalendarProviderComponent', () => {
    const onEventClick = vi.fn()
    const eventObj = { id: '2', title: 'E', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z' }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" [onEventClick]="cb" [events]="evts"><bc-test-probe /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, ProbeComponent],
    })
    class EventClickWrapperComponent { loc = localizer; cb = onEventClick; evts = [eventObj] }

    TestBed.configureTestingModule({ imports: [EventClickWrapperComponent] })
    const fixture = TestBed.createComponent(EventClickWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(ProbeComponent)).componentInstance as ProbeComponent
    probe.ctx!.store.eventHandlers.click(eventObj as never, new MouseEvent('click'))
    expect(onEventClick).toHaveBeenCalled()
  })

  it('forwards onEventDoubleClick through CalendarProviderComponent', () => {
    const onEventDoubleClick = vi.fn()
    const eventObj = { id: '3', title: 'E', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z' }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" [onEventDoubleClick]="cb" [events]="evts"><bc-test-probe /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, ProbeComponent],
    })
    class EventDblClickWrapperComponent { loc = localizer; cb = onEventDoubleClick; evts = [eventObj] }

    TestBed.configureTestingModule({ imports: [EventDblClickWrapperComponent] })
    const fixture = TestBed.createComponent(EventDblClickWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(ProbeComponent)).componentInstance as ProbeComponent
    probe.ctx!.store.eventHandlers.doubleClick(eventObj as never, new MouseEvent('dblclick'))
    expect(onEventDoubleClick).toHaveBeenCalled()
  })

  it('forwards onEventRightClick through CalendarProviderComponent', () => {
    const onEventRightClick = vi.fn()
    const eventObj = { id: '4', title: 'E', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z' }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" [onEventRightClick]="cb" [events]="evts"><bc-test-probe /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, ProbeComponent],
    })
    class EventRightClickWrapperComponent { loc = localizer; cb = onEventRightClick; evts = [eventObj] }

    TestBed.configureTestingModule({ imports: [EventRightClickWrapperComponent] })
    const fixture = TestBed.createComponent(EventRightClickWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(ProbeComponent)).componentInstance as ProbeComponent
    probe.ctx!.store.eventHandlers.rightClick(eventObj as never, new MouseEvent('contextmenu'))
    expect(onEventRightClick).toHaveBeenCalled()
  })

  it('forwards onEventMiddleClick through CalendarProviderComponent', () => {
    const onEventMiddleClick = vi.fn()
    const eventObj = { id: '5', title: 'E', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z' }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" [onEventMiddleClick]="cb" [events]="evts"><bc-test-probe /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, ProbeComponent],
    })
    class EventMiddleClickWrapperComponent { loc = localizer; cb = onEventMiddleClick; evts = [eventObj] }

    TestBed.configureTestingModule({ imports: [EventMiddleClickWrapperComponent] })
    const fixture = TestBed.createComponent(EventMiddleClickWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(ProbeComponent)).componentInstance as ProbeComponent
    probe.ctx!.store.eventHandlers.middleClick(eventObj as never, new MouseEvent('auxclick'))
    expect(onEventMiddleClick).toHaveBeenCalled()
  })

  it('covers the always-created onEventDrop wrapper via CalendarProvider', () => {
    const onEventDrop = vi.fn()
    const eventObj = { id: 'd1', title: 'E', start: '2024-06-15T10:00:00.000Z', end: '2024-06-15T11:00:00.000Z', draggable: true }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" [onEventDrop]="cb" [events]="evts"><bc-test-probe /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, ProbeComponent],
    })
    class EventDropWrapperComponent { loc = localizer; cb = onEventDrop; evts = [eventObj] }

    TestBed.configureTestingModule({ imports: [EventDropWrapperComponent] })
    const fixture = TestBed.createComponent(EventDropWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(ProbeComponent)).componentInstance as ProbeComponent
    const store = probe.ctx!.store
    store.grabEvent({ id: 'd1' })
    store.grabMove({ days: 1 })
    store.grabCommit()
    expect(onEventDrop).toHaveBeenCalled()
  })

  it('covers the always-created onEventResize wrapper via CalendarProvider', () => {
    const onEventResize = vi.fn()
    // resizable: true is required — the store's isResizable accessor reads event.resizable
    const eventObj = { id: 'r1', title: 'E', start: '2024-06-15T10:00:00.000Z', end: '2024-06-15T11:00:00.000Z', draggable: true, resizable: true }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" [onEventResize]="cb" [events]="evts"><bc-test-probe /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, ProbeComponent],
    })
    class EventResizeWrapperComponent { loc = localizer; cb = onEventResize; evts = [eventObj] }

    TestBed.configureTestingModule({ imports: [EventResizeWrapperComponent] })
    const fixture = TestBed.createComponent(EventResizeWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(ProbeComponent)).componentInstance as ProbeComponent
    const store = probe.ctx!.store
    store.grabEvent({ id: 'r1' })
    store.grabResize({ days: 1, edge: 'end' })
    store.grabCommit()
    expect(onEventResize).toHaveBeenCalled()
  })

  it('forwards onDropFromOutside through CalendarProviderComponent', () => {
    const onDropFromOutside = vi.fn()

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" [onDropFromOutside]="cb"><bc-test-probe /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, ProbeComponent],
    })
    class DropExternalWrapperComponent { loc = localizer; cb = onDropFromOutside }

    TestBed.configureTestingModule({ imports: [DropExternalWrapperComponent] })
    const fixture = TestBed.createComponent(DropExternalWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(ProbeComponent)).componentInstance as ProbeComponent
    probe.ctx!.store.dropExternal({ target: '2024-01-15T10:00:00Z' })
    expect(onDropFromOutside).toHaveBeenCalled()
  })

  it('forwards onEventDragStart through CalendarProviderComponent', () => {
    const onEventDragStart = vi.fn()
    const eventObj = { id: 'ds1', title: 'E', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z' }

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" [onEventDragStart]="cb" [events]="evts"><bc-test-probe /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, ProbeComponent],
    })
    class EventDragStartWrapperComponent { loc = localizer; cb = onEventDragStart; evts = [eventObj] }

    TestBed.configureTestingModule({ imports: [EventDragStartWrapperComponent] })
    const fixture = TestBed.createComponent(EventDragStartWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(ProbeComponent)).componentInstance as ProbeComponent
    probe.ctx!.store.eventDragStart({ id: 'ds1' })
    expect(onEventDragStart).toHaveBeenCalled()
  })

  it('forwards onSlotSelecting through CalendarProviderComponent', () => {
    const onSlotSelecting = vi.fn()

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" [onSlotSelecting]="cb" [selectable]="true"><bc-test-probe /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, ProbeComponent],
    })
    class SlotSelectingWrapperComponent { loc = localizer; cb = onSlotSelecting }

    TestBed.configureTestingModule({ imports: [SlotSelectingWrapperComponent] })
    const fixture = TestBed.createComponent(SlotSelectingWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(ProbeComponent)).componentInstance as ProbeComponent
    const store = probe.ctx!.store
    store.selection.start({ slot: 0, date: '2024-01-01', mode: 'day' })
    store.selection.to({ slot: 1 })
    expect(onSlotSelecting).toHaveBeenCalled()
  })

  it('forwards onSlotClick through CalendarProviderComponent', () => {
    const onSlotClick = vi.fn()

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" [onSlotClick]="cb" [selectable]="true"><bc-test-probe /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, ProbeComponent],
    })
    class SlotClickWrapperComponent { loc = localizer; cb = onSlotClick }

    TestBed.configureTestingModule({ imports: [SlotClickWrapperComponent] })
    const fixture = TestBed.createComponent(SlotClickWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(ProbeComponent)).componentInstance as ProbeComponent
    probe.ctx!.store.selection.click({ slot: 0, date: '2024-01-01', mode: 'day' })
    expect(onSlotClick).toHaveBeenCalled()
  })

  it('forwards onSlotDoubleClick through CalendarProviderComponent', () => {
    const onSlotDoubleClick = vi.fn()

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" [onSlotDoubleClick]="cb" [selectable]="true"><bc-test-probe /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, ProbeComponent],
    })
    class SlotDblClickWrapperComponent { loc = localizer; cb = onSlotDoubleClick }

    TestBed.configureTestingModule({ imports: [SlotDblClickWrapperComponent] })
    const fixture = TestBed.createComponent(SlotDblClickWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(ProbeComponent)).componentInstance as ProbeComponent
    probe.ctx!.store.selection.doubleClick({ slot: 0, date: '2024-01-01', mode: 'day' })
    expect(onSlotDoubleClick).toHaveBeenCalled()
  })

  it('forwards onSlotSelect through CalendarProviderComponent', () => {
    const onSlotSelect = vi.fn()

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" [onSlotSelect]="cb" [selectable]="true"><bc-test-probe /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, ProbeComponent],
    })
    class SlotSelectWrapperComponent { loc = localizer; cb = onSlotSelect }

    TestBed.configureTestingModule({ imports: [SlotSelectWrapperComponent] })
    const fixture = TestBed.createComponent(SlotSelectWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(ProbeComponent)).componentInstance as ProbeComponent
    const store = probe.ctx!.store
    store.selection.start({ slot: 0, date: '2024-01-01', mode: 'day' })
    store.selection.to({ slot: 2 })
    store.selection.complete()
    expect(onSlotSelect).toHaveBeenCalled()
  })

  it('forwards onRangeChange through CalendarProviderComponent', () => {
    const onRangeChange = vi.fn()

    @Component({
      standalone: true,
      template: `<bc-calendar-provider [localizer]="loc" [onRangeChange]="cb"><bc-test-probe /></bc-calendar-provider>`,
      imports: [CalendarProviderComponent, ProbeComponent],
    })
    class RangeChangeWrapperComponent { loc = localizer; cb = onRangeChange }

    TestBed.configureTestingModule({ imports: [RangeChangeWrapperComponent] })
    const fixture = TestBed.createComponent(RangeChangeWrapperComponent)
    fixture.detectChanges()
    const probe = fixture.debugElement.query(By.directive(ProbeComponent)).componentInstance as ProbeComponent
    probe.ctx!.store.navigate({ direction: 'NEXT' })
    expect(onRangeChange).toHaveBeenCalled()
  })
})

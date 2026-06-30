import { Views } from '@big-calendar/core'
import type { CalendarStore, LocalizerContract, ViewKey } from '@big-calendar/core'
import { Component, inject, input } from '@angular/core'
import { By } from '@angular/platform-browser'
import { TestBed } from '@angular/core/testing'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { CalendarProviderComponent } from '../CalendarProvider/CalendarProviderComponent'
import { CALENDAR_TOKEN } from '../CalendarProvider/calendarContext'
import { CalendarComponent } from '../CalendarComponent/CalendarComponent'
import { CalendarDndDirective } from './CalendarDndDirective'
import { CalendarDndService } from './CalendarDndService'

type AnyEvent = { id: string; title: string; start: string; end: string; draggable: boolean }

@Component({
  standalone: true,
  selector: 'bc-dnd-wrapper',
  template: `
    <bc-calendar-provider [localizer]="localizer()" [defaultView]="defaultView()">
      <div calendarDnd class="dnd-container">
        <bc-calendar [toolbar]="false" />
      </div>
    </bc-calendar-provider>
  `,
  imports: [CalendarProviderComponent, CalendarComponent, CalendarDndDirective],
})
class DndWrapperComponent {
  readonly localizer = input.required<LocalizerContract>()
  readonly defaultView = input<ViewKey>()
}

// CalendarDndService must be provided inside the bc-calendar-provider tree
// so that inject(CALENDAR_TOKEN) can find the ancestor provider.
@Component({
  standalone: true,
  selector: 'bc-dnd-service-inner',
  template: `
    <div role="status" class="bc-sr-only">{{ dndService.announcement() }}</div>
    <div class="bc-month-grid">
      <button type="button" data-bc-event="evt-1">Event 1</button>
    </div>
  `,
  providers: [CalendarDndService],
})
class DndServiceInnerComponent {
  readonly dndService = inject(CalendarDndService)
  readonly ctx = inject(CALENDAR_TOKEN)
}

@Component({
  standalone: true,
  selector: 'bc-dnd-service-host',
  template: `
    <bc-calendar-provider [localizer]="localizer()" [defaultView]="'month'" [events]="events()">
      <bc-dnd-service-inner />
    </bc-calendar-provider>
  `,
  imports: [CalendarProviderComponent, DndServiceInnerComponent],
})
class DndServiceHostComponent {
  readonly localizer = input.required<LocalizerContract>()
  readonly events = input<unknown[]>([])
}

function createDndService(localizer: LocalizerContract, events: unknown[] = []) {
  TestBed.configureTestingModule({ imports: [DndServiceHostComponent] })
  const fixture = TestBed.createComponent(DndServiceHostComponent)
  fixture.componentRef.setInput('localizer', localizer)
  fixture.componentRef.setInput('events', events)
  fixture.detectChanges()
  const inner = fixture.debugElement
    .query(By.directive(DndServiceInnerComponent))
    .componentInstance as DndServiceInnerComponent
  const store = inner.ctx.storeSignal() as CalendarStore<AnyEvent>
  return { fixture, dnd: inner.dndService, store }
}

function makeEvent(id: string): AnyEvent {
  return {
    id,
    title: `Event ${id}`,
    start: '2024-06-15T10:00:00.000Z',
    end: '2024-06-15T11:00:00.000Z',
    draggable: true,
  }
}

// Component with a .bc-time-body grid for time-mode Space key grab tests
@Component({
  standalone: true,
  selector: 'bc-dnd-service-time-inner',
  template: `
    <div role="status" class="bc-sr-only">{{ dndService.announcement() }}</div>
    <div class="bc-time-body">
      <button type="button" data-bc-event="time-evt-1">Time Event 1</button>
    </div>
  `,
  providers: [CalendarDndService],
})
class DndServiceTimeInnerComponent {
  readonly dndService = inject(CalendarDndService)
  readonly ctx = inject(CALENDAR_TOKEN)
}

@Component({
  standalone: true,
  selector: 'bc-dnd-service-time-host',
  template: `
    <bc-calendar-provider [localizer]="localizer()" [defaultView]="'week'" [events]="events()">
      <bc-dnd-service-time-inner />
    </bc-calendar-provider>
  `,
  imports: [CalendarProviderComponent, DndServiceTimeInnerComponent],
})
class DndServiceTimeHostComponent {
  readonly localizer = input.required<LocalizerContract>()
  readonly events = input<unknown[]>([])
}

function createDndServiceTime(localizer: LocalizerContract, events: unknown[] = []) {
  TestBed.configureTestingModule({ imports: [DndServiceTimeHostComponent] })
  const fixture = TestBed.createComponent(DndServiceTimeHostComponent)
  fixture.componentRef.setInput('localizer', localizer)
  fixture.componentRef.setInput('events', events)
  fixture.detectChanges()
  const inner = fixture.debugElement
    .query(By.directive(DndServiceTimeInnerComponent))
    .componentInstance as DndServiceTimeInnerComponent
  const store = inner.ctx.storeSignal() as CalendarStore<AnyEvent>
  return { fixture, dnd: inner.dndService, store }
}

describe.each(LOCALIZER_CASES)('CalendarDndDirective [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('renders the dnd container without error', () => {
    TestBed.configureTestingModule({ imports: [DndWrapperComponent] })
    const fixture = TestBed.createComponent(DndWrapperComponent)
    fixture.componentRef.setInput('localizer', localizer)
    fixture.componentRef.setInput('defaultView', Views.MONTH)
    expect(() => fixture.detectChanges()).not.toThrow()
    expect(fixture.nativeElement.querySelector('.dnd-container')).not.toBeNull()
  })

  it('renders the time grid container without error', () => {
    TestBed.configureTestingModule({ imports: [DndWrapperComponent] })
    const fixture = TestBed.createComponent(DndWrapperComponent)
    fixture.componentRef.setInput('localizer', localizer)
    fixture.componentRef.setInput('defaultView', Views.WEEK)
    expect(() => fixture.detectChanges()).not.toThrow()
  })

  it('agenda view skips DnD binding (moveModeForView returns null)', () => {
    TestBed.configureTestingModule({ imports: [DndWrapperComponent] })
    const fixture = TestBed.createComponent(DndWrapperComponent)
    fixture.componentRef.setInput('localizer', localizer)
    fixture.componentRef.setInput('defaultView', Views.AGENDA)
    expect(() => fixture.detectChanges()).not.toThrow()
  })
})

describe.each(LOCALIZER_CASES)('CalendarDndService [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('renders without error and exposes announcement signal', () => {
    const { dnd } = createDndService(localizer)
    expect(typeof dnd.announcement()).toBe('string')
  })

  it('initial announcement is empty', () => {
    const { dnd } = createDndService(localizer)
    expect(dnd.announcement()).toBe('')
  })

  it('ignores non-Space keydown when no event is grabbed (day mode)', () => {
    const { dnd } = createDndService(localizer)
    dnd.setMode('day')
    expect(() => {
      dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    }).not.toThrow()
    expect(dnd.announcement()).toBe('')
  })

  it('ignores non-Space keydown when no event is grabbed (time mode)', () => {
    const { dnd } = createDndService(localizer)
    dnd.setMode('time')
    expect(() => {
      dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    }).not.toThrow()
    expect(dnd.announcement()).toBe('')
  })

  it('Space key on a target with no data-bc-event attribute is a no-op', () => {
    const { fixture, dnd } = createDndService(localizer)
    const nonEventEl = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
    Object.defineProperty(event, 'target', { value: nonEventEl, writable: false })
    expect(() => dnd.onKeydownCapture(event)).not.toThrow()
    expect(dnd.announcement()).toBe('')
  })

  it('Space key on a data-bc-event button outside the grid selector is a no-op', () => {
    const { fixture, dnd } = createDndService(localizer)
    // The button exists inside .bc-month-grid, but here we create one outside it
    const outsideBtn = document.createElement('button')
    outsideBtn.dataset['bcEvent'] = 'evt-outside'
    fixture.nativeElement.appendChild(outsideBtn)
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
    Object.defineProperty(event, 'target', { value: outsideBtn, writable: false })
    expect(() => dnd.onKeydownCapture(event)).not.toThrow()
    expect(dnd.announcement()).toBe('')
  })

  it('setMode changes the active mode without throwing', () => {
    const { dnd } = createDndService(localizer)
    expect(() => {
      dnd.setMode('day')
      dnd.setMode('time')
    }).not.toThrow()
  })

  it('Space key to grab, then Enter key to drop (day mode)', () => {
    const event = makeEvent('1')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('day')

    // Manually grab the event
    const grabbed = store.grabEvent({ id: '1' })
    expect(grabbed).toBe(true)
    expect(store.keyboardDrag.peek()).not.toBeNull()

    // Now Enter should drop it
    expect(() => {
      dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'Enter' }))
    }).not.toThrow()
    expect(store.keyboardDrag.peek()).toBeNull()
    expect(dnd.announcement()).toContain('Dropped')
  })

  it('Space key to grab, then Escape to cancel (day mode)', () => {
    const event = makeEvent('2')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('day')

    store.grabEvent({ id: '2' })
    expect(store.keyboardDrag.peek()).not.toBeNull()

    dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(store.keyboardDrag.peek()).toBeNull()
    expect(dnd.announcement()).toContain('cancelled')
  })

  it('ArrowRight when grab is active moves the event (day mode)', () => {
    const event = makeEvent('3')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('day')

    store.grabEvent({ id: '3' })
    const originalStart = store.keyboardDrag.peek()!.start

    dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    // Start should have shifted by 1 day
    expect(dnd.announcement()).toBeDefined()
    const newStart = store.keyboardDrag.peek()!.start
    expect(newStart).not.toBe(originalStart)
  })

  it('ArrowLeft when grab is active moves the event backward (day mode)', () => {
    const event = makeEvent('4')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('day')

    store.grabEvent({ id: '4' })
    dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(dnd.announcement()).toBeDefined()
  })

  it('ArrowUp when grab is active moves up 7 days (day mode)', () => {
    const event = makeEvent('5')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('day')

    store.grabEvent({ id: '5' })
    dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    expect(dnd.announcement()).toBeDefined()
  })

  it('ArrowDown when grab is active moves down 7 days (day mode)', () => {
    const event = makeEvent('6')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('day')

    store.grabEvent({ id: '6' })
    dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(dnd.announcement()).toBeDefined()
  })

  it('Shift+ArrowRight resizes end (day mode)', () => {
    const event = makeEvent('7')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('day')

    store.grabEvent({ id: '7' })
    dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true }))
    expect(dnd.announcement()).toBeDefined()
  })

  it('Shift+Alt+ArrowRight resizes start (day mode)', () => {
    const event = makeEvent('8')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('day')

    store.grabEvent({ id: '8' })
    dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, altKey: true }))
    expect(dnd.announcement()).toBeDefined()
  })

  it('ArrowUp when grab is active moves in time mode (time mode)', () => {
    const event = makeEvent('9')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('time')

    store.grabEvent({ id: '9' })
    dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    expect(dnd.announcement()).toBeDefined()
  })

  it('ArrowDown in time mode moves event forward in time', () => {
    const event = makeEvent('10')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('time')

    store.grabEvent({ id: '10' })
    dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(dnd.announcement()).toBeDefined()
  })

  it('Shift+ArrowUp in time mode resizes end backward (time mode)', () => {
    const event = makeEvent('11')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('time')

    store.grabEvent({ id: '11' })
    dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true }))
    expect(dnd.announcement()).toBeDefined()
  })

  it('Shift+Alt+ArrowDown in time mode resizes start (time mode)', () => {
    const event = makeEvent('12')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('time')

    store.grabEvent({ id: '12' })
    dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true, altKey: true }))
    expect(dnd.announcement()).toBeDefined()
  })

  it('ArrowLeft in time mode moves day backward when no shiftKey', () => {
    const event = makeEvent('13')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('time')

    store.grabEvent({ id: '13' })
    dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(dnd.announcement()).toBeDefined()
  })

  it('ArrowRight in time mode moves day forward when no shiftKey', () => {
    const event = makeEvent('14')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('time')

    store.grabEvent({ id: '14' })
    dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(dnd.announcement()).toBeDefined()
  })

  it('Shift+ArrowLeft in time mode is a no-op (guarded)', () => {
    const event = makeEvent('15')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('time')

    store.grabEvent({ id: '15' })
    expect(() => {
      dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true }))
    }).not.toThrow()
  })

  it('Space key on a valid data-bc-event inside bc-month-grid grabs event in day mode', () => {
    const { fixture, dnd, store } = createDndService(localizer, [makeEvent('evt-1')])
    dnd.setMode('day')

    const btn = fixture.nativeElement.querySelector('[data-bc-event="evt-1"]') as HTMLElement
    expect(btn).not.toBeNull()

    const ke = new KeyboardEvent('keydown', { key: ' ' })
    Object.defineProperty(ke, 'target', { value: btn, writable: false })
    dnd.onKeydownCapture(ke)

    expect(store.keyboardDrag.peek()).not.toBeNull()
    expect(dnd.announcement()).toContain('Picked up')
  })

  it('Shift+ArrowLeft in day mode resizes end (day mode, covers line 122)', () => {
    const event = makeEvent('16')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('day')
    store.grabEvent({ id: '16' })
    dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true }))
    expect(dnd.announcement()).toBeDefined()
  })

  it('Shift+ArrowUp in day mode resizes end (day mode, covers line 130)', () => {
    const event = makeEvent('17')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('day')
    store.grabEvent({ id: '17' })
    dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true }))
    expect(dnd.announcement()).toBeDefined()
  })

  it('Shift+ArrowDown in day mode resizes end (day mode, covers line 134)', () => {
    const event = makeEvent('18')
    const { dnd, store } = createDndService(localizer, [event])
    dnd.setMode('day')
    store.grabEvent({ id: '18' })
    dnd.onKeydownCapture(new KeyboardEvent('keydown', { key: 'ArrowDown', shiftKey: true }))
    expect(dnd.announcement()).toBeDefined()
  })

  it('Space key on a valid data-bc-event inside bc-time-body grabs event in time mode', () => {
    const { fixture, dnd, store } = createDndServiceTime(localizer, [makeEvent('time-evt-1')])
    dnd.setMode('time')

    const btn = fixture.nativeElement.querySelector('[data-bc-event="time-evt-1"]') as HTMLElement
    expect(btn).not.toBeNull()

    const ke = new KeyboardEvent('keydown', { key: ' ' })
    Object.defineProperty(ke, 'target', { value: btn, writable: false })
    dnd.onKeydownCapture(ke)

    expect(store.keyboardDrag.peek()).not.toBeNull()
    expect(dnd.announcement()).toContain('Picked up')
  })
})

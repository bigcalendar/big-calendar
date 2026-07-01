import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { describe, expect, it } from 'vitest'
import { BcEventRovingDirective } from './BcEventRovingDirective'

@Component({
  standalone: true,
  selector: 'bc-event-roving-host',
  template: `
    <div bcEventRoving>
      <button type="button" data-bc-event="evt-1">Event 1</button>
      <button type="button" data-bc-event="evt-2">Event 2</button>
      <button type="button" data-bc-event="evt-3">Event 3</button>
    </div>
  `,
  imports: [BcEventRovingDirective],
})
class EventRovingHostComponent {}

@Component({
  standalone: true,
  selector: 'bc-empty-roving-host',
  template: `<div bcEventRoving><span>No events</span></div>`,
  imports: [BcEventRovingDirective],
})
class EmptyRovingHostComponent {}

function createHost() {
  TestBed.configureTestingModule({ imports: [EventRovingHostComponent] })
  const fixture = TestBed.createComponent(EventRovingHostComponent)
  fixture.detectChanges()
  return fixture
}

describe('BcEventRovingDirective', () => {
  it('makes the first event button tabbable (tabIndex=0) after render', () => {
    const fixture = createHost()
    const buttons = fixture.nativeElement.querySelectorAll('[data-bc-event]')
    expect(buttons[0].tabIndex).toBe(0)
  })

  it('makes subsequent event buttons non-tabbable (tabIndex=-1)', () => {
    const fixture = createHost()
    const buttons = fixture.nativeElement.querySelectorAll('[data-bc-event]')
    expect(buttons[1].tabIndex).toBe(-1)
    expect(buttons[2].tabIndex).toBe(-1)
  })

  it('renders all three event buttons', () => {
    const fixture = createHost()
    const buttons = fixture.nativeElement.querySelectorAll('[data-bc-event]')
    expect(buttons.length).toBe(3)
  })

  it('does not throw when no [data-bc-event] buttons exist', () => {
    TestBed.configureTestingModule({ imports: [EmptyRovingHostComponent] })
    expect(() => {
      const fixture = TestBed.createComponent(EmptyRovingHostComponent)
      fixture.detectChanges()
    }).not.toThrow()
  })

  it('ignores non-arrow keys', () => {
    const fixture = createHost()
    const container = fixture.nativeElement.querySelector('div')
    const buttons = fixture.nativeElement.querySelectorAll('[data-bc-event]')
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    fixture.detectChanges()
    expect(buttons[0].tabIndex).toBe(0)
  })

  it('ArrowRight on first button does not throw', () => {
    const fixture = createHost()
    const buttons = fixture.nativeElement.querySelectorAll('[data-bc-event]')
    const first = buttons[0] as HTMLElement
    expect(() => {
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      fixture.detectChanges()
    }).not.toThrow()
  })

  it('ArrowLeft on last button does not throw', () => {
    const fixture = createHost()
    const buttons = fixture.nativeElement.querySelectorAll('[data-bc-event]')
    const last = buttons[buttons.length - 1] as HTMLElement
    expect(() => {
      last.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
      fixture.detectChanges()
    }).not.toThrow()
  })

  it('ArrowRight at last button is a no-op (no next element)', () => {
    const fixture = createHost()
    const buttons = fixture.nativeElement.querySelectorAll('[data-bc-event]')
    const last = buttons[buttons.length - 1] as HTMLElement
    expect(() => {
      last.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      fixture.detectChanges()
    }).not.toThrow()
    // First button still tabIndex=0 — active key was not updated
    expect(buttons[0].tabIndex).toBe(0)
  })

  it('focusin on second button sets it as active', () => {
    const fixture = createHost()
    const buttons = fixture.nativeElement.querySelectorAll('[data-bc-event]')
    const second = buttons[1] as HTMLElement
    second.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    fixture.detectChanges()
    // After ngAfterViewChecked re-runs, second button should be tabIndex=0
    expect(second.tabIndex).toBe(0)
    expect(buttons[0].tabIndex).toBe(-1)
  })

  it('focusin on element without data-bc-event is ignored', () => {
    const fixture = createHost()
    const container = fixture.nativeElement.querySelector('div')
    const buttons = fixture.nativeElement.querySelectorAll('[data-bc-event]')
    container.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    fixture.detectChanges()
    // First button remains active
    expect(buttons[0].tabIndex).toBe(0)
  })

  it('arrow key dispatched on container (no data-bc-event ancestor) returns early without throwing', () => {
    const fixture = createHost()
    const container = fixture.nativeElement.querySelector('div')
    // The container itself has no [data-bc-event]; closest('[data-bc-event]') returns null → early return
    expect(() => {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
      fixture.detectChanges()
    }).not.toThrow()
  })
})

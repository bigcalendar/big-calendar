import { Component } from '@angular/core'
import { By } from '@angular/platform-browser'
import { TestBed } from '@angular/core/testing'
import { describe, expect, it } from 'vitest'
import { BcPopoverComponent, BcPopoverTriggerDirective } from './BcPopoverComponent'

@Component({
  standalone: true,
  selector: 'bc-popover-host',
  template: `
    <bc-popover>
      <button type="button" bcPopoverTrigger>Open</button>
      <p class="popover-content">Popover body</p>
    </bc-popover>
  `,
  imports: [BcPopoverComponent, BcPopoverTriggerDirective],
})
class PopoverHostComponent {}

@Component({
  standalone: true,
  selector: 'bc-custom-popover-host',
  template: `
    <bc-popover className="my-panel" [sameWidth]="true">
      <button type="button" bcPopoverTrigger>Open</button>
      <p>Content</p>
    </bc-popover>
  `,
  imports: [BcPopoverComponent, BcPopoverTriggerDirective],
})
class CustomPopoverHostComponent {}

function createHost() {
  TestBed.configureTestingModule({ imports: [PopoverHostComponent] })
  const fixture = TestBed.createComponent(PopoverHostComponent)
  fixture.detectChanges()
  const popover = fixture.debugElement
    .query(By.directive(BcPopoverComponent))
    .componentInstance as BcPopoverComponent
  return { fixture, popover }
}

describe('BcPopoverComponent', () => {
  it('renders the trigger button', () => {
    const { fixture } = createHost()
    const button = fixture.nativeElement.querySelector('button')
    expect(button?.textContent?.trim()).toBe('Open')
  })

  it('renders a panel with popover attribute', () => {
    const { fixture } = createHost()
    const panel = fixture.nativeElement.querySelector('[popover]')
    expect(panel).not.toBeNull()
  })

  it('applies the default bc-popover class to the panel', () => {
    const { fixture } = createHost()
    const panel = fixture.nativeElement.querySelector('.bc-popover')
    expect(panel).not.toBeNull()
  })

  it('panel has an id attribute', () => {
    const { fixture } = createHost()
    const panel = fixture.nativeElement.querySelector('.bc-popover')
    expect(panel?.getAttribute('id')).toMatch(/^bc-popover-\d+$/)
  })

  it('trigger has popovertarget wired to panel id', () => {
    const { fixture } = createHost()
    const panel = fixture.nativeElement.querySelector('.bc-popover')
    const button = fixture.nativeElement.querySelector('button')
    expect(button?.getAttribute('popovertarget')).toBe(panel?.getAttribute('id'))
  })

  it('applies custom className when provided', () => {
    TestBed.configureTestingModule({ imports: [CustomPopoverHostComponent] })
    const fixture = TestBed.createComponent(CustomPopoverHostComponent)
    fixture.detectChanges()
    const panel = fixture.nativeElement.querySelector('.my-panel')
    expect(panel).not.toBeNull()
  })

  it('onToggle with newState=open sets isOpen to true', () => {
    const { popover } = createHost()
    const event = new Event('toggle')
    Object.defineProperty(event, 'newState', { value: 'open', writable: false })
    expect(() => popover.onToggle(event)).not.toThrow()
    expect(popover.isOpen).toBe(true)
  })

  it('onToggle with newState=closed sets isOpen to false', () => {
    const { popover } = createHost()
    const openEvent = new Event('toggle')
    Object.defineProperty(openEvent, 'newState', { value: 'open', writable: false })
    popover.onToggle(openEvent)

    const closeEvent = new Event('toggle')
    Object.defineProperty(closeEvent, 'newState', { value: 'closed', writable: false })
    expect(() => popover.onToggle(closeEvent)).not.toThrow()
    expect(popover.isOpen).toBe(false)
  })

  it('ngOnDestroy does not throw', () => {
    const { popover } = createHost()
    expect(() => popover.ngOnDestroy()).not.toThrow()
  })
})

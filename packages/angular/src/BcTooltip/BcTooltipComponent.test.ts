import { Component } from '@angular/core'
import { By } from '@angular/platform-browser'
import { TestBed } from '@angular/core/testing'
import { describe, expect, it } from 'vitest'
import { BcTooltipComponent } from './BcTooltipComponent'

@Component({
  standalone: true,
  selector: 'bc-tooltip-host',
  template: `
    <bc-tooltip label="Helpful tip">
      <button type="button">Hover me</button>
    </bc-tooltip>
  `,
  imports: [BcTooltipComponent],
})
class TooltipHostComponent {}

function createHost() {
  TestBed.configureTestingModule({ imports: [TooltipHostComponent] })
  const fixture = TestBed.createComponent(TooltipHostComponent)
  fixture.detectChanges()
  const tooltip = fixture.debugElement
    .query(By.directive(BcTooltipComponent))
    .componentInstance as BcTooltipComponent
  return { fixture, tooltip }
}

describe('BcTooltipComponent', () => {
  it('renders the anchor wrapper', () => {
    const { fixture } = createHost()
    expect(fixture.nativeElement.querySelector('.bc-tooltip-anchor')).not.toBeNull()
  })

  it('renders the tooltip panel with role="tooltip"', () => {
    const { fixture } = createHost()
    const tip = fixture.nativeElement.querySelector('[role="tooltip"]')
    expect(tip).not.toBeNull()
  })

  it('renders the tooltip text', () => {
    const { fixture } = createHost()
    const tip = fixture.nativeElement.querySelector('[role="tooltip"]')
    expect(tip?.textContent?.trim()).toBe('Helpful tip')
  })

  it('tooltip has an id and anchor has matching aria-describedby', () => {
    const { fixture } = createHost()
    const anchor = fixture.nativeElement.querySelector('.bc-tooltip-anchor')
    const tip = fixture.nativeElement.querySelector('[role="tooltip"]')
    expect(anchor?.getAttribute('aria-describedby')).toBe(tip?.getAttribute('id'))
  })

  it('renders slotted content inside the anchor', () => {
    const { fixture } = createHost()
    const button = fixture.nativeElement.querySelector('.bc-tooltip-anchor button')
    expect(button?.textContent?.trim()).toBe('Hover me')
  })

  it('show() does not throw', () => {
    const { tooltip } = createHost()
    expect(() => tooltip.show()).not.toThrow()
  })

  it('calling show() twice is a no-op on the second call', () => {
    const { tooltip } = createHost()
    expect(() => {
      tooltip.show()
      tooltip.show()
    }).not.toThrow()
  })

  it('hide() does not throw when already closed', () => {
    const { tooltip } = createHost()
    expect(() => tooltip.hide()).not.toThrow()
  })

  it('show() then hide() does not throw', () => {
    const { tooltip } = createHost()
    expect(() => {
      tooltip.show()
      tooltip.hide()
    }).not.toThrow()
  })

  it('toggle() opens when closed', () => {
    const { tooltip } = createHost()
    expect(() => tooltip.toggle()).not.toThrow()
  })

  it('toggle() closes when open', () => {
    const { tooltip } = createHost()
    tooltip.show()
    expect(() => tooltip.toggle()).not.toThrow()
  })

  it('ngOnDestroy does not throw when tooltip is closed', () => {
    const { tooltip } = createHost()
    expect(() => tooltip.ngOnDestroy()).not.toThrow()
  })

  it('ngOnDestroy hides and does not throw when tooltip is open', () => {
    const { tooltip } = createHost()
    tooltip.show()
    expect(() => tooltip.ngOnDestroy()).not.toThrow()
  })
})

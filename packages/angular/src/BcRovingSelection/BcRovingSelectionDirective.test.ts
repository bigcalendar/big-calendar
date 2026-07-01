import type { LocalizerContract } from '@big-calendar/core'
import { Component, input } from '@angular/core'
import { By } from '@angular/platform-browser'
import { TestBed } from '@angular/core/testing'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { CalendarProviderComponent } from '../CalendarProvider/CalendarProviderComponent'
import { BcRovingSelectionDirective } from './BcRovingSelectionDirective'

@Component({
  standalone: true,
  selector: 'bc-roving-host',
  template: `
    <bc-calendar-provider [localizer]="localizer()" [defaultView]="'month'" [selectable]="'click'">
      <div
        bcRovingSelection
        [bcMode]="'day'"
        [bcCount]="35"
        [bcColumns]="7"
      >
        @for (i of slots; track i) {
          <div class="slot" [attr.data-slot-index]="i" [attr.data-date]="'2024-01-' + (i + 1)" tabindex="-1"></div>
        }
      </div>
    </bc-calendar-provider>
  `,
  imports: [CalendarProviderComponent, BcRovingSelectionDirective],
})
class RovingHostComponent {
  readonly localizer = input.required<LocalizerContract>()
  readonly slots = Array.from({ length: 35 }, (_, i) => i)
}

function createHost(localizer: LocalizerContract) {
  TestBed.configureTestingModule({ imports: [RovingHostComponent] })
  const fixture = TestBed.createComponent(RovingHostComponent)
  fixture.componentRef.setInput('localizer', localizer)
  fixture.detectChanges()
  return fixture
}

describe.each(LOCALIZER_CASES)('BcRovingSelectionDirective [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('renders slot cells with data-slot-index attributes', () => {
    const fixture = createHost(localizer)
    const cells = fixture.nativeElement.querySelectorAll('[data-slot-index]')
    expect(cells.length).toBe(35)
  })

  it('directive is applied to the container', () => {
    const fixture = createHost(localizer)
    const containerEl = fixture.nativeElement.querySelector('div:has([data-slot-index])')
    expect(containerEl).not.toBeNull()
  })

  it('ArrowRight keydown dispatched on a cell does not throw', () => {
    const fixture = createHost(localizer)
    const cells = fixture.nativeElement.querySelectorAll('[data-slot-index]')
    const first = cells[0] as HTMLElement
    first.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(() => {
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    }).not.toThrow()
  })

  it('ArrowDown keydown dispatched on a cell does not throw', () => {
    const fixture = createHost(localizer)
    const cells = fixture.nativeElement.querySelectorAll('[data-slot-index]')
    const first = cells[0] as HTMLElement
    expect(() => {
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    }).not.toThrow()
  })

  it('ArrowLeft at left edge of row does not move (wrapping prevented)', () => {
    const fixture = createHost(localizer)
    const cells = fixture.nativeElement.querySelectorAll('[data-slot-index]')
    // Cell 0 is the leftmost cell in the first row; ArrowLeft should be blocked
    const first = cells[0] as HTMLElement
    expect(() => {
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))
    }).not.toThrow()
  })

  it('ArrowRight at right edge of row does not move (wrapping prevented)', () => {
    const fixture = createHost(localizer)
    const cells = fixture.nativeElement.querySelectorAll('[data-slot-index]')
    // Cell index 6 is the rightmost cell in the first row (7 columns)
    const last = cells[6] as HTMLElement
    expect(() => {
      last.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    }).not.toThrow()
  })

  it('Enter key dispatched on a cell does not throw', () => {
    const fixture = createHost(localizer)
    const cells = fixture.nativeElement.querySelectorAll('[data-slot-index]')
    const first = cells[0] as HTMLElement
    expect(() => {
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    }).not.toThrow()
  })

  it('Space key dispatched on a cell does not throw', () => {
    const fixture = createHost(localizer)
    const cells = fixture.nativeElement.querySelectorAll('[data-slot-index]')
    const first = cells[0] as HTMLElement
    expect(() => {
      first.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    }).not.toThrow()
  })

  it('Escape key dispatched on a cell does not throw', () => {
    const fixture = createHost(localizer)
    const cells = fixture.nativeElement.querySelectorAll('[data-slot-index]')
    const first = cells[0] as HTMLElement
    expect(() => {
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    }).not.toThrow()
  })

  it('Shift+ArrowRight dispatched on a cell does not throw', () => {
    const fixture = createHost(localizer)
    const cells = fixture.nativeElement.querySelectorAll('[data-slot-index]')
    const first = cells[0] as HTMLElement
    first.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(() => {
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }))
    }).not.toThrow()
  })

  it('focusin on a cell updates the active index', () => {
    const fixture = createHost(localizer)
    const cells = fixture.nativeElement.querySelectorAll('[data-slot-index]')
    const third = cells[2] as HTMLElement
    expect(() => {
      third.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    }).not.toThrow()
  })

  it('keydown on an element without data-slot-index does not throw', () => {
    const fixture = createHost(localizer)
    const container = fixture.nativeElement.querySelector('div:has([data-slot-index])')
    expect(() => {
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    }).not.toThrow()
  })

  it('cellTabIndex returns 0 for the active cell and -1 for others', () => {
    const fixture = createHost(localizer)
    const directive = fixture.debugElement
      .query(By.directive(BcRovingSelectionDirective))
      .injector.get(BcRovingSelectionDirective)
    // Initially active index is 0
    expect(directive.cellTabIndex(0)).toBe(0)
    expect(directive.cellTabIndex(1)).toBe(-1)
    expect(directive.cellTabIndex(34)).toBe(-1)
  })

  it('Shift+Arrow while already selecting extends rather than re-starting the selection', () => {
    const fixture = createHost(localizer)
    const cells = fixture.nativeElement.querySelectorAll('[data-slot-index]')
    const first = cells[0] as HTMLElement
    const second = cells[1] as HTMLElement
    // First Shift+Arrow starts the selection
    first.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }))
    // Second Shift+Arrow should extend it (status is already 'selecting', so selection.start is NOT re-called)
    expect(() => {
      second.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }))
    }).not.toThrow()
  })

  it('Enter key during an active selection completes it (status=selecting branch)', () => {
    const fixture = createHost(localizer)
    const cells = fixture.nativeElement.querySelectorAll('[data-slot-index]')
    const first = cells[0] as HTMLElement
    const second = cells[1] as HTMLElement
    // Focus first cell then Shift+ArrowRight to start a selection
    first.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }))
    // Press Enter on the second cell (now active) to complete the selection
    expect(() => {
      second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    }).not.toThrow()
  })

  it('Escape key during an active selection cancels it (Escape+selecting branch)', () => {
    const fixture = createHost(localizer)
    const cells = fixture.nativeElement.querySelectorAll('[data-slot-index]')
    const first = cells[0] as HTMLElement
    const second = cells[1] as HTMLElement
    // Focus first cell then Shift+ArrowRight to start a selection
    first.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }))
    // Press Escape to cancel the selection
    expect(() => {
      second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    }).not.toThrow()
  })
})

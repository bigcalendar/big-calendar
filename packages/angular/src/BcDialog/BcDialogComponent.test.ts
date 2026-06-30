import { Component, input } from '@angular/core'
import { By } from '@angular/platform-browser'
import { TestBed } from '@angular/core/testing'
import { describe, expect, it, vi } from 'vitest'
import { BcDialogComponent } from './BcDialogComponent'

@Component({
  standalone: true,
  selector: 'bc-dialog-host',
  template: `
    <bc-dialog [open]="open()" (bcClose)="onClose()" aria-label="Test dialog">
      <p>Dialog content</p>
    </bc-dialog>
  `,
  imports: [BcDialogComponent],
})
class DialogHostComponent {
  readonly open = input(false)
  closedCount = 0
  onClose() { this.closedCount++ }
}

function createHost(open = false) {
  TestBed.configureTestingModule({ imports: [DialogHostComponent] })
  const fixture = TestBed.createComponent(DialogHostComponent)
  fixture.componentRef.setInput('open', open)
  fixture.detectChanges()
  const dialogComp = fixture.debugElement
    .query(By.directive(BcDialogComponent))
    .componentInstance as BcDialogComponent
  return { fixture, dialogComp }
}

describe('BcDialogComponent', () => {
  it('renders a <dialog> element', () => {
    const { fixture } = createHost()
    expect(fixture.nativeElement.querySelector('dialog')).not.toBeNull()
  })

  it('applies the default bc-dialog class', () => {
    const { fixture } = createHost()
    const dialog = fixture.nativeElement.querySelector('dialog')
    expect(dialog.className).toContain('bc-dialog')
  })

  it('applies the aria-label attribute', () => {
    const { fixture } = createHost()
    const dialog = fixture.nativeElement.querySelector('dialog')
    expect(dialog.getAttribute('aria-label')).toBe('Test dialog')
  })

  it('renders content when open', () => {
    const { fixture } = createHost(true)
    expect(fixture.nativeElement.querySelector('p')).not.toBeNull()
  })

  it('does not render content when closed', () => {
    const { fixture } = createHost(false)
    expect(fixture.nativeElement.querySelector('p')).toBeNull()
  })

  it('switching open to true renders content without throwing', () => {
    const { fixture } = createHost(false)
    expect(() => {
      fixture.componentRef.setInput('open', true)
      fixture.detectChanges()
    }).not.toThrow()
    expect(fixture.nativeElement.querySelector('p')).not.toBeNull()
  })

  it('switching open from true to false removes content', () => {
    const { fixture } = createHost(true)
    fixture.componentRef.setInput('open', false)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('p')).toBeNull()
  })

  it('ngOnInit does not throw', () => {
    const { dialogComp } = createHost(false)
    expect(() => dialogComp.ngOnInit()).not.toThrow()
  })

  it('ngOnDestroy does not throw when dialog is closed', () => {
    const { dialogComp } = createHost(false)
    expect(() => dialogComp.ngOnDestroy()).not.toThrow()
  })

  it('ngOnDestroy does not throw when dialog was open', () => {
    const { dialogComp } = createHost(true)
    expect(() => dialogComp.ngOnDestroy()).not.toThrow()
  })

  it('showModal and close are called when open toggles (patched for JSDOM)', () => {
    const { fixture } = createHost(false)
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement

    // Patch native dialog API to simulate browser behaviour (JSDOM may lack showModal)
    const showModalSpy = vi.fn()
    const closeSpy = vi.fn()
    let isOpen = false
    dialog.showModal = showModalSpy.mockImplementation(() => { isOpen = true })
    dialog.close = closeSpy.mockImplementation(() => { isOpen = false })
    Object.defineProperty(dialog, 'open', { get: () => isOpen, configurable: true })

    // Opening the dialog should call showModal
    fixture.componentRef.setInput('open', true)
    fixture.detectChanges()
    expect(showModalSpy).toHaveBeenCalledOnce()

    // Closing the dialog should call close
    fixture.componentRef.setInput('open', false)
    fixture.detectChanges()
    expect(closeSpy).toHaveBeenCalledOnce()
  })

  it('ngOnDestroy calls close when dialog is open at destroy time (patched for JSDOM)', () => {
    const { fixture, dialogComp } = createHost(false)
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement

    const showModalSpy = vi.fn()
    const closeSpy = vi.fn()
    let isOpen = false
    dialog.showModal = showModalSpy.mockImplementation(() => { isOpen = true })
    dialog.close = closeSpy.mockImplementation(() => { isOpen = false })
    Object.defineProperty(dialog, 'open', { get: () => isOpen, configurable: true })

    // Open dialog
    fixture.componentRef.setInput('open', true)
    fixture.detectChanges()
    expect(isOpen).toBe(true)

    // Destroy while open — ngOnDestroy should call close (line 92)
    dialogComp.ngOnDestroy()
    expect(closeSpy).toHaveBeenCalled()
  })
})

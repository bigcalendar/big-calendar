import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Dialog from './Dialog.component'

/** The native modal API surface we mock onto the prototype (absent in jsdom). */
type DialogProto = { showModal?: () => void; close?: () => void }

describe('Dialog', () => {
  it('mounts content only while open and fires onClose on the native close event', () => {
    const onClose = vi.fn()
    const { rerender, container } = render(
      <Dialog open={false} onClose={onClose} aria-label="Demo">
        <p>Modal body</p>
      </Dialog>,
    )
    expect(screen.queryByText('Modal body')).toBeNull()
    const dialog = container.querySelector('dialog')
    if (!dialog) throw new Error('no dialog')
    expect(dialog.getAttribute('aria-label')).toBe('Demo')

    rerender(
      <Dialog open onClose={onClose} aria-label="Demo">
        <p>Modal body</p>
      </Dialog>,
    )
    expect(screen.getByText('Modal body')).toBeTruthy()

    fireEvent(dialog, new Event('close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('stores no prior focus target when there is no active element', () => {
    Object.defineProperty(document, 'activeElement', { configurable: true, get: () => null })
    const onClose = vi.fn()
    const { rerender } = render(
      <Dialog open onClose={onClose} aria-label="Demo">
        <p>Body</p>
      </Dialog>,
    )
    // Closing must not throw even though nothing was focused before opening.
    rerender(
      <Dialog open={false} onClose={onClose} aria-label="Demo">
        <p>Body</p>
      </Dialog>,
    )
    Reflect.deleteProperty(document, 'activeElement')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('uses a custom class name', () => {
    const { container } = render(
      <Dialog open={false} onClose={() => {}} className="custom-dialog">
        <p>x</p>
      </Dialog>,
    )
    expect(container.querySelector('dialog')?.classList.contains('custom-dialog')).toBe(true)
  })

  describe('with the native modal API', () => {
    beforeEach(() => {
      const proto = HTMLDialogElement.prototype as unknown as DialogProto
      proto.showModal = function (this: HTMLDialogElement) {
        this.setAttribute('open', '')
      }
      proto.close = function (this: HTMLDialogElement) {
        this.removeAttribute('open')
      }
    })

    afterEach(() => {
      Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
      Reflect.deleteProperty(HTMLDialogElement.prototype, 'close')
    })

    it('opens modally and restores focus to the prior element on close', () => {
      render(<button>Opener</button>)
      const opener = screen.getByRole('button', { name: 'Opener' })
      opener.focus()
      expect(document.activeElement).toBe(opener)

      const onClose = vi.fn()
      const { rerender, container } = render(
        <Dialog open onClose={onClose} aria-label="Demo">
          <p>Body</p>
        </Dialog>,
      )
      const dialog = container.querySelector('dialog')
      if (!dialog) throw new Error('no dialog')
      expect(dialog.hasAttribute('open')).toBe(true)

      rerender(
        <Dialog open={false} onClose={onClose} aria-label="Demo">
          <p>Body</p>
        </Dialog>,
      )
      expect(dialog.hasAttribute('open')).toBe(false)
      expect(document.activeElement).toBe(opener)
    })
  })
})

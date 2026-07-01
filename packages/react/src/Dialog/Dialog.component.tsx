import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'

/** A `<dialog>` with the native modal API (absent in some test DOMs). */
interface DialogControl {
  showModal?: () => void
  close?: () => void
  open?: boolean
}

/** Props for {@link Dialog}. */
export interface DialogProps {
  /** Whether the modal is open. */
  open: boolean
  /** Called when the dialog closes (backdrop, `Esc`, or programmatic close). */
  onClose: () => void
  /** Modal content, mounted only while open. */
  children: ReactNode
  /** Dialog class name (default `bc-dialog`). */
  className?: string
  /** Accessible name when there is no visible heading to reference. */
  'aria-label'?: string
  /** ID of the element that labels the dialog. */
  'aria-labelledby'?: string
}

/**
 * A modal dialog on the native `<dialog>` element. `showModal()` gives the focus
 * trap, `Esc`-to-close, top-layer rendering, and `::backdrop` for free (§7.5,
 * §7.6); focus returns to the previously-focused element on close. When the modal
 * API is unavailable, the content still renders but without the native trap.
 */
function Dialog({ open, onClose, children, className = 'bc-dialog', ...aria }: DialogProps) {
  const dialogRef = useRef<(HTMLDialogElement & DialogControl) | null>(null)
  const restoreRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onCloseEvent = () => onClose()
    dialog.addEventListener('close', onCloseEvent)
    return () => dialog.removeEventListener('close', onCloseEvent)
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      if (typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal()
    } else {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close()
      restoreRef.current?.focus()
    }
  }, [open])

  return (
    <dialog ref={dialogRef} className={className} {...aria}>
      {open ? children : null}
    </dialog>
  )
}

export default Dialog

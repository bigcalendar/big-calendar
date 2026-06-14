import type { ReactNode, SyntheticEvent } from 'react'
import { useCallback, useId, useRef, useState } from 'react'
import type { FloatingPlacement } from '@big-calendar/core/utils'
import { useFloatingAnchor } from '../useFloatingAnchor'

/** The native `toggle` event of a popover element (no global type in older libs). */
interface PopoverToggleEvent extends Event {
  readonly newState: string
}

/** Props handed to {@link PopoverProps.trigger}; spread them onto a `<button>`. */
export interface PopoverTriggerProps {
  /** Callback ref so the popover can anchor to the trigger. */
  ref: (node: HTMLElement | null) => void
  /** Wires the button to the panel via the native Popover API (`popovertarget`). */
  popoverTarget: string
  /** The panel behaves like a dialog for assistive tech. */
  'aria-haspopup': 'dialog'
  /** Reflects whether the panel is currently open. */
  'aria-expanded': boolean
  /** Associates the trigger with the panel it controls. */
  'aria-controls': string
}

/** Props for {@link Popover}. */
export interface PopoverProps {
  /**
   * Renders the control that toggles the popover. Spread the supplied props onto
   * a `<button>` — the browser then opens/closes the panel natively, including
   * light-dismiss and `Esc`.
   */
  trigger: (props: PopoverTriggerProps) => ReactNode
  /** Panel content, mounted only while open and rendered in the top layer. */
  children: ReactNode
  /** Preferred placement relative to the trigger (default `bottom-start`). */
  placement?: FloatingPlacement
  /** Panel class name (default `bc-popover`). */
  className?: string
  /**
   * When `true`, the panel's `inline-size` is set to match the trigger's
   * rendered width on each placement run (e.g. a show-more popover that should
   * span the same column as the day cell it belongs to).
   */
  sameWidth?: boolean
}

/**
 * An anchored top-layer popover built on the native Popover API. The trigger
 * carries `popovertarget`, so the browser owns open/close, light-dismiss, and
 * `Esc` — React only listens to the panel's `toggle` event to track open state
 * and runs `@floating-ui/core` (lazily) to position the panel while it is open.
 *
 * Top layer: the panel renders in the browser top layer, escaping ancestor
 * overflow/stacking. Positioning falls back to `@floating-ui/core` rather than
 * CSS Anchor Positioning, which is not yet cross-engine (§7.5).
 */
function Popover({ trigger, children, placement = 'bottom-start', className = 'bc-popover', sameWidth }: PopoverProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  const setAnchor = useCallback((node: HTMLElement | null) => {
    anchorRef.current = node
  }, [])

  // The native popover drives open state (click, light-dismiss, Esc all fire `toggle`).
  const handleToggle = (event: SyntheticEvent<HTMLDivElement>) => {
    setOpen((event.nativeEvent as PopoverToggleEvent).newState === 'open')
  }

  // Position (and keep positioned) while open.
  useFloatingAnchor(open, anchorRef, panelRef, placement, sameWidth)

  return (
    <>
      {trigger({
        ref: setAnchor,
        popoverTarget: id,
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        'aria-controls': id,
      })}
      <div ref={panelRef} id={id} popover="auto" className={className} onToggle={handleToggle}>
        {open ? children : null}
      </div>
    </>
  )
}

export default Popover

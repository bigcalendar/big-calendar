import type { ReactElement } from 'react'
import { cloneElement, useCallback, useEffect, useId, useRef, useState } from 'react'
import type { FloatingPlacement } from '@big-calendar/core/utils'
import { useFloatingAnchor } from '../useFloatingAnchor'

/** A popover element with the native imperative API (absent in some test DOMs). */
interface PopoverControl {
  showPopover?: () => void
  hidePopover?: () => void
}

/** Props for {@link Tooltip}. */
export interface TooltipProps {
  /** The text shown in the tooltip and exposed as the trigger's description. */
  label: string
  /** The single trigger element the tooltip describes. */
  children: ReactElement<{ 'aria-describedby'?: string }>
  /** Preferred placement relative to the trigger (default `top`). */
  placement?: FloatingPlacement
}

/**
 * A top-layer tooltip on the native Popover API (`popover="manual"`). It opens on
 * hover **and** focus, and toggles on tap, so it is reachable without a pointer
 * hover — required for coarse-pointer / touch devices (§7.7). The label is wired
 * to the trigger via `aria-describedby`.
 *
 * Top layer: the tooltip renders in the browser top layer; positioning uses
 * `@floating-ui/core` (lazily loaded) rather than CSS Anchor Positioning, which
 * is not yet cross-engine (§7.5). When the imperative Popover API is unavailable,
 * show/hide are no-ops and the tooltip stays inert.
 */
function Tooltip({ label, children, placement = 'top' }: TooltipProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLSpanElement | null>(null)
  const tipRef = useRef<HTMLDivElement | null>(null)

  const show = useCallback(() => setOpen(true), [])
  const hide = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((value) => !value), [])

  // Mirror open state to the native top layer (positioning is handled below).
  useEffect(() => {
    const tip: (HTMLDivElement & PopoverControl) | null = tipRef.current
    if (!tip) return
    if (open) {
      if (typeof tip.showPopover === 'function') tip.showPopover()
    } else {
      if (typeof tip.hidePopover === 'function') tip.hidePopover()
    }
  }, [open])

  useFloatingAnchor(open, anchorRef, tipRef, placement)

  return (
    <span
      ref={anchorRef}
      className="bc-tooltip-anchor"
      style={{ display: 'inline-flex' }}
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={toggle}
    >
      {cloneElement(children, { 'aria-describedby': id })}
      <div ref={tipRef} id={id} role="tooltip" popover="manual" className="bc-tooltip">
        {label}
      </div>
    </span>
  )
}

export default Tooltip

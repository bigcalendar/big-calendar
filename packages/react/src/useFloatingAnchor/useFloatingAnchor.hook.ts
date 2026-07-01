import type { RefObject } from 'react'
import { useEffect } from 'react'
import type { FloatingPlacement } from '@big-calendar/core/utils'
import { positionFloating } from '@big-calendar/core/utils'

/**
 * Keep a top-layer `floating` element positioned against an `anchor` while `open`,
 * repositioning on scroll/resize. A no-op while closed or before either ref has
 * attached. Shared by {@link Popover} and {@link Tooltip} so the floating-ui
 * wiring lives in one place.
 *
 * `sameWidth` — when `true`, sets the floating element's `inline-size` to match
 * the anchor's rendered width on each placement run (e.g. for a popover that
 * should span the same column as its trigger).
 */
export function useFloatingAnchor<A extends HTMLElement, F extends HTMLElement>(
  open: boolean,
  anchorRef: RefObject<A | null>,
  floatingRef: RefObject<F | null>,
  placement?: FloatingPlacement,
  sameWidth?: boolean,
): void {
  useEffect(() => {
    if (!open) return
    const anchor = anchorRef.current
    const floating = floatingRef.current
    if (!anchor || !floating) return
    const place = () => {
      void positionFloating(anchor, floating, { placement }).then(({ x, y }) => {
        floating.style.position = 'fixed'
        // x/y from @floating-ui/core are always physical viewport offsets (left/top),
        // regardless of writing direction. Use physical properties here — logical
        // inset-inline-start would map to `right` in RTL and misplace the panel.
        floating.style.left = `${x}px`
        floating.style.top = `${y}px`
        // Reset the end sides: the UA stylesheet for [popover] sets `inset: 0` on
        // all four physical sides. Without these resets the panel stretches to fill
        // the viewport and `height: fit-content` is overridden.
        floating.style.bottom = 'auto'
        floating.style.right = 'auto'
        floating.style.margin = '0'
        if (sameWidth) {
          floating.style.inlineSize = `${anchor.getBoundingClientRect().width}px`
        }
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, placement, sameWidth, anchorRef, floatingRef])
}

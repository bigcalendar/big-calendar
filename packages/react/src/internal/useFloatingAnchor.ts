import type { RefObject } from 'react'
import { useEffect } from 'react'
import type { FloatingPlacement } from './floatingPosition'
import { positionFloating } from './floatingPosition'

/**
 * Keep a top-layer `floating` element positioned against an `anchor` while `open`,
 * repositioning on scroll/resize. A no-op while closed or before either ref has
 * attached. Shared by {@link Popover} and {@link Tooltip} so the floating-ui
 * wiring lives in one place.
 */
export function useFloatingAnchor<A extends HTMLElement, F extends HTMLElement>(
  open: boolean,
  anchorRef: RefObject<A | null>,
  floatingRef: RefObject<F | null>,
  placement?: FloatingPlacement,
): void {
  useEffect(() => {
    if (!open) return
    const anchor = anchorRef.current
    const floating = floatingRef.current
    if (!anchor || !floating) return
    const place = () => {
      void positionFloating(anchor, floating, { placement }).then(({ x, y }) => {
        floating.style.position = 'fixed'
        floating.style.insetInlineStart = `${x}px`
        floating.style.insetBlockStart = `${y}px`
        floating.style.margin = '0'
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, placement, anchorRef, floatingRef])
}

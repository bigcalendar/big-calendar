import type { FloatingPlacement } from '@big-calendar/core/utils'
import { positionFloating } from '@big-calendar/core/utils'
import { onDestroy } from 'svelte'

/**
 * Svelte 5 port of the Vue `useFloatingAnchor` composable.
 *
 * Keeps a top-layer `floating` element positioned against an `anchor` while
 * `getOpen()` returns true, repositioning on scroll and resize. Shared by
 * `<Popover>` and `<Tooltip>`.
 *
 * @param getOpen - reactive getter for the open state.
 * @param getAnchor - reactive getter for the anchor element.
 * @param getFloating - reactive getter for the floating element.
 */
export function useFloatingAnchor(
  getOpen: () => boolean,
  getAnchor: () => HTMLElement | null,
  getFloating: () => HTMLElement | null,
  placement?: FloatingPlacement,
  sameWidth?: boolean,
): void {
  let removeListeners: (() => void) | null = null

  $effect(() => {
    removeListeners?.()
    removeListeners = null

    if (!getOpen()) return
    const anchor = getAnchor()
    const floating = getFloating()
    if (!anchor || !floating) return

    const place = (): void => {
      void positionFloating(anchor, floating, { placement }).then(({ x, y }) => {
        floating.style.position = 'fixed'
        floating.style.left = `${x}px`
        floating.style.top = `${y}px`
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
    removeListeners = (): void => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  })

  onDestroy(() => removeListeners?.())
}

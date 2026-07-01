import type { FloatingPlacement } from '@big-calendar/core/utils'
import { positionFloating } from '@big-calendar/core/utils'
import { onUnmounted, watchEffect } from 'vue'
import type { Ref, ShallowRef } from 'vue'

/**
 * Keep a top-layer `floating` element positioned against an `anchor` while
 * `open`, repositioning on scroll and resize. A no-op while closed or before
 * either ref has attached. Shared by `Popover` and `Tooltip`.
 */
export function useFloatingAnchor(
  open: Ref<boolean>,
  anchorRef: ShallowRef<HTMLElement | null>,
  floatingRef: ShallowRef<HTMLElement | null>,
  placement?: FloatingPlacement,
  sameWidth?: boolean,
): void {
  let removeListeners: (() => void) | null = null

  watchEffect(() => {
    removeListeners?.()
    removeListeners = null

    if (!open.value) return
    const anchor = anchorRef.value
    const floating = floatingRef.value
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

  onUnmounted(() => removeListeners?.())
}

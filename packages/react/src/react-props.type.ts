// Types the binding adds. The hooks that use them land with the slices (D-97).
import type { HTMLAttributes, Ref } from 'react'

/**
 * A prop-getter descriptor mapped to React by `normalize`: `class` becomes `className`, `tabindex`
 * becomes `tabIndex`, `keydown` becomes `onKeyDown`, and `style` variables stay custom properties
 * (api.md section 3.2).
 */
export type ReactProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>
  [data: `data-${string}`]: string | undefined
}

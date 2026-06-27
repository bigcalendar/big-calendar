import { onUpdated, shallowRef } from 'vue'
import type { ShallowRef } from 'vue'

const STEP: Record<string, 1 | -1 | undefined> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
}

/** What {@link useEventRoving} returns for the view root. */
export interface EventRoving {
  containerRef: ShallowRef<HTMLElement | null>
  onKeydown: (e: KeyboardEvent) => void
  onFocusCapture: (e: FocusEvent) => void
}

/**
 * Vue port of the React `useEventRoving` hook (§10-8 adds tests + a11y assertions).
 *
 * Manages the event-button roving tabindex group: all `[data-bc-event]` buttons
 * inside the container become one tab stop, with arrow keys moving focus among
 * them. A single active key is tracked; after every update the DOM is sync'd so
 * exactly one button is tabbable.
 */
export function useEventRoving(): EventRoving {
  const container = shallowRef<HTMLElement | null>(null)
  const activeKey = shallowRef<string | null>(null)

  const buttons = (): HTMLElement[] =>
    Array.from(container.value?.querySelectorAll<HTMLElement>('[data-bc-event]') ?? [])

  onUpdated(() => {
    const list = buttons()
    if (list.length === 0) return
    const active = list.find((b) => b.dataset.bcEvent === activeKey.value) ?? list[0]!
    for (const b of list) b.tabIndex = b === active ? 0 : -1
  })

  const onKeydown = (e: KeyboardEvent): void => {
    const step = STEP[e.key]
    if (step === undefined) return
    const target = e.target instanceof Element ? e.target : null
    const current = target?.closest<HTMLElement>('[data-bc-event]') ?? null
    if (current == null) return
    const list = buttons()
    const next = list[list.indexOf(current) + step]
    e.preventDefault()
    if (next == null) return
    next.focus()
    activeKey.value = next.dataset.bcEvent ?? null
  }

  const onFocusCapture = (e: FocusEvent): void => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-bc-event]')
    if (btn != null && container.value?.contains(btn))
      activeKey.value = btn.dataset.bcEvent ?? null
  }

  return { containerRef: container, onKeydown, onFocusCapture }
}

const STEP: Record<string, 1 | -1 | undefined> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
}

/** What {@link useEventRoving} returns. */
export interface EventRoving {
  onKeydown: (e: KeyboardEvent) => void
  onFocusCapture: (e: FocusEvent) => void
}

/**
 * Svelte 5 port of the Vue `useEventRoving` composable.
 *
 * Manages the event-button roving tabindex group: all `[data-bc-event]` buttons
 * inside `getContainer()` form one tab stop; arrow keys move focus among them.
 *
 * @param getContainer - reactive getter that returns the container element.
 */
export function useEventRoving(getContainer: () => HTMLElement | null): EventRoving {
  let activeKey = $state<string | null>(null)

  const buttons = (): HTMLElement[] =>
    Array.from(getContainer()?.querySelectorAll<HTMLElement>('[data-bc-event]') ?? [])

  $effect(() => {
    void getContainer() // track dependency
    const list = buttons()
    if (list.length === 0) return
    const active = list.find((b) => b.dataset.bcEvent === activeKey) ?? list[0]!
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
    activeKey = next.dataset.bcEvent ?? null
  }

  const onFocusCapture = (e: FocusEvent): void => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-bc-event]')
    if (btn != null && getContainer()?.contains(btn))
      activeKey = btn.dataset.bcEvent ?? null
  }

  return { onKeydown, onFocusCapture }
}

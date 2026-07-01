import { shallowRef } from 'vue'
import type { ShallowRef } from 'vue'

/** Return shape of the roving-selection stub (matching the real interface — 10-8). */
export interface RovingSelection {
  containerRef: ShallowRef<HTMLElement | null>
  onKeydown: (e: KeyboardEvent) => void
  onFocusCapture: (e: FocusEvent) => void
  cellTabIndex: (index: number) => number
}

/**
 * Stub for the slot-grid roving-tabindex composable (§10-8).
 *
 * Returns a no-op implementation so `useMonthView` and `useTimeGridBody` can
 * compose without a11y wiring before Task 10-8 replaces this with the real
 * `useRovingSelection` composable.
 */
export function useRovingSelectionStub(): RovingSelection {
  const containerRef = shallowRef<HTMLElement | null>(null)
  return {
    containerRef,
    onKeydown: () => {},
    onFocusCapture: () => {},
    cellTabIndex: () => 0,
  }
}

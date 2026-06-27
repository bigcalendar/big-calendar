/**
 * Stub for the slot-selection pointer-down handler (§10-8).
 *
 * Returns a no-op pointerdown handler so view composables can spread it onto
 * their grid element before Task 10-8 wires the real `useSlotSelection`.
 */
export function useSlotSelectionStub(): (e: PointerEvent) => void {
  return () => {}
}

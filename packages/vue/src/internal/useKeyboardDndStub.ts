/** Return shape of the keyboard-DnD stub (matching the real interface — 10-9). */
export interface KeyboardDnd {
  announcement: string
  onKeydownCapture: (e: KeyboardEvent) => void
}

/**
 * Stub for the keyboard drag-and-drop composable (§10-9).
 *
 * Returns an empty announcement and no-op handler so `useMonthView` /
 * `useTimeGridView` can compose without DnD wiring before Task 10-9 replaces
 * this with the real `useKeyboardDnd` composable.
 */
export function useKeyboardDndStub(): KeyboardDnd {
  return {
    announcement: '',
    onKeydownCapture: () => {},
  }
}

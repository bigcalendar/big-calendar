// Breaks the binding budget rules: a timer in the binding.
/** Schedules work. */
export function useLater(): void {
  setTimeout(() => undefined, 10)
}

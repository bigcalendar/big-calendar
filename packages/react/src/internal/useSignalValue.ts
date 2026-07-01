import type { ReadonlySignal } from '@preact/signals-core'
import { useSyncExternalStore } from 'react'

/**
 * Bridge a `@preact/signals-core` signal into React via `useSyncExternalStore`
 * (§4.3). The component re-renders only when the signal's value changes; the
 * snapshot is the signal's cached `.value`, whose identity is stable between
 * reads (computed signals memoize), so React's `Object.is` check doesn't loop.
 *
 * This is the single subscription primitive the React adapter uses; every other
 * hook reads store signals through it.
 */
export function useSignalValue<T>(signal: ReadonlySignal<T>): T {
  // One snapshot reader for both client and server keeps SSR working without an
  // extra uncovered function; the signal's cached `.value` is a stable snapshot.
  const getSnapshot = (): T => signal.value
  return useSyncExternalStore((onStoreChange) => signal.subscribe(onStoreChange), getSnapshot, getSnapshot)
}

import type { ReadonlySignal } from '@preact/signals-core'
import { getCurrentInstance, onUnmounted, shallowRef } from 'vue'
import type { ShallowRef } from 'vue'

/**
 * Bridge a `@preact/signals-core` signal into Vue reactivity via a `shallowRef`.
 *
 * The returned ref reflects the signal's current value and updates whenever the
 * signal changes. The signal subscription is torn down automatically when the
 * owning component unmounts (when called inside `setup()`).
 *
 * This is the single subscription primitive the Vue adapter uses; every
 * composable that reads store signals should go through it.
 */
export function useSignalRef<T>(signal: ReadonlySignal<T>): Readonly<ShallowRef<T>> {
  const r = shallowRef<T>(signal.value)
  const unsub = signal.subscribe((v) => {
    r.value = v
  })
  if (getCurrentInstance() !== null) {
    onUnmounted(unsub)
  }
  return r as Readonly<ShallowRef<T>>
}

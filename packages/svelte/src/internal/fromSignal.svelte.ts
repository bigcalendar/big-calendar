import type { ReadonlySignal } from '@preact/signals-core'

/**
 * Bridge a `@preact/signals-core` signal into Svelte 5 rune reactivity.
 *
 * Returns a box object whose `.current` property is a `$state`-backed value
 * that updates whenever the signal emits. The subscription is torn down via
 * the `$effect` cleanup when the owning component or reactive context unmounts.
 *
 * Usage (inside a component `<script>` or `.svelte.ts` rune context):
 * ```ts
 * const view = fromSignal(store.view)
 * // reactive reads: view.current
 * ```
 */
export function fromSignal<T>(signal: ReadonlySignal<T>): { readonly current: T } {
  let current = $state<T>(signal.value)

  $effect(() => {
    const unsub = signal.subscribe((v: T) => {
      current = v
    })
    return unsub
  })

  return {
    get current() { return current },
  }
}

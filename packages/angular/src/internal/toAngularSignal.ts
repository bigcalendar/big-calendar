import type { ReadonlySignal } from '@preact/signals-core'
import { DestroyRef, inject, signal } from '@angular/core'
import type { Signal } from '@angular/core'

/**
 * Bridge a `@preact/signals-core` signal into Angular reactivity via a
 * writable Angular signal.
 *
 * The returned signal reflects the preact signal's current value and
 * updates whenever the preact signal changes. The subscription is torn
 * down automatically when the owning injection context is destroyed
 * (component, directive, or service).
 *
 * Must be called in an Angular injection context (constructor or class
 * field initializer, inside `runInInjectionContext`, or inside
 * `TestBed.runInInjectionContext` in tests).
 */
export function toAngularSignal<T>(preactSignal: ReadonlySignal<T>): Signal<T> {
  const s = signal<T>(preactSignal.value)
  const unsub = preactSignal.subscribe((v) => s.set(v))

  inject(DestroyRef).onDestroy(unsub)

  return s.asReadonly()
}

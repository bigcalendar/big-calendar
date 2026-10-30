// The reactivity facade (TC39 shape: State, Computed, Watcher) over @preact/signals-core.
import { signal, computed, effect, batch as pbatch, untracked } from '@preact/signals-core'

const same = Object.is
export class State {
  #s
  #equals
  constructor(value, { equals = same } = {}) { this.#s = signal(value); this.#equals = equals }
  get() { return this.#s.value }
  set(v) { if (!this.#equals(this.#s.peek(), v)) this.#s.value = v }
}
export class Computed {
  #c
  constructor(fn, { equals = same } = {}) {
    let has = false, prev
    this.#c = computed(() => { const v = fn(); if (has && equals(prev, v)) return prev; has = true; prev = v; return v })
  }
  get() { return this.#c.value }
}
export class Watcher {
  #notify
  #stops = new Map()
  #pending = new Set()
  constructor(notify) { this.#notify = notify }
  watch(...ss) {
    for (const s of ss) {
      let first = true
      this.#stops.set(s, effect(() => {
        s.get()
        if (first) { first = false; return }
        this.#pending.add(s)
        untracked(() => this.#notify.call(this))
      }))
    }
  }
  unwatch(...ss) { for (const s of ss) { this.#stops.get(s)?.(); this.#stops.delete(s); this.#pending.delete(s) } }
  getPending() { const p = [...this.#pending]; this.#pending.clear(); return p }
}
export const untrack = untracked
export const batch = pbatch

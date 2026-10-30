// The reactivity facade (TC39 shape: State, Computed, Watcher) over alien-signals.
import { signal, computed, effect, startBatch, endBatch, setActiveSub } from 'alien-signals'

const same = Object.is
export class State {
  #s
  #equals
  constructor(value, { equals = same } = {}) { this.#s = signal(value); this.#equals = equals }
  get() { return this.#s() }
  set(v) { const prev = untrack(() => this.#s()); if (!this.#equals(prev, v)) this.#s(v) }
}
export class Computed {
  #c
  constructor(fn, { equals = same } = {}) {
    let has = false
    this.#c = computed((prev) => { const v = fn(); if (has && equals(prev, v)) return prev; has = true; return v })
  }
  get() { return this.#c() }
}
// Watcher: `notify` runs synchronously when a watched signal changes. Built on effects, so the
// watched computed is re-evaluated eagerly when notified (TC39's Watcher defers that to getPending).
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
        untrack(() => this.#notify.call(this))
      }))
    }
  }
  unwatch(...ss) { for (const s of ss) { this.#stops.get(s)?.(); this.#stops.delete(s); this.#pending.delete(s) } }
  getPending() { const p = [...this.#pending]; this.#pending.clear(); return p }
}
export function untrack(fn) { const prev = setActiveSub(undefined); try { return fn() } finally { setActiveSub(prev) } }
export function batch(fn) { startBatch(); try { return fn() } finally { endBatch() } }

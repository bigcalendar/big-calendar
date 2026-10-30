// Facade semantics both backings must satisfy (what the kernel relies on).
import assert from 'node:assert/strict'
for (const name of ['alien', 'preact']) {
  const { State, Computed, Watcher, untrack, batch } = await import(`./facade-${name}.js`)
  const results = []
  const t = (label, fn) => { try { fn(); results.push(`ok   ${label}`) } catch (e) { results.push(`FAIL ${label}: ${e.message}`) } }

  t('computed is lazy', () => { let n = 0; const s = new State(1); const c = new Computed(() => (n++, s.get() * 2)); assert.equal(n, 0); assert.equal(c.get(), 2); assert.equal(n, 1); c.get(); assert.equal(n, 1) })
  t('glitch-free diamond', () => { const a = new State(1); const b = new Computed(() => a.get() + 1); const c = new Computed(() => a.get() * 2); let n = 0, seen = []; const d = new Computed(() => (n++, `${b.get()},${c.get()}`)); const w = new Watcher(() => {}); w.watch(d); a.set(2); seen.push(d.get()); assert.deepEqual(seen, ['3,4']); assert.equal(n, 2); w.unwatch(d) })
  t('equality cutoff stops propagation', () => { const s = new State(1); let n = 0; const parity = new Computed(() => s.get() % 2); const down = new Computed(() => (n++, parity.get())); down.get(); s.set(3); down.get(); assert.equal(n, 1) })
  t('custom equals on State', () => { const s = new State({ id: 1 }, { equals: (a, b) => a.id === b.id }); let n = 0; const c = new Computed(() => (n++, s.get())); c.get(); s.set({ id: 1 }); c.get(); assert.equal(n, 1) })
  t('untrack does not subscribe', () => { const a = new State(1), b = new State(1); let n = 0; const c = new Computed(() => (n++, a.get() + untrack(() => b.get()))); c.get(); b.set(5); assert.equal(c.get(), 2); assert.equal(n, 1) })
  t('watcher notified once per batch', () => { const a = new State(1), b = new State(1); const c = new Computed(() => a.get() + b.get()); let n = 0; const w = new Watcher(() => n++); w.watch(c); batch(() => { a.set(2); b.set(3) }); assert.equal(n, 1); assert.deepEqual(w.getPending(), [c]); w.unwatch(c) })
  t('unwatch stops notifications', () => { const a = new State(1); let n = 0; const w = new Watcher(() => n++); w.watch(a); w.unwatch(a); a.set(2); assert.equal(n, 0) })
  t('reads inside notify are untracked', () => { const a = new State(1), b = new State(1); let n = 0; const w = new Watcher(() => { n++; b.get() }); w.watch(a); a.set(2); b.set(2); assert.equal(n, 1); w.unwatch(a) })
  console.log(`\n${name}\n${results.join('\n')}`)
}

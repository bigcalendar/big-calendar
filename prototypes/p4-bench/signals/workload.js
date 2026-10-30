// A store-shaped graph: one State per event, a lane Computed per day (42 for a month) reading its
// events, a view Computed over the lanes, and a Watcher on the view (the binding's subscription).
export function runSignals(F, { events = 5000, lanes = 42, updates = 1000 } = {}) {
  const { State, Computed, Watcher, batch } = F
  const t = () => performance.now()
  const r = {}

  let t0 = t()
  const states = Array.from({ length: events }, (_, i) => new State({ id: i, lane: i % lanes, start: i }))
  const laneOf = Array.from({ length: lanes }, () => [])
  states.forEach((s, i) => laneOf[i % lanes].push(s))
  const recomputes = new Array(lanes).fill(0)
  const laneC = laneOf.map((ss, l) => new Computed(() => { recomputes[l]++; let sum = 0; for (const s of ss) sum += s.get().start; return sum }))
  const view = new Computed(() => laneC.map((c) => c.get()))
  let notified = 0
  const w = new Watcher(() => notified++)
  w.watch(view)
  view.get()
  r.create = t() - t0

  // Single-event edits: each should recompute exactly one lane and notify once.
  recomputes.fill(0)
  notified = 0
  t0 = t()
  for (let i = 0; i < updates; i++) {
    const k = (i * 7919) % events
    states[k].set({ ...states[k].get(), start: states[k].get().start + 1 })
    view.get()
  }
  r.update = ((t() - t0) / updates) * 1000 // µs per edit, including the re-read
  r.recomputesPerEdit = recomputes.reduce((a, b) => a + b, 0) / updates
  r.notifiesPerEdit = notified / updates

  // Bulk replace: every event changes in one batch.
  t0 = t()
  batch(() => { for (const s of states) s.set({ ...s.get(), start: s.get().start + 1 }) })
  view.get()
  r.bulk = t() - t0

  // Fan-out: one State (the visible range) read by every event's derived position.
  t0 = t()
  const range = new State(0)
  const pos = states.map((s) => new Computed(() => s.get().start - range.get()))
  const w2 = new Watcher(() => {})
  w2.watch(...pos)
  r.fanoutCreate = t() - t0
  t0 = t()
  range.set(1)
  for (const p of pos) p.get()
  r.fanoutUpdate = t() - t0
  w2.unwatch(...pos)
  w.unwatch(view)
  return r
}

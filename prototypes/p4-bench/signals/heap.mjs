// Retained heap for the store graph (run with --expose-gc).
const lib = process.argv[2]
const { F } = await import(`./dist/${lib}.js`)
gc()
const before = process.memoryUsage().heapUsed
const states = Array.from(
  { length: 5000 },
  (_, i) => new F.State({ id: i, start: i }),
)
const lanes = Array.from(
  { length: 42 },
  (_, l) =>
    new F.Computed(() => {
      let s = 0
      for (let i = l; i < 5000; i += 42) s += states[i].get().start
      return s
    }),
)
const pos = states.map((s) => new F.Computed(() => s.get().start))
const w = new F.Watcher(() => {})
w.watch(...lanes, ...pos)
for (const c of lanes) c.get()
gc()
console.log(
  lib,
  ((process.memoryUsage().heapUsed - before) / 1024).toFixed(0),
  'KB for 5,000 states + 5,042 watched computeds',
  w ? '' : '',
)

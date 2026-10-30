# P4 benchmarks prototype

Measurement code for the P4 draft ([`plan/P4-BENCHMARKS.md`](../../plan/P4-BENCHMARKS.md)). Throwaway planning code: nothing here is reused in the product. Dependencies are installed with npm in this folder, outside the pnpm workspace.

```sh
cd prototypes/p4-bench && npm install
node size/measure.mjs                                   # bundle sizes
node temporal/entries.mjs && node temporal/correctness.mjs   # correctness corpus (writes reference.json for safari.html)
node engine/entries.mjs && node engine/check.mjs && node engine/bench.mjs   # engine workload: parity, then timings
node engine/ops.mjs                                     # per-operation Temporal costs
node signals/entries.mjs && node signals/semantics.mjs && node signals/bench.mjs
node --expose-gc signals/heap.mjs alien                 # and preact
node dnd/build.mjs && node dnd/check.mjs                # DnD mouse checks
node serve.mjs --lan                                    # pages for real devices: /safari.html, /dnd/
```

| Folder      | What                                                                                                |
| ----------- | --------------------------------------------------------------------------------------------------- |
| `size/`     | Production bundle sizes of each candidate                                                           |
| `temporal/` | The correctness corpus (`corpus.js`) and its cross-engine runner; results in `correctness.json`     |
| `engine/`   | The benchmark-sized engine (`workload.js`), parity check, timings (`results.json`), per-op costs    |
| `signals/`  | The facade over each library, semantics checks, timings and heap                                    |
| `dnd/`      | Three DnD engines on one week page, mouse checks (`results.json`), touch checks (`TOUCH-CHECKS.md`) |
| `reports/`  | Results posted back by real devices (`safari.html`)                                                 |

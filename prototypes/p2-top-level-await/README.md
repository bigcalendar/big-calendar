# P2 prototype: top-level await across bundlers, runners and browsers

Evidence for [the support matrix](../../docs/spec/support-matrix.md), finding 1. This is throwaway planning code. It isn't part of the pnpm workspace and nothing imports it.

## What it tests

`src/loader.js` is a stand-in for `@big-calendar/temporal` (D-32). It uses a complete global `Temporal` if one exists. Otherwise it awaits a stand-in polyfill chunk with top-level `await` and installs it on `globalThis`. `core.js` and `interactions.js` stand in for two packages that both import the loader. At evaluation time, each checks that `Temporal` already exists.

The stand-in polyfill (`src/polyfill.js`) is a few lines, so the test doesn't prejudge P4's polyfill choice. The server delays it by 150ms to mimic a network fetch.

| Scenario     | Module graph                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `static`     | One static graph; two packages import the loader                                                      |
| `concurrent` | Two lazy routes, each using the calendar, imported at the same time                                   |
| `mixed`      | The loader and a module that depends on it, imported at the same time (WebKit bug 242740, comment 10) |
| `many`       | Five concurrent imports that reach the loader by different paths                                      |
| `late`       | The calendar is loaded statically, then two lazy routes load at once                                  |

## Running it

```sh
cd bundlers && npm install && npx playwright install chromium firefox webkit
node build.mjs                       # unbundled, Vite, Rollup, esbuild, webpack, Rspack → dist/
cd ../next && npm install
for v in turbopack webpack; do       # Next.js static exports → ../bundlers/dist/next-<v>
  rm -rf out .next; f=""; [ $v = webpack ] && f="--webpack"
  BASE_PATH=/next-$v NEXT_PUBLIC_BUILD=next-$v npx next build $f && cp -r out ../bundlers/dist/next-$v
done
cd ../bundlers
node pw-seq.mjs                      # Playwright engines, native and forced-polyfill
PORT=4700 RESULTS=results-safari.jsonl TAG=safari node server.mjs &
open -a Safari http://localhost:4700/seq/0   # a real Safari; wait for "FINISHED"
node agg.mjs results-safari.jsonl results-playwright.jsonl
node intl-check.mjs                  # calendar systems and other probes
```

Test runners: `cd runners && npm install`, then `npx vitest run vitest.test.js`, `NODE_OPTIONS=--experimental-vm-modules npx jest --testMatch '**/jest.test.mjs'`, `node --test node.test.mjs`, `deno test --allow-read deno.test.mjs`. `jestcjs.test.cjs` shows Jest's CommonJS mode failing.

## Results (2026-10-28)

The raw results are in `results/`. "Timeout" rows tagged `seq: -1` are harness artifacts: Safari requested a page before the run began (history preloading), and the real report for that page passed.

## Option B check

`runners/optb/` is a sketch of the decided design (D-87): no top-level `await`, and a `temporalReady` promise. `runners/optb.test.cjs` loads it from Jest's CommonJS mode (`NODE_OPTIONS=--experimental-vm-modules npx jest optb.test.cjs`), and `node -e 'require("./optb/core.js")'` loads it with plain Node `require()`.

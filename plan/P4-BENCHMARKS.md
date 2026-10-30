# Benchmarks (P4)

> **Status: approved 2026-10-30 (D-92 answers, D-93 approval).** This is the measurement record; it isn't normative. D-93 corrects finding 2: the zone-data gap also reaches future dates (Morocco from 2029). The choices went into the decision log and the specs they amend ([date engine](../docs/spec/date-engine.md), [reactivity](../docs/spec/reactivity.md), [interaction and accessibility](../docs/spec/interaction-accessibility.md)), and the harness design moves to `docs/standards/testing.md`.

Exit criteria: [roadmap](../docs/spec/roadmap.md#planning-phase), row P4. Budgets: [date engine](../docs/spec/date-engine.md). Profile: D-44.

P4 decides four things from measurements:

1. **The Temporal polyfill:** `temporal-polyfill` or `@js-temporal/polyfill` (section 2).
2. **Whether instant ordering needs a numeric fast path** (section 3, D-10).
3. **The signals backing library:** `alien-signals` or `@preact/signals-core` (section 4).
4. **The DnD engine (O-5):** our own Pointer Events code, or Pragmatic drag and drop (section 5).

It also proposes **the benchmark harness design** that S0 builds (section 6).

All measurement code is in `prototypes/p4-bench/` (README there). Like the P3 prototype, it is throwaway: nothing in it is reused in the product.

## 1. Method

- **Versions:** `temporal-polyfill` 1.0.6, `@js-temporal/polyfill` 0.5.1, `alien-signals` 3.2.1, `@preact/signals-core` 1.14.5, `@atlaskit/pragmatic-drag-and-drop` 4.0.0 with `-auto-scroll` 3.2.1. Bundled with esbuild 0.28.2. Browsers: Playwright 1.64.1 (Chromium 156, Firefox 157, WebKit 27.2), plus **real Safari 26.6.2** on macOS, the only engine here without native Temporal.
- **Sizes** are esbuild production bundles, minified, then gzip level 9, of the import the product would use.
- **Timings** follow D-44: Chromium with 4× CPU slowdown, WebKit and Firefox unthrottled; each configuration in a fresh page, one cold run, one warm-up, then the **median of 10**. Every polyfill timing is taken with native `Temporal` deleted before the page loads.
- **The workload** (`engine/workload.js`) is a small engine written for this benchmark, doing the kernel's Temporal work: ingest 5,000 events from strings (instants with offsets, zone-less times with a zone field, civil dates, zoned dates, multi-day timed events), sort them (ties by D-59), then build a week (segment by day in wall-clock minutes, pack with `divide`) or a month (6 rows, pack with `stack`, "+N more"), in America/New_York. Two spreads: **year** (5,000 events over 12 months) and **dense** (all 5,000 inside the visible month, the worst case). All 18 combinations of implementation and ordering produce **identical layouts** (`engine/check.mjs`).
- Times are engine time only (no DOM), as the budget is written.

## 2. Temporal polyfill

### Size

| Import                                       | min      | gzip        |
| -------------------------------------------- | -------- | ----------- |
| `temporal-polyfill/full` (all calendars)     | 64.7 KB  | **23.1 KB** |
| `temporal-polyfill` (ISO and Gregorian only) | 55.5 KB  | 19.3 KB     |
| `@js-temporal/polyfill`                      | 158.3 KB | **46.0 KB** |

The `full` build is the one we'd ship: D-77 tests Islamic (Umm al-Qura), Hebrew, Persian and Japanese calendars, which the default build lacks.

### Correctness

A corpus of **17,777 cases** (`temporal/corpus.js`) covers what the kernel relies on:

- every zone transition from 1970 to 2040 in 27 zones chosen for awkward rules (Lord Howe's 30-minute DST, Chatham, Casablanca and Cairo Ramadan suspensions, Tehran, Apia's date-line jump, St John's, Kathmandu);
- around each 2024–2028 transition: wall-clock resolution with all four disambiguation modes, `startOfDay`, `hoursInDay`, day and hour arithmetic, rounding, `withPlainTime`;
- parsing (offsets, RFC 9557 suffixes, offset mismatch handling, invalid strings), civil-date arithmetic and weeks over 25 years, the five D-77 calendars, instant ordering, durations, and `toLocaleString`.

Native Temporal in Chromium is the reference; Firefox and WebKit natives were also compared, and cases where natives disagree with each other (tz data versions, ICU formatting) are marked contested. The ten time-semantics worked examples are also checked as explicit expectations.

| Implementation          | Mismatches vs native (where all natives agree) | Worked examples | Real Safari 26.6.2        |
| ----------------------- | ---------------------------------------------- | --------------- | ------------------------- |
| `temporal-polyfill`     | **36** (35)                                    | 10 of 10        | same 36, plus 1 contested |
| `@js-temporal/polyfill` | **641** (640)                                  | 10 of 10        | same 641                  |

What the mismatches are:

- **`temporal-polyfill`, finding 1 (a T-10 bug):** `ZonedDateTime#withPlainTime()` with a time in a repeated (fall-back) hour keeps the receiver's offset instead of taking the earlier occurrence, as the spec's `'compatible'` rule requires. 23 cases (Berlin, Sydney, Adelaide, Auckland, Casablanca). `PlainDateTime#toZonedDateTime()` with explicit disambiguation is correct in every case.
- **`temporal-polyfill`, finding 2 (historical zone data):** it misses short DST suspensions: Morocco's Ramadan changes 2012–2021 and Egypt's in 2010 and 2014, so instants in those weeks are an hour off. 2022 and later are correct up to the corpus's last year; a later check found future Ramadan periods wrong too, from 2029 (D-93). 13 cases.
- **`@js-temporal/polyfill`:** all 640 are calendar `era` and `eraYear` values from an older spec (`"gregory"` instead of `"ce"`; `null` eras for Islamic, Hebrew and Persian). Its last release was 2025-03-31.

### Speed (median ms, engine time for 5,000 events: year week / year month / dense week / dense month)

Polyfill path (Temporal deleted), ordering with `Instant.compare`:

| Engine                            | `temporal-polyfill`       | `@js-temporal/polyfill` | Budget        |
| --------------------------------- | ------------------------- | ----------------------- | ------------- |
| WebKit 27.2 (gated)               | **21 / 21 / 24 / 23**     | 86 / 92 / 114 / 134     | ≤ 100ms       |
| Real Safari 26.6.2 (Mac)          | **20 / 20 / 23 / 22**     | 86 / 82 / 97 / 144      | (same budget) |
| iPhone, Safari 27.0.1 (not gated) | **122 / 127 / 147 / 168** | 672 / 740 / 830 / 1116  | —             |
| Firefox 157 (tracked)             | 29 / 28 / 34 / 32         | 137 / 140 / 152 / 203   | —             |
| Chromium 156, 4× (not gated)      | 96 / 99 / 111 / 108       | 431 / 475 / 511 / 660   | —             |

Chromium with the polyfill matters because the floor (Chrome 141) predates native Temporal (Chrome 144).

**Finding 8:** shipping Safari has **no native Temporal even at 27.0.1** (the maintainer's iPhone), although Playwright's WebKit 27.2 does. Every Safari user runs the polyfill.

**Finding 9:** on the iPhone, `temporal-polyfill` takes 109–168ms for 5,000 events (122–168ms with `Instant.compare`, 109–131ms with the fast path), over the 100ms figure, which D-44 gates on CI's WebKit rather than on phones. About 105ms of it is ingest: parsing 5,000 strings. `@js-temporal/polyfill` takes 632–1,116ms there. Correctness on the iPhone matches the Mac exactly.

**Recommendation: `temporal-polyfill`, the `full` build.** Half the size, four to five times faster, inside the budget with large margin, and current with the spec. Its two defects have workarounds that cost nothing (section 8, question 1).

## 3. Numeric fast path for instant ordering

Same workload, three ways of ordering instants. All three give identical layouts.

| Engine (native Temporal)     | Cached `Temporal.Instant` + `Instant.compare` | Cached `epochNanoseconds` (BigInt) | Cached `epochMilliseconds` (number) | Budget |
| ---------------------------- | --------------------------------------------- | ---------------------------------- | ----------------------------------- | ------ |
| **Chromium 156, 4× (gated)** | **104 / 123 / 136 / 279** ✗                   | **24 / 25 / 30 / 34** ✓            | 23 / 23 / 28 / 32 ✓                 | < 50ms |
| WebKit 27.2                  | 4 / 4 / 4 / 6                                 | 3 / 3 / 4 / 5                      | 3 / 3 / 3 / 4                       | —      |
| Firefox 157                  | 7 / 6 / 7 / 9                                 | 6 / 6 / 7 / 8                      | 5 / 5 / 6 / 7                       | —      |

**Finding 3:** V8's native `Instant.compare` costs about **260ns per call** (unthrottled), against 30ns for the polyfill's JavaScript and effectively nothing in Firefox and WebKit (`engine/ops.mjs`). A 5,000-event sort plus packing makes tens of thousands of comparisons, so Chromium, the gated engine, misses the budget by 2–6× with Temporal objects, and meets it comfortably with cached epoch values.

**Recommendation: yes, use the fast path, as `epochNanoseconds` BigInts** cached once per event at ingest. They give exactly `Instant.compare`'s order (D-10: "identical results"), at the same speed as numbers here. Milliseconds would be faster by a hair but aren't exact for sub-millisecond inputs. The rule stays as D-10 wrote it: instant ordering only; calendar arithmetic stays on Temporal; civil dates use epoch-day counts, never instants.

## 4. Signals backing library

Both libraries sit behind the same facade (`signals/facade-*.js`): `State`, `Computed`, `Watcher` in the TC39 shape, plus `untrack` and `batch`.

**Semantics** (`signals/semantics.mjs`): both pass all eight checks the kernel relies on: lazy computeds, glitch-free diamonds, equality cutoff, custom `equals`, untracked reads, one notification per batch, `unwatch`, untracked reads inside `notify`.

**Size:** 1.7 KB gzip each.

**Speed** (store-shaped graph: 5,000 event states, 42 lane computeds, a view computed, a watcher; medians):

| Engine           | Library | Build graph | One event edit | Lanes recomputed per edit | Bulk change (5,000) | Fan-out update (5,000) |
| ---------------- | ------- | ----------- | -------------- | ------------------------- | ------------------- | ---------------------- |
| Chromium 156, 4× | alien   | 1.7ms       | 10.0µs         | 1                         | 1.4ms               | 2.9ms                  |
| Chromium 156, 4× | preact  | 1.5ms       | 10.6µs         | 1                         | 1.3ms               | 2.8ms                  |
| Node 24          | alien   | 0.8ms       | 2.9µs          | 1                         | 0.5ms               | 0.8ms                  |
| Node 24          | preact  | 0.4ms       | 2.5µs          | 1                         | 0.3ms               | 0.9ms                  |

Firefox and WebKit are similar (`signals/results.json`). Retained heap for the graph: 5.8 MB (alien) and 6.0 MB (preact). Both meet "a single event change re-renders only the affected lanes": exactly one lane recomputes and the watcher fires once.

**There's no measured winner.** The differences that remain:

|                | `alien-signals` 3.2.1                                                                    | `@preact/signals-core` 1.14.5         |
| -------------- | ---------------------------------------------------------------------------------------- | ------------------------------------- |
| Maintainers    | One (in the StackBlitz org); Vue 3.6's reactivity is based on its algorithm              | The Preact team (six npm maintainers) |
| Facade fit     | Untracked reads need the low-level `setActiveSub`                                        | Public `untracked` and `peek`         |
| TC39 `Watcher` | Its `alien-signals/system` export would let us build a lazy, spec-shaped `Watcher` later | Effects only; internals are private   |

The facade's `Watcher` is built on effects in both, so a watched computed is re-evaluated when notified rather than when `getPending()` is read. For the binding (notify, then `getSnapshot` reads the cached value) that does no extra work.

**Recommendation: `@preact/signals-core`,** for its broader maintenance and public API. The facade keeps a later switch to about 50 lines.

## 5. DnD engine (O-5)

Three engines on the same week prototype (`dnd/`), sharing the grid, the coordinate lookup (cells' data attributes, no pixel rectangles), the snapped draft, autoscroll and resize:

- **Pointer Events (own):** mouse and pen start after 4px; touch after a 400ms long-press, then page scrolling is blocked for the drag.
- **Native DnD (own):** HTML drag and drop for moves and drag-out; resize by pointer.
- **Pragmatic DnD:** the same on Pragmatic's element adapter and auto-scroll; resize by pointer, as its docs recommend.

### Size (gzip, engine code only)

| Pointer Events (own) | Native DnD (own) | Pragmatic DnD |
| -------------------- | ---------------- | ------------- |
| 0.9 KB               | 0.9 KB           | 9.9 KB        |

### Mouse, in all three Playwright engines (`dnd/check.mjs`)

| Check                                  | Pointer Events | Native DnD | Pragmatic |
| -------------------------------------- | -------------- | ---------- | --------- |
| Move, snapped to a slot on another day | ✓              | ✓          | ✓         |
| Resize                                 | ✓              | ✓          | ✓         |
| Drag out to a drop target outside      | **✗**          | ✓          | ✓         |
| Escape cancels                         | ✓              | ✓          | ✓         |
| Autoscroll near the edge               | ✓              | ✓          | ✓         |
| Script time, 60-step drag, Chromium 4× | 16ms           | 3ms        | 8ms       |

**Finding 4 (changes the O-5 question):** candidate (a) in the open item, "our own Pointer Events code with native HTML drag-and-drop only at the calendar's boundary", **can't be built as one gesture**. A browser only starts a native drag from `dragstart`, at the beginning of the gesture; a pointer-driven drag can't turn into a native one when it reaches the edge. So drag-out (D-36, which also covers dragging between two calendars) needs native DnD from the start of every event drag, or a separate gesture. That makes the real choice: **native DnD for moves (own code or Pragmatic), with Pointer Events for resize**; or **Pointer Events for moves with a separate drag-out gesture**.

**Finding 5:** Pragmatic's `onDrag` is batched to animation frames, so code must not rely on it for the final position: the drop has to work out its own cell. Native code reading `dragover` directly doesn't have this trap.

### Touch (real devices)

The maintainer ran `dnd/TOUCH-CHECKS.md` on an iPhone (part number MPUA3LL/A, Safari 27.0.1) on 2026-10-30. The iPad and an Android phone were not run.

| Check                                  | Pointer Events         | Native DnD | Pragmatic                                           |
| -------------------------------------- | ---------------------- | ---------- | --------------------------------------------------- |
| Swipe on an event scrolls, no drag     | ✓                      | ✓          | ✓                                                   |
| Long-press starts a drag, no callout   | ✓                      | ✓          | ✓, but **the week jumps upward as the drag starts** |
| Move with a snapped preview, then drop | ✓                      | ✓          | ✓                                                   |
| Autoscroll near the edge               | ✓                      | ✓          | ✓                                                   |
| Resize                                 | ✓ (handle hard to hit) | ✓ (same)   | ✓ (same)                                            |
| Drag out to the drop box               | ✗ (by design)          | ✓          | ✓                                                   |
| Release outside cancels                | ✓, no visual feedback  | ✓          | ✓                                                   |

The first run showed the snapped preview stuck in the leftmost column in every engine; that was a prototype bug (inline styles applied in the wrong order), fixed and re-checked on the phone and in `dnd/draft-check.mjs`. The maintainer found Native and Pragmatic about equal to use, and didn't notice the platform's own drag preview next to ours.

**Finding 6:** Pragmatic's auto-scroll scrolls the container as soon as an iOS drag starts. Our own autoscroll, on the same native events, doesn't.

**Finding 7 (for S4, not the engine):** the 8px resize handle had to be zoomed to use. The spec already requires 44px targets on coarse pointers; touch resize needs a visible handle of that size, for example shown once the event is selected.

**Recommendation: native HTML drag and drop with our own code for moves and drag-out, and Pointer Events for resize** (and for slot selection, which isn't a drag of an existing element). It's the only approach that passed every check on every engine and on the iPhone, at 0.9 KB, and drag-out (D-36) is the same gesture as a move. Pragmatic adds 9.9 KB, mis-scrolls on iOS, and its frame-batched `onDrag` is a trap; its real value is handling browser quirks we'll have to cover ourselves, which the S4 interaction tests must exercise on all three engines and real devices. Pointer Events for moves would need a separate drag-out gesture. Native DnD on Android Chrome is untested here; the S4 real-device check (D-44) must include it.

## 6. Benchmark harness design (proposed, for S0)

What this prototype did, made permanent:

1. **Runner:** Playwright, with a plain in-page runner: fresh page per configuration, one cold run (recorded), one warm-up, the median of 10. No benchmark library.
2. **Profiles (D-44):**
   - Chromium with CDP `Emulation.setCPUThrottlingRate` 4, native Temporal: **gated at 50ms**;
   - WebKit unthrottled **with `Temporal` deleted by an init script** (Playwright's WebKit has native Temporal, so without this the polyfill budget measures nothing): **gated at 100ms**;
   - Firefox tracked; Chromium with the polyfill tracked (the floor predates native Temporal).
3. **Scenarios:** 5,000 events over a year and inside the visible range, for every view family as it lands (month and week in S1, agenda and timeline with virtualization later), plus single-event edits.
4. **What's timed:** kernel engine time (ingest plus view model) against the budgets; rendering separately through CDP `Performance.getMetrics` (script and layout time) from S1.
5. **Structural checks are tests, not timings:** "a single event change re-renders only the affected lanes" is asserted by counting lane recomputes, which is deterministic.
6. **Regression:** the PR build and `main` run in the same CI job on the same machine, back to back; a median more than 10% slower fails. If CI proves too noisy, D-44's fallback (relative tracking) applies.
7. **Output:** JSON results as a CI artifact, and a PR comment table (benchmark, budget, `main`, branch, change), as the `bench` skill describes.
8. **Real devices:** the per-slice device check (D-44) uses a results page like `safari.html`, which posts its numbers back to the harness.
9. **Sizes (D-63):** esbuild production bundles per entry point, minified and gzipped, the method in `size/measure.mjs`.
10. **The correctness corpus** from section 2 becomes part of the time-semantics conformance suite (D-42), run on both the native and the polyfill path.

## 7. Findings

1. `temporal-polyfill`'s `withPlainTime()` breaks T-10 in a repeated hour (section 2).
2. `temporal-polyfill` misses short DST suspensions: before 2022 and, as D-93 found, again from 2029 (section 2).
3. V8's native `Instant.compare` is about 9× slower than the polyfill's; Chromium needs the numeric fast path (section 3).
4. Pointer-driven drags can't become native drags at the boundary (section 5).
5. Pragmatic's `onDrag` is frame-batched (section 5).
6. Pragmatic's auto-scroll jumps when an iOS drag starts (section 5).
7. Touch resize needs a visible 44px handle (section 5, for S4).
8. Shipping Safari, even 27.0.1, has no native Temporal (section 2).
9. The polyfill path on an iPhone is over 100ms for 5,000 events, mostly ingest (section 2).

## 8. Answers (D-92)

Answered 2026-10-30; every recommendation was accepted:

1. **Polyfill:** `temporal-polyfill`, the `full` build.
2. **Its defects:** avoid `ZonedDateTime#withPlainTime` (lint rule in S0), run the corpus on both paths, document the pre-2022 DST suspensions as a known limitation, and report both upstream (drafts in `prototypes/p4-bench/temporal/UPSTREAM-ISSUES.md`, for the maintainer to post).
3. **Fast path:** cached `epochNanoseconds` BigInts, instant ordering only.
4. **Signals:** `@preact/signals-core`.
5. **DnD (O-5):** our own code on native HTML drag and drop for moves and drag-out; Pointer Events for resize and slot selection.
6. **Phones:** tracked at the device check, not gated; S1 measures lazy ingest.
7. **Harness:** section 6, as proposed.
8. **Cleanup:** on approval, remove the prototypes' installed packages and keep their `package.json` files.

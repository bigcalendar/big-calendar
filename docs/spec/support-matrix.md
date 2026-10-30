# Baseline 2025 support matrix (P2)

> **Normative.** P2, the Baseline 2025 support matrix. Researched and measured 2026-10-28; the maintainer's answers are recorded as **D-87**; the Temporal row is updated by D-92 and D-93 (P4). Changing anything here needs a new entry in the [decision log](../decisions.md).

Sources: D-20, D-21, D-43, [date engine](date-engine.md), [React and styling](react-and-styling.md), [interaction and accessibility](interaction-accessibility.md), [gap additions](gap-additions.md). Exit criteria: [roadmap](roadmap.md#planning-phase), row P2.

## Data and method

- **Baseline status** comes from `web-features` 3.44.0, the official Baseline data. **Per-browser versions and notes** come from `@mdn/browser-compat-data` 8.1.7. **The browser floor** comes from `baseline-browser-mapping` 2.11.34. All three were current on 2026-10-28.
- **"Baseline 2025"** means every feature that was Baseline (newly or widely available) by the end of 2025.
- **Measured, not looked up:** top-level `await` (finding 1) and the calendar systems (finding 5). Both used the harness in [`prototypes/p2-top-level-await/`](../../prototypes/p2-top-level-await/README.md), run in real Safari 26.6.2 (macOS 26.6.2) and in Playwright 1.64.1's Chromium 156, Firefox 157 and WebKit 27.2.

## Browser floor

The oldest versions that support all of Baseline 2025:

| Browser | Desktop | Mobile              |
| ------- | ------- | ------------------- |
| Chrome  | 141     | Chrome Android 141  |
| Edge    | 141     | —                   |
| Firefox | 145     | Firefox Android 145 |
| Safari  | 26.2    | Safari iOS 26.2     |

Chromium-based browsers (Samsung Internet, Opera, the Android WebView and so on) are supported when their Chromium engine is 141 or later. Browsers on this floor or later are "supported"; S0's browser-support policy (gap addition #21) publishes this table.

## Matrix

**Floor OK** means every browser on the floor supports the feature as we use it. A **no** in that column always has a plan in the last column.

### JavaScript and Intl

| Feature                                                                                                                               | Used for                                                                   | Baseline                                                                                   | Floor OK                  | Plan                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------- |
| Temporal                                                                                                                              | All time math ([date engine](date-engine.md))                              | No. Chrome/Edge 144, Firefox 139, no Safari (none in Safari 27.0.1 either, measured in P4) | **No**                    | `temporal-polyfill` through `@big-calendar/temporal` (D-32, D-92). How it loads: **finding 1** |
| Top-level `await`                                                                                                                     | The `temporal` loader (D-32)                                               | Newly available 2026-09-14 (Safari 27). Safari 15–26.6 is partial                          | **No** (Safari 26.2–26.6) | No top-level `await`: a `temporalReady` promise instead (D-87, finding 1)                      |
| ES modules, dynamic `import()`, `modulepreload`                                                                                       | Packaging (ESM only, D-21)                                                 | Widely available                                                                           | Yes                       | None                                                                                           |
| ES2025 built-ins: iterator helpers, `Set` methods, `Promise.try`, `RegExp.escape`, `Float16Array`, import attributes and JSON modules | Allowed in our code because we compile to ES2025 (D-21)                    | Newly available 2024-06 to 2025-05                                                         | Yes                       | None. A built-in newer than ES2025 needs a row here first                                      |
| `Intl.DateTimeFormat`, including `formatRange` and `timeZone`                                                                         | Formats (D-40, D-67)                                                       | Widely available                                                                           | Yes                       | None                                                                                           |
| `Intl.DurationFormat`                                                                                                                 | Durations (D-40)                                                           | Newly available 2025-03-04                                                                 | Yes                       | None                                                                                           |
| `Intl.PluralRules`, `Intl.Locale`, `Intl.supportedValuesOf`                                                                           | Messages (D-40), locale handling                                           | Widely available                                                                           | Yes                       | None                                                                                           |
| `Intl.Locale.prototype.getWeekInfo`                                                                                                   | First day of the week, weekend days, week numbering by locale (D-40, D-77) | Newly available 2026-07-21 (Firefox 153)                                                   | **No** (Firefox 145–152)  | CLDR week-data fallback table (D-87, finding 2)                                                |
| Non-Gregorian calendars in `Intl` (Islamic Umm al-Qura, Hebrew, Persian, Japanese)                                                    | `calendarSystem` (D-77)                                                    | Part of `Intl` (widely available)                                                          | Yes (measured)            | None. Tests must not compare exact strings across engines (finding 5)                          |
| `AbortController` / `AbortSignal`                                                                                                     | Superseded changes ([edit model](edit-model.md))                           | Widely available                                                                           | Yes                       | None                                                                                           |
| Module workers                                                                                                                        | Kernel in a web worker ([headless API](headless-api.md), way 4)            | Widely available                                                                           | Yes                       | None                                                                                           |

### DOM and APIs

| Feature                                  | Used for                                              | Baseline                   | Floor OK                        | Plan                                                                                                                                     |
| ---------------------------------------- | ----------------------------------------------------- | -------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Pointer Events, `setPointerCapture`      | All pointer interaction (§10)                         | Widely available           | Yes                             | None                                                                                                                                     |
| HTML drag and drop, `DataTransfer`       | Drag out and drag in from outside the calendar (D-36) | Widely available           | Yes                             | None. Pointer DnD inside the calendar is P4 (O-5)                                                                                        |
| Popover API                              | Popovers, "+N more", tooltips (D-43)                  | Newly available 2025-01-27 | Yes                             | None                                                                                                                                     |
| `popover="hint"`                         | —                                                     | No                         | No                              | **Don't use.** Tooltips use `popover="manual"` driven by the machine                                                                     |
| `<dialog>`, `requestClose()`             | Delete confirmation (D-50)                            | Widely; newly 2025-05-27   | Yes                             | None                                                                                                                                     |
| `<dialog closedby>`                      | —                                                     | No                         | No                              | **Don't use.** Light dismiss is handled by the machine                                                                                   |
| `inert`                                  | Collapsed panels, modal focus                         | Widely available           | Yes                             | None                                                                                                                                     |
| `ResizeObserver`, `IntersectionObserver` | Virtualization, sizing modes (gap addition #16)       | Widely available           | Yes                             | None                                                                                                                                     |
| `scrollend` event                        | Scroll-to-time, virtualization                        | Newly available 2025-12-12 | Yes (Safari 26.2 just makes it) | None                                                                                                                                     |
| `scrollIntoView({ container })`          | —                                                     | No                         | No                              | **Don't use.** Scroll-to-time sets `scrollTop`                                                                                           |
| Invoker commands (`commandfor`)          | —                                                     | Newly available 2025-12-12 | Yes                             | Not planned; available if P3 wants it                                                                                                    |
| Trusted Types                            | Strict-CSP compatibility (gap addition #15)           | Newly available 2026-02-24 | n/a                             | We never call the API. Compatibility means using no HTML sinks, so the floor doesn't matter. The S0 test harness enforces it in Chromium |
| `CSS.supports()`                         | Feature checks (D-43)                                 | Widely available           | Yes                             | None                                                                                                                                     |

### CSS

| Feature                                                       | Used for                                                  | Baseline                                                                                                    | Floor OK                        | Plan                                                                         |
| ------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| Cascade layers, `:where()`                                    | Zero-priority CSS (D-68)                                  | Widely available                                                                                            | Yes                             | None                                                                         |
| Custom properties                                             | Tokens, geometry variables (D-68)                         | Widely available                                                                                            | Yes                             | None                                                                         |
| Grid, subgrid                                                 | View structure (D-68)                                     | Widely available (subgrid since 2023-09)                                                                    | Yes                             | None                                                                         |
| Size container queries, container units                       | Responsive behavior (D-68)                                | Widely available                                                                                            | Yes                             | None                                                                         |
| Name-only and style container queries                         | —                                                         | Newly available 2026-05                                                                                     | No                              | **Don't use**                                                                |
| `:dir()`                                                      | Right-to-left behavior (D-35)                             | Widely available                                                                                            | Yes                             | None                                                                         |
| Logical properties                                            | Right-to-left layout                                      | Widely available                                                                                            | Yes                             | None                                                                         |
| Nesting, `:has()`, `:focus-visible`                           | Authoring                                                 | Widely available                                                                                            | Yes                             | None                                                                         |
| `forced-colors`, `prefers-reduced-motion`, `prefers-contrast` | Accessibility checks (gap addition #14)                   | Widely available                                                                                            | Yes                             | None                                                                         |
| `pointer` / `hover` media features                            | Coarse-pointer targets (§10)                              | Widely available                                                                                            | Yes                             | None                                                                         |
| `touch-action`                                                | Scroll versus select (§10)                                | Widely available                                                                                            | Yes                             | None                                                                         |
| `color-mix()`, relative colors, `light-dark()`                | Theme tokens                                              | Widely or newly available (2023–2024)                                                                       | Yes                             | None                                                                         |
| `@starting-style`, `transition-behavior`                      | Popover enter and exit motion                             | Newly available 2024-08                                                                                     | Yes                             | None                                                                         |
| `content-visibility`                                          | Optional virtualization aid                               | Newly available 2025-09-15                                                                                  | Yes                             | None                                                                         |
| `scrollbar-gutter`                                            | Stable scroll areas                                       | Newly available 2024-12-11                                                                                  | Yes                             | None                                                                         |
| CSS anchor positioning                                        | Popover and tooltip placement (D-43)                      | No. Chrome 125, Firefox 147, Safari 26; `position-anchor` partial before Chrome 151, Firefox 151, Safari 27 | **No** (Firefox 145–146)        | Fallback `@floating-ui/dom`, lazy-loaded (D-43). **Finding 3**               |
| `@scope`                                                      | —                                                         | Newly available 2026-03-24                                                                                  | **No**                          | **Don't use.** CSS Modules already scope our CSS (D-69). S0 adds a lint rule |
| `user-select`                                                 | Preventing text selection while dragging                  | No (Safari needs the prefix)                                                                                | Yes, with `-webkit-user-select` | Write `-webkit-user-select` and `user-select` together                       |
| `overscroll-behavior`                                         | Optional: stop scroll chaining in the timeline and agenda | No                                                                                                          | Partly                          | Progressive enhancement only; nothing depends on it                          |
| `contrast-color()`                                            | —                                                         | Newly available 2026-04-10                                                                                  | No                              | **Don't use.** Readable text color is computed in JS (gap addition #13)      |
| CSS module scripts (`with { type: 'css' }`)                   | —                                                         | No                                                                                                          | No                              | Not used. Our CSS Modules are a bundler feature (D-69)                       |

§10 above means [interaction and accessibility](interaction-accessibility.md).

## Findings

### 1. Top-level `await` breaks in Safari before 27 — decided: option B (D-87)

**What D-32 assumes.** `@big-calendar/temporal` uses top-level `await` to load the polyfill. Every package that uses Temporal imports it, so nothing in Big Calendar runs before Temporal exists.

**The bug.** Safari 15 to 26.6 has WebKit bug [242740](https://bugs.webkit.org/show_bug.cgi?id=242740). When several modules import a module with a pending top-level `await` _at the same time_, one import throws (`ReferenceError`, uninitialized variable) or resolves before the awaited work finishes. The bug is fixed in Safari 27 (released 2026-09-14). Our floor is Safari 26.2.

**What we measured** (5 runs per cell in Safari 26.6.2, 3 runs per cell in each Playwright engine; [raw results](../../prototypes/p2-top-level-await/results/)):

| Build                               | `static` | `late` | `concurrent`       | `mixed`            | `many`             |
| ----------------------------------- | -------- | ------ | ------------------ | ------------------ | ------------------ |
| Unbundled ESM                       | pass     | pass   | **throws**         | **throws**         | **throws**         |
| Vite 8.3.5                          | pass     | pass   | **silently wrong** | pass               | **silently wrong** |
| Rollup 4.66.0                       | pass     | pass   | **throws**         | **throws**         | **throws**         |
| esbuild 0.28.2                      | pass     | pass   | **silently wrong** | **silently wrong** | **silently wrong** |
| webpack 5.112.2                     | pass     | pass   | pass               | pass               | pass               |
| Rspack 2.2.9                        | pass     | pass   | pass               | pass               | pass               |
| Next.js 16.4.3 (Turbopack, webpack) | pass     | —      | pass               | —                  | pass               |

- These results are for Safari 26.6.2. In Chromium 156, Firefox 157 and WebKit 27.2, **every cell passes**, with native Temporal and with Temporal removed to force the polyfill path.
- "Silently wrong" means a module evaluated before the polyfill was installed: `Temporal` was missing, and nothing threw.
- webpack, Rspack and Next.js pass because they run top-level `await` in their own runtime, not the browser's.
- The failing pattern is **two or more lazy imports that reach the calendar at the same time**. Lazy routes, code splitting and Storybook (which builds with Vite and loads stories lazily) all produce it. Our own docs site would break in Safari 26.

**A second problem: CommonJS consumers.** Node's `require()` can load ESM-only packages (Node 22+), but not an ESM graph that contains top-level `await` (`ERR_REQUIRE_ASYNC_MODULE`). Jest's default CommonJS mode, which `next/jest` uses, therefore can't load our packages at all. Vitest, Jest in ESM mode, `node:test` and Deno all pass.

Without top-level `await` (option B), plain Node `require()` loads the packages, and so does Jest's CommonJS mode when Node runs with `--experimental-vm-modules`, which Jest needs for `require()` of any ESM-only package. With top-level `await`, Jest fails even with that flag. (Measured with a prototype of option B: `prototypes/p2-top-level-await/runners/optb/`.)

**Options:**

|     | Option                                                                                                                                                                                                                                                                                                                                              | Keeps                                                                                                                                     | Costs                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| A   | **Raise the Safari floor to 27** and keep D-32                                                                                                                                                                                                                                                                                                      | The D-32 design unchanged                                                                                                                 | Leaves Baseline 2025 for Safari (D-20). Excludes iOS devices that can't run iOS 27 and anyone not yet updated. CommonJS Jest still fails |
| B   | **No top-level `await`; an explicit ready promise.** `@big-calendar/temporal` exports `temporalReady`, already resolved when Temporal is native. React users never see it: `<Calendar>` waits for it internally. Headless and kernel users `await temporalReady` once before `createCalendar`, which gives a teaching dev error if called too early | Native browsers never download the polyfill; synchronous kernel APIs after that one wait; works with every bundler and with CommonJS Jest | Partly reverses D-32 (no longer "the app does nothing" for headless users)                                                               |
| C   | **No top-level `await`; import the polyfill statically** and install it only when needed                                                                                                                                                                                                                                                            | Synchronous everywhere, no ready step                                                                                                     | Every app ships the polyfill, even on browsers with native Temporal. Breaks D-32's "never download" and adds to every size budget (D-63) |
| D   | **Keep D-32 and document the workaround** (load the calendar from one static import; avoid concurrent lazy imports in Safari 26)                                                                                                                                                                                                                    | D-32 unchanged                                                                                                                            | Fragile, and the failure is often silent. Not recommended                                                                                |

**Decided: B** (D-87, amending D-32). It's the only option that keeps both the Baseline 2025 floor and "native browsers never download the polyfill". It also makes CommonJS consumers work. The cost falls on headless users only, as one documented `await`. The rules are in [date engine](date-engine.md).

**Also:** Next.js's webpack build warns that the default browser target "does not appear to support async/await" because of the top-level `await`. Under option B the warning goes away.

### 2. Week info is missing in Firefox 145–152 — decided: option (a) (D-87)

`Intl.Locale.prototype.getWeekInfo()` gives a locale's first day of the week, weekend days and minimum days for week 1. D-40 (`weekStartsOn` override) and D-77 (week numbering follows the locale) depend on it. Firefox added it in 153.

**Options:**

- **(a) Decided (D-87):** ship a small table generated from CLDR week data (the same source `getWeekInfo` uses), and use it only when `getWeekInfo` is missing. That's roughly 1 KB, generated at build time, so the CLDR data package (`cldr-core`) is approved as a build-time development dependency only. It is never shipped to users.
- **(b)** When it's missing, fall back to ISO weeks (Monday start) with a dev warning, and tell apps to set `weekStartsOn`. Firefox 145–152 users would see the wrong first day in many locales, for example Sunday-first in the US.
- **(c)** Raise the Firefox floor to 153. Not recommended.

### 3. Anchor positioning: the fallback check is enough if we never rely on initial values — decided (D-87)

D-43's check, `CSS.supports('anchor-name: --a')`, is true in Chrome 125+, Firefox 147+ and Safari 26+. Within the floor, **only Firefox 145–146** takes the `@floating-ui/dom` path.

Browsers that pass the check still differ on one thing: before Chrome 151, Firefox 151 and Safari 27, the _initial value_ of `position-anchor` is wrong. **The styling standard requires setting `position-anchor` explicitly on every anchored element** ([styling](../standards/styling.md)). Then the difference never matters, and D-43 needs no change.

### 4. Playwright's WebKit isn't shipped Safari — decided (D-87)

Playwright 1.64.1's WebKit 27.2 has **native Temporal** (no shipped Safari does: P4 confirmed Safari 27.0.1 on iOS has none, so every Safari user runs the polyfill), and it already has the top-level `await` fix. CI on it can't see Safari's real polyfill path or Safari 26 bugs. Decided, for S0 to implement ([testing](../standards/testing.md)):

- CI runs the Playwright suite **twice on every engine**: once as-is, and once with `Temporal` removed by an init script, so the polyfill path is always tested.
- The per-slice real-device check (D-44) includes **Safari 26.x on iOS or macOS** for as long as it's on the floor.

### 5. `Intl` output differs between engines — decided (D-87)

All five D-77 calendars format in Chromium, Firefox and WebKit, but the strings differ. For example, the Umm al-Qura month abbreviation is "Jum. I" in Chromium and Firefox and "Jmd. I" in WebKit, and the Japanese era date is "Oct 28, 8 Reiwa" in Chromium and Firefox but "Oct 28, Reiwa 8" in WebKit. **Tests compare `formatToParts()` structure or values, never full strings across engines.** This rule is in [testing](../standards/testing.md).

## Top-level `await` in bundlers and test runners

The exit criterion asks for top-level `await` to be confirmed across target bundlers and test runners. These are the supported targets (D-87). Each gets a CI smoke test from S0 that builds and runs a small sample app. Under option B, none depends on top-level `await`; the table records how each handled it in the P2 test.

| Tool                                  | Version      | Builds or runs top-level `await`                                                           | Polyfill split into its own chunk | Safari 26 safe     |
| ------------------------------------- | ------------ | ------------------------------------------------------------------------------------------ | --------------------------------- | ------------------ |
| Vite (Rolldown)                       | 8.3.5        | Yes                                                                                        | Yes                               | **No** (finding 1) |
| Rollup                                | 4.66.0       | Yes                                                                                        | Yes                               | **No**             |
| esbuild                               | 0.28.2       | Yes (ESM output)                                                                           | Yes                               | **No**             |
| webpack                               | 5.112.2      | Yes                                                                                        | Yes                               | Yes                |
| Rspack                                | 2.2.9        | Yes                                                                                        | Yes                               | Yes                |
| Next.js, Turbopack and webpack        | 16.4.3       | Yes (webpack warns about the target)                                                       | Yes                               | Yes                |
| Vitest (Node)                         | 5.0.5        | Yes                                                                                        | —                                 | —                  |
| Jest, ESM mode                        | 30.5.2       | Yes                                                                                        | —                                 | —                  |
| Jest, CommonJS mode                   | 30.5.2       | **No** (`ERR_REQUIRE_ASYNC_MODULE`); works under option B with `--experimental-vm-modules` | —                                 | —                  |
| `node:test`                           | Node 24.15.0 | Yes                                                                                        | —                                 | —                  |
| Deno (tested, not a supported target) | 2.9.7        | Yes (native Temporal)                                                                      | —                                 | —                  |

Vitest browser mode uses the same Playwright engines measured above. Storybook 10 builds with Vite, so it shares Vite's row.

## Decisions (D-87)

1. Finding 1: option **B**, a `temporalReady` promise; no top-level `await`. Amends D-32.
2. Finding 2: option **(a)**, a CLDR week-data fallback table; `cldr-core` approved as a build-time dependency.
3. Finding 3: always set `position-anchor` explicitly. D-43 unchanged.
4. Finding 4: the double Playwright run on every engine, and Safari 26.x in the per-slice real-device check.
5. Finding 5: compare `Intl` output by parts, never full strings across engines.
6. The browser floor and the "don't use" list above are approved.
7. The bundler and test-runner targets above are approved, each with a CI smoke test from S0.

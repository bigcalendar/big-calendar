# ERRORS

> Log any approach that took **more than 2 attempts** to get working: what failed, what worked,
> and a note for next time (Appendix B.4). Newest at the bottom.

## React components: 95%-function coverage bar + inline JSX handlers

**What didn't work:** shipping a component whose tests render it and assert markup, but don't *click*
every control. The Vitest coverage gate enforces **95% functions**, and every inline `onClick={() => …}`
arrow in JSX counts as its own function. `DefaultToolbar` failed at 66% functions because Today/Back
were never clicked (only Next).
**What worked:** exercise every interactive element in tests — click Today/Back/Next and at least one
view button. Then 100% functions.
**Note for next time:** for each view/chrome component, write at least one interaction test per handler
(or hoist handlers into a tested hook so the component body has fewer inline arrows). Applies to every
MonthView/TimeGridView/AgendaView control (drilldown clicks, event clicks, show-more, slot selection).

## React: CSS custom properties in `CSSProperties`

**What didn't work:** returning `{ '--bc-top': 0.5 } as CSSProperties` / a bare object literal —
`csstype`'s `Properties` rejects arbitrary `--*` keys (TS2353).
**What worked:** `type StyleWithVars = CSSProperties & Record<\`--${string}\`, string | number>`; build
the literal as `StyleWithVars`, return it as `CSSProperties` (assignable). No `any`, no double-cast.
**Note for next time:** reuse `StyleWithVars` (in `internal/geometry.function.ts`) anywhere a component
sets `--bc-*` inline.

## React: new core callbacks must be wired into `useCalendar`'s latest-ref wrapping

**What didn't work:** `useCalendar` creates the store **once** and spreads `...props` into the config, so
any callback passed through verbatim is frozen at the **first render**. `onEventDrop` was added to
`CalendarConfig` (Phase 5 5a) but not added to the per-callback wrappers, so the store kept calling the
first render's handler — which closed over the app's **initial `events`**. An optimistic-update + rollback
drop handler then reverted against the wrong snapshot: triggering one failed save reverted **every** prior
successful move (all events snapped back to their original positions), not just the failed one.
**What worked:** wrap it like every other callback —
`onEventDrop: props.onEventDrop ? (args) => propsRef.current.onEventDrop?.(args) : undefined`. Now the
**latest** handler runs and `previous = events` is the current list, so rollback only undoes the failed move.
Regression test in `useCalendar.test.ts` ("calls the LATEST onEventDrop…") asserts a re-rendered handler is
the one invoked.
**Note for next time:** EVERY new `CalendarConfig` callback (e.g. the upcoming `onEventResize`, `onDropFromOutside`)
must be added to the wrapped overrides in `useCalendar.ts` (read via `propsRef.current`, wrap-when-provided).
Pass-through via `...props` alone = a stale closure. Accessors (`draggableAccessor`, etc.) are typically pure
and don't have this problem, but a function accessor that closes over changing state would.

## CSS stacking: `position: relative` children intercept clicks intended for siblings

**What didn't work:**
1. Suspected `bc-week-events` (DOM 3, overlaying `bc-week-backgrounds` DOM 2) was blocking the click even with `pointer-events: none` — chased the wrong container.
2. Applied the `useCalendar.hook.ts` `onDrillDown` wrap-when-provided fix to the `dist/` thinking Storybook used it — Storybook uses `src/` via `viteFinal` aliases, so the dist change was irrelevant for testing.
3. Concluded drilldown was working but the story went blank (month-only story had no `TimeGridView` to render after drill to 'day') — this WAS also true and needed fixing, but was not the primary blocker.

**What worked:** Adding `position: relative` to `.bc-date-number` in `layout.css`. Root cause: `bc-segment` has `position: relative` (needed as a resize-handle positioning context, set in `event.css`); `bc-month-slot` also has `position: relative` (for the keyboard focus ring). CSS paint-order puts **positioned elements (step 6)** above **non-positioned block/inline (steps 3–5)** in the same stacking context. `bc-date-number` had no `position`, so it was step 3–5 — visually below `bc-month-slot` (step 6, DOM 1), which intercepted every click. `bc-segment` worked because DOM order within step 6 put it (DOM 3) above `bc-month-slot` (DOM 1). Making `bc-date-number` `position: relative` places it at step 6 with a DOM-tree position (inside DOM-2 `bc-week-backgrounds`) above `bc-month-slot` (DOM-1) but below `bc-segment` (DOM-3).

**Note for next time:** In overlapping CSS Grid layers (same `grid-row` / `grid-column`), **any element with `position: relative`** — even without a z-index — paints above ALL non-positioned siblings in the same stacking context regardless of DOM order. Check `position` on ALL elements in an overlap stack before debugging pointer-events. Also: Storybook `@big-calendar/react` stories import from `../src` — the `dist/` is never touched by Storybook.

## Storybook composition hub: spinner stalls on cold start (multiple refs)

**What didn't work:**
1. Adding `index: 'http://localhost:PORT/index.json'` to the dev-mode `refs` config in `core/.storybook/main.ts` — the `index` field is only respected in the static build path, not in dev mode. 404s for `stories.json`/`metadata.json` from Storybook's backward-compat probing continued.
2. The existing hidden iframe approach in `manager.ts` (`bc-hub-preview-init`) — on cold start (servers compiling), the 300 ms timeout fires before any `setGlobals` event arrives. The hidden iframe loads `localhost:6007/iframe.html`, which is the same origin as the hub's own preview iframe. Storybook composition routes postMessage events by `e.origin`; with two same-origin (6007) event sources, every event logs "found multiple candidates for event source" and is dropped, stalling the loading spinner permanently. Adding a second ref (Vue at 6008) made the race condition more likely by increasing total event volume.

**What worked:** Replace the hidden iframe with a `localStorage` cache strategy:
- `preview.ts` writes serialised `{ globalTypes, initialGlobals }` to `localStorage['__bc_hub_globalTypes_v1']` each time it loads (same-origin, shared with the manager).
- `manager.ts` reads from that cache after the 300 ms delay and emits `'setGlobals'` directly on the channel if globalTypes are still empty. No new iframe → no extra event source → no "multiple candidates".

**Note for next time:** In Storybook composition, the manager and hub preview share `localStorage` (same origin). The event name for setting globals in SB8–10 is `'setGlobals'` (camelCase string), not `'SET_GLOBALS'`. The `stories.json`/`metadata.json` 404s in the console are harmless backward-compat probes — they do NOT cause the spinner to stall; only extra same-origin event sources do.

## Time grid layout: gap between all-day row and time slots

**What didn't work:** Setting `block-size: 100%` on `.bc-time-grid` and adding `grid-row: 1` to view host elements (`bc-month-view`, `bc-time-grid-view`, `bc-agenda-view`) to ensure all three occupied the same explicit `1fr` row in `.bc-calendar`. This addressed the circular height resolution for `overflow: auto`, but still left a visual gap between the all-day row and the scrollable time body.

**What worked:** Changing `.bc-time-grid`'s `grid-template-rows` from `auto auto` to `auto 1fr`. The first `auto` row sizes the header/all-day section to content; the `1fr` row gives the time slot body all remaining space, eliminating the gap.

**Note for next time:** When a grid contains a fixed-height header and a scrollable body, `auto 1fr` is the right pattern — not `auto auto`. `auto auto` leaves leftover space unallocated, which appears as a gap below the header rows.

## @storybook/angular: getting Angular Storybook to build

**What didn't work:** `storybook dev` (throws `AngularLegacyBuildOptionsError`); `angular.json` without a build target; `render: () => ({ component: X })` (not in `StoryFnAngularReturnType`); `component: X` on `: StoryObj` stories (TS2353 — not in `StoryAnnotations`); importing CSS in `preview.ts` (no webpack CSS loader); adding `style-loader`/`css-loader` via `webpackFinal` (not resolvable as pnpm transitive deps).

**What worked:**
- `angular.json` needs: `@angular-devkit/build-angular:ng-packagr` build target (requires `ng-package.json` with `"project": "ng-package.json"`) + storybook targets with `browserTarget: "angular:build"`.
- Start via `ng run angular:storybook`, not `storybook dev`.
- Angular story exports with `component: X`: omit `: StoryObj` annotation (inferred type is fine). Stories with args use `StoryObj<TArgs> & { component?: unknown }`.
- Global CSS: put in `angular.json` `styles[]` as `"node_modules/@big-calendar/styles/dist/index.css"` — NOT in `preview.ts`.
- `verbatimModuleSyntax`: Angular lifecycle interfaces (`OnInit`, `OnDestroy`, etc.) must use `import type`.

**Note for next time:** `ng run angular:storybook` only. CSS in `angular.json styles[]`. Story-level `component` needs no `: StoryObj` annotation.

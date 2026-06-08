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

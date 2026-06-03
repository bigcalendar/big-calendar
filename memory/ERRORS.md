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

# `@big-calendar/styles` — class & geometry vocabulary

The single source of truth for the markup contract. Framework component packages
(React first) attach **only** these class names and set the geometry custom
properties below; they ship no CSS of their own (plan §6). Everything reads
`--bc-*` tokens (see `src/tokens.css`).

## Cascade layers

`@layer bc.reset, bc.tokens, bc.layout, bc.components, bc.theme, bc.overrides;`

Host overrides target `bc.overrides` or sit outside all layers to win reliably.

## Geometry contract (adapter sets these inline)

Core emits **normalized numbers**; CSS turns them into placement. The adapter
writes them as inline custom properties on the element.

| Element | Custom props | Meaning |
|---|---|---|
| `.bc-event`, `.bc-bg-event` (in `.bc-day-column`) | `--bc-top`, `--bc-height`, `--bc-left`, `--bc-width` | fractions `0..1` of column (top/height = slot metrics; left/width = day-layout algo) |
| `.bc-event` | `--bc-z` | integer paint order (`zIndex`) |
| `.bc-segment` (month / all-day) | `--bc-seg-left`, `--bc-seg-span`, `--bc-seg-row` | 1-based start column, column span, stack level |
| `.bc-now-indicator` | `--bc-now-top` | fraction `0..1` down the column |
| `.bc-selection` | `--bc-top`, `--bc-height` | fractions of the column (drag highlight) |

Containers also carry counts: `--bc-day-count` (time grid / all-day),
`--bc-week-count` (month), `--bc-slot-count` (time-grid body height).

## Class names

**Root:** `.bc-calendar` (positioning + container context) › `.bc-viewport`
· `.bc-toolbar` `.bc-toolbar-group` `.bc-toolbar-label`

**Month:** `.bc-month` › `.bc-month-header` (`.bc-weekday`, `.bc-weekday-long`,
`.bc-weekday-short`) · `.bc-month-grid` › `.bc-month-week` ›
`.bc-week-backgrounds` (`.bc-date-cell` + `.bc-date-number`) ·
`.bc-week-events` (`.bc-segment`). State: `.bc-today`, `.bc-off-range`.
Overflow: `.bc-show-more`.

**Time grid:** `.bc-time-grid` › `.bc-time-header` (`.bc-day-heading`) ·
`.bc-allday-row` (`.bc-allday-label`, `.bc-allday-segments` › `.bc-segment`) ·
`.bc-time-body` (`.bc-time-gutter` › `.bc-time-label`; `.bc-day-column` ›
`.bc-event` / `.bc-bg-event` / `.bc-now-indicator` / `.bc-selection`).

**Agenda:** `.bc-agenda` › `.bc-agenda-header` · `.bc-agenda-body` ›
`.bc-agenda-day` (`.bc-agenda-date`, `.bc-agenda-time`, `.bc-event`).
Empty: `.bc-agenda-empty`.

**Event internals:** `.bc-event-title`, `.bc-event-time`. Selected: `.bc-selected`.

**Top layer:** `.bc-popover` (`[popover]`, `.bc-popover-title`), `.bc-tooltip`.

## RTL & responsive

All edges use logical properties; direction comes from the document + `:dir()`
— no `rtl` prop. Responsive collapsing is driven by `@container bc (...)` on the
calendar's own inline size, not the viewport.

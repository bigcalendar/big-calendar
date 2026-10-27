# Data model

> **Normative.** Split verbatim from the approved plan (`plan/P1-PLAN.md` §6, approved 2026-10-27). Changing anything here needs a new entry in the [decision log](../decisions.md).

_The field-level spec is P5. This section locks its principles._

- **Canonical event shape plus `meta`. No accessors.** The library defines the event shape, and consumer-specific data goes in `meta?: TMeta`. The kernel never mutates consumer objects.
- **Resources** have a canonical shape with `id`, `title`, optional `parentId` (hierarchy) and `meta`.
- **An event may belong to several resources** and renders in every matching resource lane.
- **The Unassigned lane is opt-in.** It holds events that match no configured resource, including events with no `resourceIds` at all, and serves as a drop target for assigning and unassigning. When the lane is disabled, those events aren't drawn in resource views, and the kernel exposes a read-only count of them so apps can show a badge (D-38).
- **Background events** are a separate `backgroundEvents` collection with the same canonical fields, kept outside the edit pipeline (D-39):
  - **Inert.** They aren't focusable or draggable, and slot selection passes through them. Their titles are added to the accessible description of the slots they cover.
  - **Where they show:** blocks behind events in the time grid and timeline; in the day grid, an all-day background event tints its cells.
  - **Resources:** in a resource view, a background event shows only in the lanes of its `resourceIds`. One with no `resourceIds` is **not displayed** there. In views without resources it's shown normally.
- **The kernel accepts canonical strings only.** Other input forms go through `@big-calendar/normalize`.
- **Invalid events never throw.** They are skipped and reported through `onDataIssue` and the dev console.
- **Edit permissions cascade.** `draggable`, `resizable` (`true`, `false`, `'start'` or `'end'`) and `readOnly` can be set on the event, then its resource, then its event source, then the whole calendar (D-83). The most specific level that sets a value wins.

# Engine model — "hybrid"

> **Normative.** Split verbatim from the approved plan (`plan/P1-PLAN.md` §5, approved 2026-10-27). Changing anything here needs a new entry in the [decision log](../decisions.md).

## Shared primitives (internal at 1.0, exported under `/unstable`)

| Primitive        | Responsibility                                                                                                                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Axis**         | Maps time to position. It can be **discrete** (one cell per day) or **continuous** (minutes within a day, or a range spanning several days). It handles `min`/`max`, `step`/`timeslots`, and 23- or 25-hour DST days. |
| **Lanes**        | An ordered list of lane keys. Lanes can be days, resources, resources × days, or custom keys assigned by `laneOf(event)`.                                                                                             |
| **Segmentation** | Clips events to the visible range and splits them at lane and row edges.                                                                                                                                              |
| **Packing**      | **`stack`** grows rows up to a maximum, then shows "+N more". **`divide`** fits events side by side in a fixed lane width (overlap / no-overlap). A custom packing function is also supported.                        |
| **Coordinates**  | A lane index × axis index space that selection, keyboard navigation and DnD all operate in. There is no pixel hit-testing.                                                                                            |

## Families

| Family        | Axis                        | Lanes                                | Packing                                | Views at 1.0                                                    |
| ------------- | --------------------------- | ------------------------------------ | -------------------------------------- | --------------------------------------------------------------- |
| **Day grid**  | discrete days               | week rows                            | stack                                  | month, plus custom configs (e.g. 2-week)                        |
| **Time grid** | continuous within a day     | days, or resources × days            | divide (overlap / no-overlap / custom) | day, week, work week, N-day; resource-major and day-major       |
| **Timeline**  | continuous across the range | resources, days, or resources × days | stack                                  | hours scale only at 1.0; no zoom; virtualized rows              |
| **Agenda**    | — (a list)                  | —                                    | —                                      | RBC parity (`length`) plus a custom range function; virtualized |

- The time grid's **all-day row is an embedded day-grid instance**. It shares stacking, overflow, selection and keyboard behavior with the day grid, plus a defined focus hop between the all-day row and the time body (P3).
- Each family has **its own accessibility semantics** (P3). For example, the month grid is read row by row and the time grid column by column.
- **Extensibility at 1.0:** custom packing functions, custom family configurations, and custom lanes (`lanes` plus `laneOf(event) => key | key[]`). Resources are just the built-in lane case.
- **Fully custom views at 1.0, at RBC parity (D-66).** A developer registers a view with `range`, `navigate` and `title`. Their component receives that range's events and expanded occurrences, resolved to the display zone, and draws them however it likes, using any headless hooks it wants.
- Authoring a **new family on our layout primitives** is not in 1.0; those primitives stay unstable.
- **Resource hierarchies** exist in the data model (`parentId`). The only built-in hierarchical display is the resource panel's collapsible tree ([React and styling](react-and-styling.md)). Grid and timeline headers stay flat at 1.0.

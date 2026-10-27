# Event fields

> **Normative.** Split verbatim from the approved plan (`plan/P1-PLAN.md` §6.0, approved 2026-10-27). Changing anything here needs a new entry in the [decision log](../decisions.md).

| Field                                | Type                                        | ICS                              | Notes                                                                                               |
| ------------------------------------ | ------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------- |
| `id`                                 | `string \| number`                          | `UID`                            | Required, unique; duplicates get a dev warning                                                      |
| `title`                              | `string`                                    | `SUMMARY`                        | Required                                                                                            |
| `start` / `end`                      | date or instant string                      | `DTSTART` / `DTEND`              | Exclusive end (T-3); a missing end follows T-9                                                      |
| `timeZone` / `endTimeZone`           | IANA zone                                   | `TZID`                           | [time semantics](time-semantics.md)                                                                 |
| `resourceIds`                        | `ResourceId[]`                              | none                             |                                                                                                     |
| `sourceId`                           | `SourceId`                                  | none                             | The event source the event belongs to (a named, colored group such as 'Work' or 'Holidays') (D-73)  |
| `tooltip`                            | plain text                                  | none                             | Accessible tooltip text; defaults to a composed title and time (D-74, RBC `tooltipAccessor` parity) |
| `rrule`, `exDates`, `rDates`         | string or object; date or instant strings   | `RRULE`, `EXDATE`, `RDATE`       | Read by the recurrence module                                                                       |
| `recurringEventId`, `recurrenceId`   | id; date or instant string                  | `RECURRENCE-ID`                  | Marks an **override**: a separate event that replaces one occurrence of a series                    |
| `categories`                         | `string[]`                                  | `CATEGORIES`                     |                                                                                                     |
| `status`                             | `'confirmed' \| 'tentative' \| 'cancelled'` | `STATUS`                         |                                                                                                     |
| `busy`                               | `boolean`, default `true`                   | `TRANSP`                         | Free events (`busy: false`) never count as conflicts                                                |
| `color`                              | string                                      | `COLOR` (RFC 7986)               | Overrides the resource's color                                                                      |
| `description`, `location`, `url`     | plain text                                  | `DESCRIPTION`, `LOCATION`, `URL` |                                                                                                     |
| `descriptionHtml`                    | `UntrustedHtml` (branded string)            | `X-ALT-DESC`                     | Can't be used as a safe string without an explicit sanitize step; the prebuilt UI never renders it  |
| `draggable`, `resizable`, `readOnly` | permission cascade (D-24)                   | none                             |                                                                                                     |
| `meta`                               | `TMeta`                                     | imported `X-` properties         | The app's own data                                                                                  |

- **`allDay` is not an input field.** The kernel derives it from the value types (T-1) and exposes it read-only on processed events. `normalize` converts RBC-style `allDay: true` records.
- P5 writes the final TypeScript types from this table. Adding or removing a field is a plan change.

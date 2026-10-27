# Opt-in modules

> **Normative.** Split verbatim from the approved plan (`plan/P1-PLAN.md` §12, approved 2026-10-27). Changing anything here needs a new entry in the [decision log](../decisions.md).

- **Recurrence:** full RFC 5545 RRULE, including RDATE, EXDATE and per-occurrence overrides. Expansion is windowed and lazy, and occurrence identity is stable.
- **Availability and conflicts:** business hours, per-resource working hours and capacity, and conflict detection when creating or moving events.
- **ICS:** import and export. HTML-bearing fields such as `X-ALT-DESC` are **kept raw and typed as untrusted, never sanitized by the parser**. The docs point consumers to DOMPurify or the Sanitizer API, and the prebuilt UI never renders HTML fields. Zoned all-day round-trips follow T-13.
- **Normalize:** converts `Date` objects, epoch values, `YYYY-MM-DD HH:mm` strings and inclusive database end dates into canonical strings, and reports any problems it finds.

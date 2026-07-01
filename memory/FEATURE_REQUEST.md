# Feature Requests

## Recurrence Rule Support

**Requested:** 2026-06-25
**Status:** Tabled — not yet built into BC

**What was requested:** Support for recurring events using recurrence rules (e.g. RRule format — "every weekday at 9am", RRULE strings, etc.).

**Context:** Came up while planning `@big-calendar/mcp`. Recurrence is a natural fit for a scheduling library and would pair well with MCP tooling to generate recurrence rules from natural language. Tabled until BC's core event model is more mature.

**When to revisit:** Once the core event model, accessors pattern, and view rendering are stable. The MCP server should include a `build-recurrence-rule` tool once this is supported natively.

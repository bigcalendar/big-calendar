# Vision

> **Normative.** Split verbatim from the approved plan (`plan/P1-PLAN.md` §1–§2, approved 2026-10-27). Changing anything here needs a new entry in the [decision log](../decisions.md).

## Why we are restarting

Attempt 1 (June–July 2026, 220 commits, 5 framework adapters) is archived, and **nothing is salvaged**. The root cause was **poor up-front planning: decisions were made inline during the build.** That showed up in three ways:

1. **The headless boundary was in the wrong place.** Keyboard roving, slot selection, keyboard DnD, long-press and click/double-click handling lived in the adapters. It was written five times, about 25k lines of adapter code against 4.5k in core. One accessibility correction (Phase 14) took 32 tasks.
2. **Foundations were left open while adapters shipped.** The event model, resources, recurrence and ICS were still undecided after five UIs existed, so every later change had to be made five times.
3. **Process overhead outweighed the product.** Per-adapter checklists and story parity, a Storybook composition hub, an MCP server and codemods were all built before the API was stable.

This plan addresses each one: decisions come first ([execution rules](../standards/workflow.md), [planning phase](roadmap.md#planning-phase)), behavior lives in framework-free layers ([architecture](architecture.md)), and the build proceeds in vertical slices with a maintainer gate after each ([slice roadmap](roadmap.md#slice-roadmap)).

## Vision

Big Calendar is a toolkit for building calendaring and scheduling applications. It is the successor to react-big-calendar (RBC), with a deliberately breaking API.

- **Headless first.** A framework-free engine computes everything: time math, layout, selection, keyboard and drag-and-drop behavior. A framework binding only connects that engine to the framework's reactivity.
- **Optional prebuilt UI that can be replaced piece by piece.** A complete, accessible calendar works out of the box, and any part of it can be decorated or replaced.
- **Two audiences, served equally.** RBC users migrating to Big Calendar get parity, a mapping table and codemods. Developers building new scheduling apps get composable primitives.
- **Standards-aligned time.** ICS (RFC 5545) semantics, RFC 3339 and RFC 9557 strings, and Temporal for the math.
- **Baseline 2025 web platform.** Any feature outside Baseline 2025 needs a verified polyfill or fallback.
- **Accessible by specification.** Target WCAG 2.2 AA. The accessibility spec is written and screen-reader-tested before any framework code.
- **Fast by budget.** Performance targets are numeric and enforced by CI benchmarks.
- **Client-side only.** Everything runs in the browser. Big Calendar contains no server components, server rendering or server processes; the consuming app handles all server-side interaction (D-41).

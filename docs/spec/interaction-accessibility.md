# Interaction and accessibility

> **Normative.** Split verbatim from the approved plan (`plan/P1-PLAN.md` §10, approved 2026-10-27). Changing anything here needs a new entry in the [decision log](../decisions.md).

- **The standard is WCAG 2.2 AA.** The roles, keyboard model, focus management and screen-reader announcements for each family are specified in **P3** ([accessibility](accessibility.md), D-91) and validated on a **vanilla (no framework) prototype** with VoiceOver and NVDA (plus JAWS if available) **before any framework code**.
- **Machines own all behavior:**
  - roving focus;
  - slot selection by pointer, touch long-press and Shift+Arrow;
  - event activation (click, double-click, and a keyboard alternative for the secondary action);
  - DnD by pointer, touch and keyboard, including dragging from outside the calendar;
  - "+N more" overflow;
  - focus hops between the all-day row and the time body.
- **Mapping uses coordinates, not pixels.** Machines read `data-*` coordinates from real DOM cells; there is no pixel-rectangle hit-testing.
- **Pointer handling uses Pointer Events.** `touch-action` settles scroll-versus-select conflicts. On coarse pointers, hit targets are at least 44px and no feature depends on hover alone.
- **Top-layer UI** (popovers, overflow, tooltips) uses the Popover API and `<dialog>` with CSS anchor positioning. Where `CSS.supports('anchor-name: --a')` is false, `@floating-ui/dom` is lazy-loaded for positioning only (D-43).
- **Drafts are typed.** Every temporary event is one of `creation`, `internal-drag`, `internal-resize` or `external-drag`. Each carries its surface (day grid, time grid or timeline), its proposed start and end, its target resource, and, for internal drags, the source resource. Machines produce drafts, and the exact payloads are specified in P5.
- **Keyboard model (D-51).**
  - **One Tab stop per grid.** Each grid uses a roving `tabIndex`, with arrow keys moving inside it, and events form their own group with one Tab stop.
  - **Per-slot cells.** Every time-grid slot is a focusable cell, so arrow keys move slot by slot and Shift+Arrow extends a selection.
  - **Context menus** open with Shift+F10 or the menu key. Enter and Space activate the focused event.
- **Patterns adopted from MUI X Scheduler (D-50), as P3 requirements:**
  - **Event names** are built from localized parts (title, time or "All day", date, resource, "Recurring") by an overridable composer.
  - **Hidden from assistive tech (`aria-hidden`):** drag previews, multi-day continuation pieces, color dots, icons and the decorative time axis.
  - **Grid metadata:** `aria-rowcount`/`colcount`/`rowindex`/`colindex`, and `aria-current="date"` on today. Week numbers are hidden but attached to each day with `aria-labelledby`.
  - **Landmarks:** the calendar is a labelled `<section>`. The side panel is an `<aside>` controlled by a toggle with `aria-controls` and `aria-expanded`, and is `aria-hidden` while collapsed.
  - **Announcements:** the toolbar's date label is a polite live region.
  - **Menus:** the view switcher uses `menuitemradio` with `aria-checked`.
  - **"+N more" popover:** a full-date header, the same event names as the grid, and focus returning to the button, or to the day cell if the button disappears.
  - **Mini calendar:** a grid with roving `tabIndex`, `aria-selected`, `aria-current` and arrow keys.
  - **Resource panel:** the tree pattern, with Space toggling visibility.
  - **Read-only and delete:** read-only events show "Show details" and no Delete. Delete confirmation is a modal with `aria-describedby`, and focus returns to whatever opened it.
  - **Touch:** on coarse pointers, tapping an event shows an action toolbar instead of a context menu.
  - **Docs:** a public accessibility page stating WCAG 2.2 AA, the relevant laws (ADA, Section 508, EAA) and known limitations.

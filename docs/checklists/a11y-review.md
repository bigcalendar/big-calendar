# Accessibility review

Source: [interaction and accessibility](../spec/interaction-accessibility.md), D-50, D-51, [gap additions](../spec/gap-additions.md) #13 and #14. The per-family requirements are in [accessibility](../spec/accessibility.md) (P3, D-91), which governs wherever this list is less specific.

## Automated

- [ ] axe reports zero violations on every affected story, on all three engines.
- [ ] Interaction tests query by role and accessible name.

## Structure and names

- [ ] The calendar root is a labelled `<section>`; the side panel is an `<aside>` controlled by a toggle with `aria-controls` and `aria-expanded`, and `aria-hidden` and `inert` while collapsed.
- [ ] Grids carry `aria-rowcount`/`colcount`/`rowindex`/`colindex`; today has `aria-current="date"`; week numbers are hidden and attached to days with `aria-labelledby`.
- [ ] Event names come from the overridable composer (title, time or "All day", date, resource, "Recurring"), start with the part's visible label (WCAG 2.5.3), and are the same in the grid and the "+N more" popover.
- [ ] Drag previews, continuation pieces, color dots, icons and the decorative time axis are `aria-hidden`.
- [ ] Background events are inert, and their titles are in the accessible description of the slots they cover.
- [ ] Every user-facing string comes from `messages` (D-40), not a hard-coded literal.

## Keyboard and focus (D-51)

- [ ] One Tab stop per grid, roving `tabIndex`, arrows inside; events are their own group with one Tab stop.
- [ ] Every time-grid slot is a focusable cell; Shift+Arrow extends a selection.
- [ ] Context menus open with Shift+F10 or the menu key; Enter and Space activate the focused event.
- [ ] In right-to-left layouts, Left and Right swap meaning (D-35).
- [ ] Focus returns to the opener when a popover, menu or dialog closes ("+N more" returns to its button, or to the day cell if the button is gone).
- [ ] Every pointer action has a keyboard path (selection, DnD, secondary action).

## Announcements

- [ ] The toolbar date label is a polite live region.
- [ ] Rolled-back changes and invalid drafts are announced; rollback is the only assertive message.
- [ ] Live-region messages are debounced and cleared before each message, so a keyboard move announces only where it settled.

## Pointer and touch

- [ ] Hit targets are at least 44px on coarse pointers; nothing depends on hover alone.
- [ ] Tapping an event on a coarse pointer shows the action toolbar, not a context menu.

## Visual

- [ ] Forced colors mode keeps every state distinguishable.
- [ ] 400% zoom reflows without loss of content or function (WCAG 1.4.10).
- [ ] Reduced motion is respected.
- [ ] Event text meets WCAG contrast on any event color.

## Manual

- [ ] The [screen-reader script](screen-reader-script.md) has been run for this slice and its results recorded in the PR.

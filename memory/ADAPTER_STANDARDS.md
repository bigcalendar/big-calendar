# ADAPTER_STANDARDS — Cross-Framework Parity Rules

> Read this file before starting **any** of the following:
> - A new framework adapter phase
> - A feature or API addition to an existing adapter
> - Any change that touches HTML structure, CSS classes, or Storybook wiring
> - A new Storybook story or MDX doc in any framework package
>
> These rules exist because we have paid repeated debugging costs catching the same
> class-of issue across React, Vue, and Angular. Every new adapter and every
> cross-cutting change must satisfy all of these before the work is declared done.

---

## 1. Pre-implementation review

Before writing any code for a new adapter or cross-cutting change, read:

- **DECISIONS.md** — active decisions (Phase 11 onward). Check for standing rules that apply to the work.
- **DECISIONS-ARCHIVE.md** — historical decisions. Use the Quick Topic Index to locate relevant entries (e.g. DnD architecture, CSS token layer design, store callback wiring).
- **ERRORS.md** — failed approaches. If the task is similar to a logged failure (e.g. "new callback wiring", "CSS stacking", "coverage gate"), skip straight to what worked.

---

## 2. Package alias rule

`@big-calendar/*` packages are **always** imported via alias in Storybook and in test (vitest) configs — never via relative `../../` paths or `node_modules` resolution.

**How aliases are registered:**

1. All canonical aliases live in `packages/aliases.ts` → `packageAliases(pkgsDir)`.
2. Every framework Storybook wires them in `.storybook/main.ts` → `viteFinal`:
   ```ts
   viteFinal: (config) => {
     const pkgs = resolve(import.meta.dirname, '../..')
     config.resolve ??= {}
     config.resolve.alias = { ...(config.resolve.alias as Record<string, string>), ...packageAliases(pkgs) }
     return config
   }
   ```
3. Every vitest config passes `resolve: { alias: packageAliases(pkgsDir) }`.

**When adding a new adapter package `@big-calendar/foo`:**
- Add its alias to `packages/aliases.ts` before writing any stories or tests that import it.
- Verify the alias resolves to `packages/foo/src/index.ts` (or the package root).

---

## 3. Framework harness setup

Every adapter needs a `stories/harness.ts` (or `.tsx`) that exports:

| Export | Value | Purpose |
|---|---|---|
| `localizer` | Temporal localizer, upgradeable by toolbar | Default; overridden by decorator |
| `NOW` | `'2026-06-15T12:00:00.000Z'` | Frozen "now" — stable today highlight + now-indicator |
| `FOCUS` | `'2026-06-15'` | Fixed open date — deterministic rendering |

The localizer **must** be wired to the Storybook toolbar globals via the shared decorator in `packages/storybook-shared`. In `withLocalizerDecorator` (or the framework equivalent), `useLocalizerContext()` / `localizerRef` supplies the active localizer; the harness localizer is only the cold-start default.

`CalendarStage` (React) / the equivalent wrapper component (Vue, Angular) must:
- Pass `ctxLocalizer ?? localizer` so toolbar changes propagate.
- Pass `getNow={() => NOW}` and `defaultDate={FOCUS}` so renders are deterministic.

---

## 4. Story file parity

### Canonical story file list (all adapters must have these)

```
Introduction.mdx
Calendar.stories.*
CalendarViews.mdx
CalendarProvider.mdx
CalendarToolbar.mdx
CalendarCustomComponents.mdx
Localization.stories.*
BackgroundEvents.stories.*  +  BackgroundEventsOverview.mdx
CustomRendering.stories.*
EventCallbacks.stories.*    +  EventCallbacksOverview.mdx
EventDragAndDrop.stories.*
DropFromOutside.stories.*
DragAndDrop.mdx
EventTypeAccessor.stories.* +  EventTypeAccessor.mdx
Resources.stories.*         +  ResourcesOverview.mdx
ResourceTypeAccessor.stories.* + ResourceTypeAccessor.mdx
Selectable.stories.*        +  SelectionOverview.mdx
PrimitivesDialog.mdx
PrimitivesPopover.mdx
PrimitivesTooltip.mdx
UtilitiesEventTime.mdx
UtilitiesGeometryStyles.mdx
AdvancedHeadlessAPI.mdx
AdvancedDataHooks.mdx
AdvancedInteractionHooks.mdx
AdvancedUseMonthView.mdx
AdvancedUseTimeGridView.mdx
AdvancedUseAgendaView.mdx
{Framework}Patterns.mdx        ← framework-specific patterns (AngularPatterns, VuePatterns, etc.)
```

**Framework-specific only (add when the feature is implemented for that adapter):**
- `AdvancedFloatingAnchor.mdx` — floating UI anchoring
- `CalendarCustomViews.mdx` — view registry (React-specific pattern; add for others if ViewRegistry is exposed)
- `Migration.mdx` — migration guide (React only; add for others if a migration path exists)

### Story ordering within a file

Stories inside each `.stories.*` file must appear in the same order across all adapters. If React's `Calendar.stories.tsx` exports `Standard → ScrollToTime → TimeWindow`, then `Calendar.stories.ts` for Vue and Angular must export them in that same sequence.

### Story names (storyName / name)

Human-readable story names (`storyName` in React, `name` in Vue/Angular) must be **identical** across adapters. If React has `'Day View — Resource Lane Colours'`, every other adapter must use the same string.

---

## 5. Story content parity

### MDX docs

**`<Meta title>` must match the Storybook sort order exactly.** The title path determines where the doc appears in the sidebar. A mismatch (e.g. `"DragAndDrop/Overview"` instead of `"Drag & Drop/Overview"`) orphans the page outside the intended group. Always verify each MDX title against:
1. The framework's `preview.ts` `storySort.order` array.
2. The story `title:` in the corresponding `.stories.*` file (both must share the same top-level group string).

MDX prose content (concept explanations, tables, code samples) must be structurally equivalent across adapters. Permitted differences:

- Framework-specific import paths (`import { Calendar } from '@big-calendar/react'` vs `from '@big-calendar/vue'`).
- Framework-specific syntax in code blocks (JSX vs SFC template vs Angular template).
- Framework-specific hook/directive names (`useMonthView` vs `injectMonthView`).

Content that must be **identical**: section headings, the explanatory narrative, the CSS selector examples, and the data-attribute documentation.

### `args` and `argTypes`

Every story `args`/`argTypes` block must be present and complete in all adapters. Do not omit an `argType` because it is "hard to wire in this framework" — work out the wiring. The Controls panel is non-negotiable.

Each `argTypes` entry must include:
- `control` — the correct Storybook control type.
- `description` — the same description string used in the React story.

---

## 6. HTML and CSS output parity

### Class names

All adapters produce the same `bc-*` CSS class names on every element. There are **no adapter-specific class names**. When adding a new element to any adapter's template, use the class name that exists in the shared CSS (`packages/styles/src/`). If no class exists for the element yet, add it to styles first and apply it consistently in all adapters.

### Data attributes

All adapters emit the same `data-bc-*` attributes on the same elements:
- `data-bc-event` on event buttons (stringified event id)
- `data-bc-resource` on resource columns and all-day cells
- `data-bc-resource-type` on resource columns and all-day cells (when `resourceType` accessor is set)
- `data-bc-allday` on all-day slots
- `data-bc-instant` on time slots
- `aria-selected` on event buttons

### DOM structure

The nesting order of elements within a view must mirror the React implementation exactly:
- `bc-time-head` → `bc-time-header` → `bc-time-header-gutter` + heading cells
- `bc-time-head` → `bc-allday-row` → `bc-allday-label` + all-day content
- `bc-time-body` → `bc-time-gutter` + `bc-day-column` elements

For resource week view specifically (a repeated source of parity debt):
- The header must be **two-tier** (`bc-time-header-tiered`) when `headings.length > 1`: resource group title spanning its day columns (row 1) + individual day headings (row 2).
- An `bc-allday-row` must always be present, with per-resource `bc-allday-resource bc-allday-resource-week` cells in week mode.
- Body `bc-day-column` elements must carry both `data-bc-resource` and `data-bc-resource-type`.

---

## 7. Storybook wiring checklist

Before declaring any story complete, verify each item in the browser:

### A. Localizer toolbar controls → story output

1. Open a story in Storybook.
2. Use the toolbar to change **localizer type** (Temporal / Luxon), **locale**, or **time zone**.
3. Confirm the calendar re-renders with the new localizer and the date/time labels change.

If this does not work, the harness is not reading from `useLocalizerContext()` / `localizerRef`.

### B. Controls panel → story output

For every `argType` in a story:
1. Open the **Controls** panel.
2. Change the value.
3. Confirm the rendered calendar updates to reflect the new value.

Common failure modes:
- The `render` function doesn't pass the arg through to the provider/component.
- A key-based remount is missing for args that require a component restart (e.g. `scrollToTime`, `min`, `max`).
- The arg is listed in `argTypes` but not destructured from `args` in `render`.

### C. Actions panel → event handler callbacks

For every `on*` callback in a story (`onEventClick`, `onSlotClick`, `onEventDrop`, etc.):
1. Open the **Actions** panel.
2. Interact with the calendar (click an event, select a slot, drop a dragged event).
3. Confirm the corresponding action appears in the panel with the correct argument structure.

Handlers must be wired via Storybook's `fn()` (or framework equivalent) so Actions logs them. Do not use plain `() => {}` or `console.log`.

**`fn()` placement rule — critical:** Every `on*` callback must appear as `fn()` in the **story's own `args` object**, not only in `meta.args`. Storybook does not reliably propagate meta-level `fn()` instances to typed stories (`StoryObj<SpecificArgsType>`), so relying on meta.args alone silently breaks the Actions panel. This applies to every story that declares selectable or event-callback args — including `SelectableWithBackgroundEvents`, `Selectable`, `EventCallbacks`, and any story with a custom args type that extends the base. The rule holds even when the callbacks are already listed in `meta.args`.

### D. DnD and resize

For stories that include `EventDragAndDrop`:
1. Confirm pointer-drag moves an event to a new time slot.
2. Confirm the `onEventDrop` action fires with `{ event, start, end, allDay, resourceId? }`.
3. Confirm resize handles appear on events (`bc-resize-handle-start`, `bc-resize-handle-end`).
4. Confirm drag-resize updates the event duration and fires `onEventResize`.
5. Confirm keyboard DnD (grab with Space, move with arrow keys, release with Space) works.
6. Confirm drop-from-outside works in `DropFromOutside.stories.*` and fires `onDropFromOutside`.

#### Lit-specific DnD wiring

In Lit, **do not** put `CalendarDndController` on a story wrapper element that is an ancestor of `<bc-calendar>`. Lit context flows downward (provider → consumer), so a parent element cannot receive context from its child `<bc-calendar>`.

Instead, use the `<bc-calendar-dnd>` custom element **inside** `<bc-calendar>`, wrapping the view elements:

```html
<bc-calendar .localizer=${loc} .events=${events} .onEventDrop=${onDrop}>
  <bc-calendar-dnd>
    <div class="bc-calendar">
      <bc-default-toolbar></bc-default-toolbar>
      <bc-month-view></bc-month-view>
      <bc-time-grid-view></bc-time-grid-view>
      <bc-agenda-view></bc-agenda-view>
    </div>
  </bc-calendar-dnd>
</bc-calendar>
```

`<bc-calendar-dnd>` uses `ContextConsumer` internally to receive the calendar context and calls `CalendarDndController.setContext()` once the store is ready. No manual wiring is needed.

**State persistence rule:** DnD and resize stories must actually commit the event change — the stateful wrapper (or component state) must update the event list after `onEventDrop` / `onEventResize` fires. A story that only calls `fn()` and discards the result will appear to work (the Action logs) but the event will snap back to its original position. The story is only correct when the dropped/resized event stays in its new position after release.

For `DropFromOutside` stories: `<bc-calendar-dnd>` is required whenever the story also supports moving or resizing existing events (i.e. when `onEventDrop` or `onEventResize` is wired). The external drop callback (`onDropFromOutside`) alone does not need it, but in practice `DropFromOutside` stories wire all three callbacks and therefore always need `<bc-calendar-dnd>`.

---

## 8. Verification checklist (run before marking any adapter work done)

This extends the existing Angular phase-validation checklist to cover all adapters.

1. **Build** — `pnpm nx run {package}:typecheck` passes with zero errors.
2. **Tests** — `pnpm nx run {package}:test` passes. Zero unexpected failures. If pre-existing failures exist, they are documented in ERRORS.md.
3. **Storybook startup** — Start the framework's Storybook. Wait for "Storybook ready!" with zero `ERROR in` lines.
4. **Visual parity** — Use Playwright to screenshot each story in `.stories.*` files and compare with the React equivalent. `bc-*` class names and layout must match. No missing borders, wrong spacing, or structural differences.
5. **Styles** — Inspect rendered elements. `bc-calendar`, `bc-event`, `bc-month-week`, `bc-day-column`, etc. must have the correct CSS applied — borders, backgrounds, grid layout. No bare text, no unstyled blocks.
6. **Actions panel** — Click an event and select a slot. Both must log to the Actions panel. Verify at least one callback-bearing story in each story file works.
7. **Controls panel** — Change at least one control in each story that declares `argTypes`. Confirm the output updates.
8. **Storybook-site composite** — Start `storybook-site` and confirm the framework's Storybook loads inside the hub without CORS errors, displays styled content, and all composed story links resolve.

All 8 items must pass before the phase is marked done. Document any item that cannot be verified and why.

---

## 9. Storybook-site composite

`storybook-site` composes all framework Storybooks using iframe refs. After any adapter work:

1. Run `pnpm nx run storybook-site:build` (or start it with `pnpm nx run storybook-site:storybook`).
2. Confirm the adapter's section is listed in the hub nav.
3. Open at least one story from the adapter in the composed view.
4. Confirm styles load (no flash of unstyled content, no 404s on assets).
5. Confirm cross-Storybook globals (localizer, locale, TZ) propagate via the `postMessage` bridge.

If the adapter's Storybook is not yet registered in `storybook-site/project.json`, add it before the phase is closed.

---

## 10. Adding a new framework adapter — bootstrap checklist

When beginning a net-new adapter (e.g. Lit, Svelte):

- [ ] Create `packages/{framework}/` with `package.json`, `project.json`, `tsconfig.json`, vitest config.
- [ ] Add `@big-calendar/{framework}` to `packages/aliases.ts`.
- [ ] Add `.storybook/main.ts` with `viteFinal` alias wiring via `packageAliases`.
- [ ] Add `.storybook/preview.ts` importing the shared CSS and the localizer decorator.
- [ ] Create `stories/harness.ts` with `NOW`, `FOCUS`, and localizer wiring (see §3).
- [ ] Implement all views before writing any stories; do not ship a partial adapter.
- [ ] Mirror every story file from the canonical list (§4) before closing the phase.
- [ ] Run the full verification checklist (§8) at phase end.
- [ ] Add the adapter to `storybook-site` composition.
- [ ] Update `packages/aliases.ts` with the new alias, and update the MCP resources if API surface changed.

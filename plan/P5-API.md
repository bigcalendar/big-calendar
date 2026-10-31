# Types and public API (P5)

> **Status: draft. Part 1 answered (2026-10-31). Part 2 answered (2026-10-31); part 3 in progress.** Not normative until the maintainer approves P5. On approval, the types and contracts move into the specs they complete, with a decision.

Exit criteria: [roadmap](../docs/spec/roadmap.md#planning-phase), row P5.

P5 turns the locked specs into exact TypeScript types and names. The types are real files in [`prototypes/p5-types/`](../prototypes/p5-types/), checked with `tsc`: usage files that must compile, and usage files that must fail with the right error. This draft explains them and lists what needs the maintainer's answer. Anything marked **Proposed** is a choice no spec or decision makes yet.

It is reviewed in four parts. Each part's questions are answered before the next part starts.

| Part | Covers                                                                                                                                   |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Data types, `createCalendar` options, registered features, state slices, store, actions and signals, permission cascade, `temporalReady` |
| 2    | Machine contract, prop-getter descriptors and `mergeProps`, effects, drafts, changes, callback names and payloads, live constraints      |
| 3    | React binding, `react-ui` slots, part manifests, `formats` and `messages`                                                                |
| 4    | The RBC 1.20.0 parity matrix and the slot mapping table                                                                                  |

## How to check the types

`cd prototypes/p5-types && npm install && npm run check`. It runs `tsc` (TypeScript 7.0.2, strict, `exactOptionalPropertyTypes`) on `src/`, then `check-fail.mjs` on `fail/`. Each case in `fail/` names the error text it must produce, and the script fails if the error is missing, lands on another line, or says something else.

## Part 1: data, options, features and state

Files: [`src/core/`](../prototypes/p5-types/src/core/), [`src/temporal/`](../prototypes/p5-types/src/temporal/index.ts), [`src/recurrence/`](../prototypes/p5-types/src/recurrence/index.ts) (how a module registers a feature). Usage: [`src/usage/part1-ok.ts`](../prototypes/p5-types/src/usage/part1-ok.ts) compiles; [`fail/part1-fail.ts`](../prototypes/p5-types/fail/part1-fail.ts) has 13 cases that must fail, and do.

### 1.1 Values ([`values.ts`](../prototypes/p5-types/src/core/values.ts))

- **Ids** (`EventId`, `ResourceId`, `SourceId`) are `string | number`, as the field table gives for `id`. _Proposed for resources and sources._
- **Date and date-time values are plain `string` aliases** (`DateString`, `DateTimeString`). Branded or template-literal types would force a cast on every value read from JSON. Ingest validates them and reports bad values through `onDataIssue`. _Proposed._
- **Weekdays** are ISO numbers, 1 (Monday) to 7 (Sunday), as Temporal and CLDR use them. RBC and `Date` use 0 (Sunday) to 6; the codemod converts. **Question 6.**
- **`UntrustedHtml`** isn't a string type at all, so it can't reach `innerHTML` or `dangerouslySetInnerHTML` (`fail/` proves both). `untrustedHtml(raw)` creates one; `readUntrustedHtml(value)` is the explicit step that returns the raw string for the app to sanitize. **Question 1.**

### 1.2 Data shapes ([`data.ts`](../prototypes/p5-types/src/core/data.ts))

- **`CalendarEvent<TMeta>`** is the field table, field for field. Array fields are `readonly`, so the app can pass frozen data. `end` is optional (T-9).
- **`rrule`** is a string or a `RecurrenceRule` object whose fields mirror RFC 5545 (`freq`, `interval`, `until`, `count`, `byDay`, …). _Proposed: the object's field names._
- **Event fields are typed whether or not their feature is registered.** Data comes from a database and doesn't know which features are on. Using `rrule` without the recurrence feature gives a `needs-feature` data issue, and the event shows once, as written. _Proposed._
- **`BackgroundEvent`** is the same shape without `draggable`, `resizable`, `readOnly` and `tooltip`, which mean nothing for an inert block (D-39). _Proposed._
- **`Resource`** and **`EventSource`** each have `id`, `title`, `color`, the three permissions and `meta`; resources also have `parentId`. Color and the permissions follow from the cascades (D-73, D-83); `meta` on sources is _proposed_.
- **`ProcessedEvent<TMeta>`** is what view models and callbacks hand out: `key` (unique per occurrence), the kernel's frozen copy of the `event`, the derived `allDay`, the cascade's resolved `permissions`, the resolved `color`, and `occurrence` (series id, recurrence id, overridden) for expanded occurrences. _Proposed._

### 1.3 Registered features ([`features.ts`](../prototypes/p5-types/src/core/features.ts), [`builtin.ts`](../prototypes/p5-types/src/core/builtin.ts))

A feature is a value (`timeGrid`) whose type carries what it adds: options, data inputs, state slices, instance API and prerequisites. `calendarFeatures({ … })` checks prerequisites at compile time.

| Feature         | Package    | Options key       | Adds                                                                             | Needs                    |
| --------------- | ---------- | ----------------- | -------------------------------------------------------------------------------- | ------------------------ |
| `dayGrid`       | core       | `dayGrid`         | month and other day-grid views                                                   | —                        |
| `timeGrid`      | core       | `timeGrid`        | day, week, N-day views                                                           | —                        |
| `timeline`      | core       | `timeline`        | timeline views                                                                   | —                        |
| `agenda`        | core       | `agenda`          | the agenda view                                                                  | —                        |
| `slotSelection` | core       | `slotSelection`   | the `selection` slice, `clearSelection()`                                        | a grid family            |
| `dnd`           | core       | `dnd`             | moving, resizing, dragging in and out (D-92); the calendar level of the cascade  | a grid family            |
| `resources`     | core       | `resourceOptions` | the `resources` input; `visibleResources` and `collapsedResources`; hidden count | `timeGrid` or `timeline` |
| `sources`       | core       | —                 | the `sources` input; `visibleSources`                                            | —                        |
| `recurrence`    | recurrence | `recurrence`      | occurrence expansion                                                             | —                        |
| others          | their own  | their name        | `availability` and `editing` are typed at their slices (S8, S4)                  | —                        |

- **What's a feature** _(proposed)_: the four families, plus each behavior an app may leave out: slot selection (RBC `selectable`), drag and drop, resources and sources. Keyboard navigation, focus, event selection and the live clock are always on, because the accessibility spec requires them. **Question 3.**
- **At least one family** must be registered.
- **`standardFeatures`** is `{ dayGrid, timeGrid, agenda }` (D-62), with no selection and no drag and drop, as in RBC's defaults.
- **Errors name the feature** (D-63). Every installed package lists its features in a `FeatureRegistry` interface, so options for an installed but unregistered feature give, for example, _"Property 'Register the timeGrid feature to use these options' is missing"_. The same goes for slices (_"Register the slotSelection feature to use selection"_).
- **The `resources` name clash.** D-57 makes `resources` the data input, and D-61 groups feature options under the feature's name, which is also `resources`. The draft keeps the data flat, like `events`, and groups the options under `resourceOptions`. **Question 2.**

### 1.4 Views

- **`views`** is a record of view names to definitions, made by one helper per family: `dayGridView({ weeks })`, `timeGridView({ days })`, `timelineView({ days })`, `agendaView({ length })` and `customView({ range, navigate, title })` (D-66). The `view` slice is typed as the record's keys, so `setView('sprint')` is checked. A view whose family isn't registered is a type error. **Question 4.**
- **Omitted, `views` defaults** to RBC's set for the registered families: `month`, `week`, `day`, `agenda`, plus `timeline`. The default view is `month` when present, otherwise the first view. _Proposed._

### 1.5 Options ([`calendar.ts`](../prototypes/p5-types/src/core/calendar.ts))

Flat (D-61): `events` (the only required input), `backgroundEvents`, `timeZone`, `locale`, `calendarSystem`, `dir`, `weekStartsOn`, `hourCycle`, `hiddenDays`, `showWeekNumbers`, `readOnly` (the calendar level of the cascade), `defaultEventDuration` (T-9, default `PT1H`), `eventOrder` (gap #3), `clock` (gap #5), `onDataIssue` and `onRangeChange`. `formats` and `messages` come in part 3; edit callbacks in part 2.

- **`onRangeChange`** receives the visible dates (exclusive end) **and** the matching instants with the zone, because apps query their database by instants. _Proposed._
- **`clock`** is `{ now(), setTimeout(), clearTimeout() }`, so the live clock and tests share one injectable source. _Proposed._
- **`DataIssue`** has a `code` from a closed list (`missing-field`, `invalid-value`, `mixed-value-types`, `end-before-start`, `duplicate-id`, `unknown-time-zone`, `unknown-resource`, `unknown-source`, `needs-feature`), the collection, the record's id, the field and the teaching message. _Proposed._

### 1.6 State slices (D-53)

| Slice                | Type                             | From            |
| -------------------- | -------------------------------- | --------------- |
| `date`               | `DateString`                     | core            |
| `view`               | the `views` keys                 | core            |
| `selectedEventId`    | `EventId \| null`                | core            |
| `selection`          | `SlotSelection \| null`          | `slotSelection` |
| `visibleResources`   | `readonly ResourceId[] \| 'all'` | `resources`     |
| `collapsedResources` | `readonly ResourceId[]`          | `resources`     |
| `visibleSources`     | `readonly SourceId[] \| 'all'`   | `sources`       |

- Each slice gets `defaultX`, `x` and `onXChange(value)`, generated from the slice list.
- **Atoms are passed in one `atoms` option** (`atoms: { date: dateAtom }`), not by also accepting an atom in `date`. **Question 5.**
- **`'all'`** is the default for the visibility slices, and also shows resources and sources added later. **Question 8.**

### 1.7 The instance

`createCalendar(options)` returns:

- `state`: every slice as a read-only signal, plus `drafts` and `pending` (shapes in part 2);
- `range` (the visible range) and `title` (the toolbar label), as signals;
- `events`: the granular `get`, `upsert`, `patch`, `remove` (edit model), which write into the collection when one is passed;
- actions: `navigate('previous' | 'next' | 'today')`, `goToDate(date)`, `setView(name)`, `selectEvent(id | null)`, plus feature actions such as `clearSelection()`;
- `setOptions(options)` (D-55), `subscribe(selector, listener)`, `getSnapshot()`, `destroy()`;
- feature APIs, such as `hiddenEventCount` with resources.

**Family view models** (the per-lane segments and cells) are not in P5. P5 fixes their shared rules (plain frozen data, positions as fractions and indices, one signal per lane, D-54); each family's full shape is written in its slice's kickoff spec, where the layout work happens. **Question 7.**

### 1.8 Collections and `temporalReady`

- `createEventCollection`, `createResourceCollection` and `createSourceCollection` return a `Collection` with `size`, `get`, `has`, `upsert`, `patch` and `remove`, iterable as frozen rows. `get`, `has` and `size` are _proposed_ additions to D-57's three writes.
- `@big-calendar/temporal` exports `temporalReady: Promise<void>`. `createCalendar` throws the teaching dev error when called before it resolves (D-87). The React side is part 3.

### 1.9 What the prototype taught

- **Callback types need fixed keys.** TypeScript can't contextually type `onSelectionChange` when the key itself comes from the feature set being inferred. The slice props are therefore keyed by every installed feature's slices, and only the values depend on what's registered. Unregistered slices name their feature instead.
- **`NoInfer` on view names.** Without it, `defaultView: 'year'` makes TypeScript infer a view map from the name and accept it.

### Answers, part 1 (2026-10-31)

Every recommendation was accepted:

1. **`UntrustedHtml`** is an opaque type: `untrustedHtml(raw)` in, `readUntrustedHtml(value)` out.
2. **Resource data stays flat** (`resources`), with feature options in `resourceOptions`; the same pattern for sources.
3. **Features** as drafted: the four families, `slotSelection`, `dnd`, `resources`, `sources`; `standardFeatures` is `dayGrid`, `timeGrid`, `agenda`.
4. **Views** are a named record built with per-family helpers, defaulting to RBC's set for the registered families.
5. **Atoms** are bound through one `atoms` option.
6. **Weekdays** are ISO numbers, 1 (Monday) to 7 (Sunday).
7. **Family view models** are specified in each family's slice kickoff spec; P5 fixes only the shared rules.
8. **Visibility slices** default to `'all'`.

The other items marked _Proposed_ in part 1 weren't asked separately. They stand unless the maintainer changes them at the P5 review.

## Part 2: machines, prop-getters, drafts, changes and callbacks

Files: [`src/core/edit.ts`](../prototypes/p5-types/src/core/edit.ts), [`src/interactions/machine.ts`](../prototypes/p5-types/src/interactions/machine.ts), [`src/interactions/props.ts`](../prototypes/p5-types/src/interactions/props.ts). Usage: [`part2-ok.ts`](../prototypes/p5-types/src/usage/part2-ok.ts) (callbacks, drafts, constraints) and [`part2-machine.ts`](../prototypes/p5-types/src/usage/part2-machine.ts) (the P3 move machine in the contract's table form, plus a feature adding touch long-press) compile; [`part2-fail.ts`](../prototypes/p5-types/fail/part2-fail.ts) and [`part2-machine-fail.ts`](../prototypes/p5-types/fail/part2-machine-fail.ts) add 8 cases that must fail, and do.

### 2.1 The machine contract (D-90)

- **A machine is a transition table**, keyed by state `mode`, then event `type`. Each handler is pure: `(state, event, ctx) → { state, effects }`, and TypeScript narrows `state` and `event` to that entry. A missing entry means the event is ignored in that state. `transition(machine, state, event, ctx)` looks the handler up.
- **Features extend a machine** with `extendMachine(base, table)`: they may add modes and event types. Handling a (mode, event) pair that the base or an earlier feature already handles is a dev-time error, the same rule as a non-mergeable attribute (D-72). _Proposed._
- **Effects** are a closed list, performed in order by one runtime that owns timers and listeners:

| Effect                       | Does                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `announce`                   | Polite, except rollbacks, which are assertive (D-89). The runtime debounces and clears the region.      |
| `draft`                      | Sets or clears this machine's draft in the kernel's `drafts`                                            |
| `commit`                     | Turns a draft into a `Change` and sends it down the edit pipeline                                       |
| `focus`                      | A cell (coordinates), an event (key), a named part, or `restore`                                        |
| `scroll`                     | Into view, one autoscroll step, or to a time                                                            |
| `timerStart` / `timerCancel` | When a timer fires, its event goes back to the same machine; the same id replaces                       |
| `read`                       | An asynchronous DOM read (the cell under a point, the text direction); the reply comes back as an event |

D-90's list had `render` and no `scroll`. **`render` becomes `draft`**: machine state is published through signals, so "render" has nothing to do; what the kernel needs is the draft. **`scroll` is added** for autoscroll (P4), keeping the focused cell visible, and scroll-to-time. **Question 10.**

- **Who can write machines** (answer 9): the contract is **public and stable from 1.0**, exported from `@big-calendar/interactions`, so third parties can write features with interaction behavior. A machine only acts inside a feature, so this also makes the feature-definition types public: `FeatureSpec`, `FeatureRegistry`, `FlatPropRegistry`, `extendMachine` and getter contributions. That follows from the answer; the maintainer confirms it at the P5 review. The layout primitives stay unstable (engine).

### 2.2 Prop-getter descriptors and `mergeProps` (D-72)

- A **descriptor** is `{ attrs, style, on, ref }`:
  - `attrs` uses HTML attribute names (`class`, `tabindex`, `aria-*`, `data-*`); `false` and `undefined` mean absent;
  - `style` holds only `--bc-*` custom properties: the kernel's geometry (styling contract), set through the CSSOM (gap #15). D-72 named `{ attrs, on, ref }`; a separate `style` field keeps attribute and style types apart. **Question 11.**
  - `on` uses DOM event names, and handlers receive the native event;
  - `ref` is called with the element, and with `null` on removal.
- **`mergeProps(...descriptors)`** follows D-72, and fills in what D-72 leaves open _(proposed)_:
  - `class` and the id-list ARIA attributes (`aria-describedby`, `aria-labelledby`, `aria-controls`, `aria-owns`) are joined, without duplicates;
  - the same `data-*` name from two sources becomes a space-separated token list (`data-state="selected pending"`), so CSS selects with `~=`;
  - any other attribute, or a style variable, set to two different values is a dev-time error.
- **Getters** take one object argument (D-46) and are named `get<Part>Props`. `connectCalendar(calendar)` returns the shared ones (`getRootProps`, `getLiveRegionProps`, `getEventProps`, `getResizeHandleProps`, `getDraftProps`) and `destroy()`. Each family's `connect<Family>` adds its own, specified with its view model in its slice (answer 7).

### 2.3 Drafts (D-23)

A `Draft` is a union on `kind`: `creation`, `internal-drag`, `internal-resize`, `external-drag`. Every draft carries its `surface` (`dayGrid`, `timeGrid` or `timeline`; the all-day row is an embedded day grid), `start`, `end` and `timeZone` in the display zone (T-11), `allDay`, the target `resourceId`, and its `violations` (empty when valid). Internal drags add the `event`, the `sourceResourceId` and `converted` (T-12); resizes add the `edge`; external drags add the `item`.

**Dragging in and out** (D-36, D-92):

- An event dragged out is written to the drag data as JSON under `application/x-big-calendar-event+json`, plus its title as `text/plain`. When the drag ends, `onEventDragOut({ event, dropEffect })` reports what the drop target did, and the app decides whether to remove the event. _Proposed: the MIME type and payload._
- Another Big Calendar recognizes that type, so the event arrives as `{ kind: 'fromCalendar', event }`. Anything else needs `dnd.acceptExternal(dataTransfer)`, which returns `{ kind: 'item', title, duration, meta }` or `false`. Omitted, only calendar events are accepted. _Proposed._

### 2.4 Changes and the edit pipeline

- A `Change` is a union on `kind` (edit model): `move`, `resize`, `create`, `update`, `delete`. `before` and `after` are full events in source form (T-11). Every change has a `changeId`, the `AbortSignal` that fires when a newer change supersedes it (D-29), and `recurring` (`scope` and `effects`) when it touches a series (D-30).
- `move` adds `via` (`pointer`, `touch`, `keyboard`, `editing`), `converted` and `previousTimeZone` (T-12). `resize` adds `edge` and `via`. `create` adds `origin`: an app call, a selection, an external drop, or a paste.
- **Callbacks return `ChangeResult`**: `false` vetoes; nothing commits at once; a promise commits on resolve (with the saved event, if any) and rolls back on reject (D-29). TypeScript checks the resolved value against the event type.
- **`calendar.createEvent`, `updateEvent` and `deleteEvent`** send app-started edits through the same pipeline, with the pending state, callbacks and rollback. `calendar.events.upsert` and its siblings still write directly, with no callback (edit model). _Proposed._
- **Creating events.** The `selection` slice holds only finished selections; a selection in progress is a `creation` draft, which live constraints can refuse. The app creates the event when it chooses, for example on `onSelectionChange` or after its own dialog, by calling `createEvent`, which goes through `onEventCreate`. External drops and paste also arrive as `create` changes, so one callback covers every new event. **Question 13.**

### 2.5 Callback names (D-33)

| Callback                | Fires                                                             | RBC                          |
| ----------------------- | ----------------------------------------------------------------- | ---------------------------- |
| `onEventMove`           | A move by pointer, touch, keyboard or paste-cut (`dnd`)           | `onEventDrop`                |
| `onEventResize`         | A resize (`dnd`)                                                  | `onEventResize`              |
| `onEventCreate`         | Any new event: `createEvent`, an external drop, a paste           | `onDropFromOutside` (partly) |
| `onEventUpdate`         | `updateEvent` and editing-module edits                            | —                            |
| `onEventDelete`         | `deleteEvent` and keyboard delete                                 | —                            |
| `onEventDragOut`        | A drag out of the calendar ended (`dnd`)                          | —                            |
| `onChangeError`         | A rejected promise rolled a change back                           | —                            |
| `onEventsChange`        | The full copy after each commit (iterables only)                  | —                            |
| `onEventOpen`           | The event's secondary action: double-click, or "Open" in its menu | `onDoubleClickEvent`         |
| `resolveRecurringScope` | Required with recurrence: the app picks the scope (D-30)          | —                            |

- "Move" rather than "drop", because keyboard moves have no drop and the change kind is `move`. **Question 12.**
- **Callbacks are flat props**, like `events`, even when a feature unlocks them: `onEventMove` exists in the types only with `dnd`, and `resolveRecurringScope` becomes **required** with recurrence. Grouping them under the feature (`dnd: { onEventMove }`) would follow D-61 literally but split one app's edit handlers across groups. **Question 14.**

### 2.6 Live constraints (D-76)

`constraints` is a core option: `allowedResources` (a list, or a function of the draft), `minDuration`, `maxDuration`, `overlap` (default `true`; `false` refuses overlapping busy events in the same lane) and `validate(draft)`, which returns `true` or the message to show and announce. They apply to selections and drags alike. Each broken rule becomes a `ConstraintViolation` (`rule`, `message`) on the draft. Availability adds its `availability` rule in S8. _Proposed._

### 2.7 What the prototype taught

- **Keys taken from the inferred feature set break callback typing for the whole options object**, not only for those keys. Feature options, slices, flat props and required props are now all keyed by the installed packages' registries, with only the values depending on what's registered. Required props are built from one conditional piece per key.
- **Error types must be inlined.** Through a named alias, the error shows `NotRegistered<"onEventMove">` instead of the message naming the feature.

### Answers, part 2 (2026-10-31)

9. **The machine contract is public and stable from 1.0** (not the recommended `/unstable` export). The feature-definition types become public with it (section 2.1); confirmed at the P5 review.
10. **Effects:** `render` becomes `draft`, and `scroll` is added. Amends D-90's list.
11. **Descriptors are `{ attrs, style, on, ref }`**, with `style` limited to `--bc-*` properties. Amends D-72's shape.
12. **`onEventMove`**, and the rest of the callback list as drafted.
13. **The app creates events** with `createEvent`, through `onEventCreate`; `selection` holds only finished selections.
14. **Callbacks unlocked by a feature are flat props**; feature groups hold settings only.

The other items marked _Proposed_ in part 2 stand unless the maintainer changes them at the P5 review.

# Types and public API

> **Normative.** Moved from the P5 draft (`plan/P5-API.md`), approved 2026-11-02 (answers D-94, approval D-95). Changing anything here needs a new entry in the [decision log](../decisions.md).

This spec gives the exact TypeScript types and names of the public API. The reference types are the files in [`prototypes/p5-types/`](../../prototypes/p5-types/), which S0 copies into the packages. They're type-checked with must-compile usage files (`src/usage/`) and must-fail cases (`fail/`, 26 cases, each checked for its error text): `cd prototypes/p5-types && npm install && npm run check`. Where this spec and those files disagree, this spec wins and the files are fixed.

The RBC 1.20.0 prop-by-prop map is in [RBC parity](rbc-parity.md).

## 1. Data, options, features and state

Files: `src/core/`, `src/temporal/`, `src/recurrence/` (how a module registers a feature).

### 1.1 Values (`values.ts`)

- **Ids** (`EventId`, `ResourceId`, `SourceId`) are `string | number`.
- **Date and date-time values are plain `string` aliases** (`DateString`, `DateTimeString`), so JSON type-checks without a cast. Ingest validates them and reports bad values through `onDataIssue`.
- **Weekdays** are ISO numbers, 1 (Monday) to 7 (Sunday), as Temporal and CLDR use them. RBC and `Date` use 0 (Sunday) to 6; the codemod converts.
- **`UntrustedHtml`** is an opaque type, not a string type. `untrustedHtml(raw)` creates one; `readUntrustedHtml(value)` is the explicit step that returns the raw string for the app to sanitize. It can't reach `innerHTML`, `insertAdjacentHTML` or any function taking a `string`.
  - **Known gap:** in a React app it **can** reach `dangerouslySetInnerHTML`. React types `__html` as `string | TrustedHTML`, and `@types/react` declares an empty global `TrustedHTML` interface, which every non-null type satisfies. The docs name this gap; `react-ui`'s own code is held to "never renders HTML fields" by its lint rule.

### 1.2 Data shapes (`data.ts`)

- **`CalendarEvent<TMeta>`** is the [event field table](event-fields.md), field for field. Array fields are `readonly`, so apps can pass frozen data. `end` is optional (T-9).
- **`rrule`** is a string or a `RecurrenceRule` object whose fields mirror RFC 5545 in camelCase: `freq`, `interval`, `until`, `count`, `byDay` (a weekday, or `{ day, nth }`), `byMonthDay`, `byMonth`, `byYearDay`, `byWeekNo`, `byHour`, `byMinute`, `bySecond`, `bySetPos`, `wkst`.
- **Event fields are typed whether or not their feature is registered.** Data comes from a database and doesn't know which features are on. Using `rrule` without the recurrence feature gives a `needs-feature` data issue, and the event shows once, as written.
- **`BackgroundEvent`** is the event shape without `draggable`, `resizable`, `readOnly` and `tooltip`, which mean nothing for an inert block (D-39).
- **`Resource<TMeta>`** has `id`, `title`, `parentId`, `color`, the three permissions and `meta`. **`EventSource<TMeta>`** has the same without `parentId`. Color and the permissions follow the cascades (D-73, D-83).
- **`ProcessedEvent<TMeta>`** is what view models and callbacks hand out:
  - `key`: unique per occurrence;
  - `event`: the kernel's frozen copy of the event;
  - `allDay`: derived from the value types (T-1);
  - `permissions`: the cascade resolved;
  - `color`: resolved, or `undefined` for the theme default;
  - `occurrence`: series id, recurrence id and `overridden`, for expanded occurrences.

### 1.3 Registered features (`features.ts`, `builtin.ts`)

A feature is a value (`timeGrid`) whose type carries what it adds: options, data inputs, state slices, instance API, flat props and prerequisites. `calendarFeatures({ … })` checks prerequisites at compile time.

| Feature         | Package    | Options key       | Adds                                                                             | Needs                    |
| --------------- | ---------- | ----------------- | -------------------------------------------------------------------------------- | ------------------------ |
| `dayGrid`       | core       | `dayGrid`         | month and other day-grid views; `onShowMore`                                     | —                        |
| `timeGrid`      | core       | `timeGrid`        | day, week, N-day views                                                           | —                        |
| `timeline`      | core       | `timeline`        | timeline views                                                                   | —                        |
| `agenda`        | core       | `agenda`          | the agenda view                                                                  | —                        |
| `slotSelection` | core       | `slotSelection`   | the `selection` slice, `clearSelection()`                                        | a grid family            |
| `dnd`           | core       | `dnd`             | moving, resizing, dragging in and out (D-92); the calendar level of the cascade  | a grid family            |
| `resources`     | core       | `resourceOptions` | the `resources` input; `visibleResources` and `collapsedResources`; hidden count | `timeGrid` or `timeline` |
| `sources`       | core       | —                 | the `sources` input; `visibleSources`                                            | —                        |
| `recurrence`    | recurrence | `recurrence`      | occurrence expansion; `resolveRecurringScope` becomes required                   | —                        |
| others          | their own  | their name        | `availability` and `editing` are typed in their slice specs (S8, S4)             | —                        |

- Keyboard navigation, focus, event selection and the live clock are always on, because the [accessibility spec](accessibility.md) requires them.
- **At least one family** must be registered.
- **`standardFeatures`** is `{ dayGrid, timeGrid, agenda }` (D-62), with no selection and no drag and drop, as in RBC's defaults.
- **Data inputs stay flat.** `resources` and `sources` are top-level inputs like `events`; feature options go under the options key, which can differ from the feature's name (`resourceOptions`).
- **Errors name the feature** (D-63). Every installed package lists its features in the `FeatureRegistry` interface, so options for an installed but unregistered feature fail with, for example, _"Property 'Register the timeGrid feature to use these options' is missing"_. Slices and flat props do the same (_"Register the slotSelection feature to use selection"_).
- **Defining features is public and stable from 1.0**, with the machine contract (section 2.1): `FeatureSpec` (`name`, `optionsKey`, `options`, `state`, `api`, `flat`, `required`, `requires`), the `FeatureRegistry` and `FlatPropRegistry` interfaces that packages extend by declaration merging, `extendMachine` and getter contributions. Third parties can write features with interaction behavior.
- **Typing rule.** Options, slices, flat props and required props are keyed by the installed packages' registries; only their value types depend on which features are registered. Keys taken from the inferred feature set break contextual typing of callbacks for the whole options object. Required props are built from one conditional piece per key. Error types are inlined mapped types whose property name is the message, so the message shows instead of an alias name.

### 1.4 Views

- **`views`** is a record of view names to definitions, made by one helper per family: `dayGridView({ weeks })`, `timeGridView({ days })`, `timelineView({ days })`, `agendaView({ length })` and `customView({ range, navigate, title })` (D-66). Each helper takes an optional `label`. The `view` slice is typed as the record's keys, so `setView('sprint')` is checked, and `NoInfer` keeps a `defaultView` name from inferring a view map. A view whose family isn't registered is a type error.
- **When `views` is omitted**, it defaults to RBC's set for the registered families: `month`, `week`, `day`, `agenda`, plus `timeline`. The default view is `month` when present, otherwise the first view. Their labels are the `monthView`, `weekView`, `dayView`, `agendaView` and `timelineView` messages.

### 1.5 Options (`calendar.ts`)

Flat (D-61): `events` (the only required input), `backgroundEvents`, `timeZone`, `locale`, `calendarSystem`, `dir`, `weekStartsOn`, `hourCycle`, `hiddenDays`, `showWeekNumbers`, `readOnly` (the calendar level of the cascade), `defaultEventDuration` (T-9, default `PT1H`), `eventOrder` (gap #3), `clock` (gap #5), `drilldownView`, `onDataIssue`, `onRangeChange`, `onEventKeyDown`, `formats`, `messages`, `constraints` and the edit callbacks.

- **`onRangeChange(range: VisibleRange)`** receives the visible dates (`start`, exclusive `end`) in the display zone, **and** `startInstant` and `endInstant` (ISO instants with `Z`) with the `timeZone`, because apps query their databases by instants.
- **`clock`** is `{ now(), setTimeout(callback, ms), clearTimeout(handle) }`, with `now()` in epoch milliseconds. The live clock and the machines' timers both use it, so tests inject one source.
- **`DataIssue`** has a `code` from a closed list (`missing-field`, `invalid-value`, `mixed-value-types`, `end-before-start`, `duplicate-id`, `unknown-time-zone`, `unknown-resource`, `unknown-source`, `needs-feature`), the collection, the record's id, the field and the teaching message. Adding a code is a minor change.
- **`drilldownView`** is a view name, `null`, or a function of the date and current view.
- **`onEventKeyDown(event, keyboardEvent)`** receives keys the machines don't use.

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
- **Atoms are passed in one `atoms` option** (`atoms: { date: dateAtom }`).
- **`'all'`** is the default for the visibility slices, and also shows resources and sources added later.
- `selection` holds only finished selections; a selection in progress is a `creation` draft.

### 1.7 The instance

`createCalendar(options)` returns:

- `state`: every slice as a read-only signal, plus `drafts` and `pending`;
- `range` (the visible range) and `title` (the toolbar label), as signals;
- `events`: the collection API (section 1.8), writing into the app's collection when one is passed;
- actions: `navigate('previous' | 'next' | 'today')`, `goToDate(date)`, `setView(name)`, `selectEvent(id | null)`, `createEvent`, `updateEvent`, `deleteEvent` (section 2.4), plus feature actions such as `clearSelection()`;
- `setOptions(options)` (D-55), `subscribe(selector, listener)`, `getSnapshot()`, `destroy()`;
- feature APIs, such as `hiddenEventCount` with resources.

**Family view models** (per-lane segments and cells) are specified in each family's slice kickoff spec. They follow the shared rules: plain frozen data, positions as fractions and indices, one signal per lane (D-54).

### 1.8 Collections and `temporalReady`

- `createEventCollection`, `createResourceCollection` and `createSourceCollection` return a `Collection` with the writes `upsert`, `patch` and `remove` (D-57) and the reads `get`, `has` and `size`. It's iterable as frozen rows.
- `@big-calendar/temporal` exports `temporalReady: Promise<void>`. `createCalendar` throws the teaching dev error when called before it resolves (D-87). When Temporal is native, the promise's `status` is set to `'fulfilled'` up front (section 3.1).

## 2. Machines, prop-getters, drafts, changes and callbacks

Files: `src/core/edit.ts`, `src/interactions/machine.ts`, `src/interactions/props.ts`.

### 2.1 The machine contract (D-90)

**Public and stable from 1.0**, exported from `@big-calendar/interactions`. The layout primitives stay unstable ([engine](engine.md)).

- **A machine is a transition table** (`TransitionTable`), keyed by state `mode`, then event `type`. Each handler is pure: `(state, event, ctx) → { state, effects }`, and TypeScript narrows `state` and `event` to that entry. A missing entry means the event is ignored in that state. `defineMachine({ id, initial, table })` defines one; `transition(machine, state, event, ctx)` looks the handler up.
- **Features extend a machine** with `extendMachine(base, table)`: they may add modes and event types. Handling a (mode, event) pair that the base or an earlier feature already handles is a dev-time error, so behavior never depends on registration order.
- **Effects** are a closed list, performed in order by one runtime that owns timers and listeners. Machines never touch the DOM, timers or the kernel directly.

| Effect                       | Does                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `announce`                   | Polite, except rollbacks, which are assertive (D-89). The runtime debounces and clears the region.      |
| `draft`                      | Sets or clears this machine's draft in the kernel's `drafts`                                            |
| `commit`                     | Turns a draft into a `Change` and sends it down the edit pipeline                                       |
| `focus`                      | A cell (coordinates), an event (key), a named part, or `restore`                                        |
| `scroll`                     | Into view, one autoscroll step, or to a time                                                            |
| `timerStart` / `timerCancel` | When a timer fires, its event goes back to the same machine; the same id replaces                       |
| `read`                       | An asynchronous DOM read (the cell under a point, the text direction); the reply comes back as an event |

Coordinates are a surface (`dayGrid`, `timeGrid`, `timeline`, `agenda`), a lane index and an axis index; never pixels.

### 2.2 Prop-getter descriptors and `mergeProps` (D-72)

- A **descriptor** is `{ attrs, style, on, ref }`:
  - `attrs` uses HTML attribute names (`class`, `role`, `tabindex`, `aria-*`, `data-*`); `false` and `undefined` mean absent. It always includes the part's `bc-*` class.
  - `style` holds only `--bc-*` custom properties: the kernel's geometry ([React and styling](react-and-styling.md)), set through the CSSOM (gap #15).
  - `on` uses DOM event names, and handlers receive the native event.
  - `ref` is called with the element, and with `null` on removal.
- **`mergeProps(...descriptors)`** merges left to right:
  - `class` and the id-list ARIA attributes (`aria-describedby`, `aria-labelledby`, `aria-controls`, `aria-owns`) are joined with spaces, without duplicates;
  - the same `data-*` name from two sources becomes a space-separated token list (`data-state="selected pending"`), so CSS selects with `~=`;
  - any other attribute, or a style variable, set to two different values is a dev-time error;
  - handlers are chained in order (base first, then features in registration order); refs are all called.
- **Getters** take one object argument (D-46) and are named `get<Part>Props`. `connectCalendar(calendar)` starts the machines and returns the shared getters (`getRootProps`, `getLiveRegionProps`, `getEventProps`, `getResizeHandleProps`, `getDraftProps`) and `destroy()`. Each family's `connect<Family>` adds its own, specified with its view model in its slice.

### 2.3 Drafts (D-23)

A `Draft` is a union on `kind`: `creation`, `internal-drag`, `internal-resize`, `external-drag`. Every draft carries:

- its `surface` (`dayGrid`, `timeGrid` or `timeline`; the all-day row is an embedded day grid);
- `start`, `end` and `timeZone` in the display zone (T-11), and `allDay`;
- the target `resourceId`;
- its `violations` (empty when valid).

Internal drags add the `event`, the `sourceResourceId` and `converted` (T-12); resizes add the `edge`; external drags add the `item`.

**Dragging in and out** (D-36, D-92):

- An event dragged out is written to the drag data as JSON under `application/x-big-calendar-event+json`, plus its title as `text/plain`. When the drag ends, `onEventDragOut({ event, dropEffect })` reports what the drop target did, and the app decides whether to remove the event.
- Another Big Calendar recognizes that type, so the event arrives as `{ kind: 'fromCalendar', event }`. Anything else needs `dnd.acceptExternal(dataTransfer)`, which returns `{ kind: 'item', title, duration, meta }` or `false`. When it's omitted, only calendar events are accepted.

### 2.4 Changes and the edit pipeline

- A `Change` is a union on `kind` ([edit model](edit-model.md)): `move`, `resize`, `create`, `update`, `delete`. `before` and `after` are full events in source form (T-11). Every change has a `changeId`, the `AbortSignal` that fires when a newer change supersedes it (D-29), and `recurring` (`scope` and `effects`) when it touches a series (D-30).
- `move` adds `via` (`pointer`, `touch`, `keyboard`, `editing`), `converted` and `previousTimeZone` (T-12). `resize` adds `edge` and `via`. `create` adds `origin`: an app call, a selection, an external drop, or a paste.
- **Callbacks return `ChangeResult`**: `false` vetoes; nothing commits at once; a promise commits on resolve (with the saved event, if any) and rolls back on reject (D-29). TypeScript checks the resolved value against the event type.
- **`calendar.createEvent`, `updateEvent` and `deleteEvent`** send app-started edits (a form, a button) through the same pipeline, with the pending state, callbacks and rollback. `calendar.events.upsert` and its siblings still write directly, with no callback.
- **Creating events.** The app creates an event when it chooses, for example on `onSelectionChange` or after its own dialog, by calling `createEvent`, which goes through `onEventCreate`. External drops and pastes also arrive as `create` changes, so one callback covers every new event.

### 2.5 Callbacks (D-33)

| Callback                | Fires                                                             | Needs        |
| ----------------------- | ----------------------------------------------------------------- | ------------ |
| `onEventMove`           | A move by pointer, touch, keyboard or paste-cut                   | `dnd`        |
| `onEventResize`         | A resize                                                          | `dnd`        |
| `onEventCreate`         | Any new event: `createEvent`, an external drop, a paste           | —            |
| `onEventUpdate`         | `updateEvent` and editing-module edits                            | —            |
| `onEventDelete`         | `deleteEvent` and keyboard delete                                 | —            |
| `onEventDragOut`        | A drag out of the calendar ended                                  | `dnd`        |
| `onChangeError`         | A rejected promise rolled a change back                           | —            |
| `onEventsChange`        | The full copy after each commit (iterables only)                  | —            |
| `onEventOpen`           | The event's secondary action: double-click, or "Open" in its menu | —            |
| `onShowMore`            | `({ date, events })` when "+N more" is activated                  | `dayGrid`    |
| `resolveRecurringScope` | The app picks the scope (D-30); **required**                      | `recurrence` |

- "Move" rather than "drop", because keyboard moves have no drop and the change kind is `move`.
- **Callbacks are flat props**, like `events`, even when a feature unlocks them; they exist in the types only when that feature is registered. Feature groups hold settings only.

### 2.6 Live constraints (D-76)

`constraints` is a core option, applied to selections and drags alike:

- `allowedResources`: a list, or a function of the draft;
- `minDuration` and `maxDuration`, as durations;
- `overlap`: default `true`; `false` refuses drafts overlapping a busy event in the same lane;
- `validate(draft)`: synchronous, run on every draft step after the declarative rules; returns `true` or the message to show and announce.

Each broken rule becomes a `ConstraintViolation` (`rule`, `message`) on the draft. Availability adds its `availability` rule in S8.

## 3. React, slots, parts, formats and messages

Files: `src/react/`, `src/react-ui/`, `src/interactions/parts.ts`, `src/core/locale.ts`.

### 3.1 Waiting for `temporalReady` in React (D-87)

- **`useCalendar` calls React 19's `use(temporalReady)`** before creating the calendar. Because the promise is marked fulfilled up front when Temporal is native, **only the polyfill path suspends**; native browsers render at once.
- **`<Calendar>` brings its own `<Suspense>`**, showing the `loading` part, **and its own error boundary**, showing the `error` part if the polyfill chunk fails to load (gap #17).
- **Headless hook users** put a `<Suspense>` boundary above the component that calls `useCalendar`; the docs say so.

### 3.2 The binding (`@big-calendar/react`)

- `useCalendar(options)`: creates the calendar once, calls `setOptions` on every render (D-55) and destroys it on unmount. Same generics and inference as `createCalendar`.
- `useCalendarState(calendar, selector)`: one derived value, re-rendering only when it changes (`useSyncExternalStore`).
- `useSignalValue(signal)`: any facade signal, such as one lane's segments.
- `useCalendarGetters(calendar)`: the shared getters, already normalized. Family hooks (`useDayGrid`, …) come with their slices.
- `normalize(descriptor)`: `class` → `className`, `tabindex` → `tabIndex`, `keydown` → `onKeyDown` (handlers get `event.nativeEvent`), `style` variables set as custom properties.
- `CalendarProvider` for context.

That is the whole binding: no keyboard, focus, timers or machines.

### 3.3 `react-ui`: `<Calendar>` and slots

- **`<Calendar>`** takes every `createCalendar` option, plus `slots`, `className`, `style` and `sizing` (gap #16):
  - `'container'` (default) fills a parent with a fixed height;
  - `'content'` grows to fit;
  - `'page'` grows, with headers sticky inside the page's scroll.
- **Custom views need a component.** `viewComponents` is **required** exactly when `views` has a custom view, with one entry per custom view name, each receiving the range and its events (D-66).
- **Slots are keyed by part name**, one slot per part, each either `{ render }` or `{ wrap }`, never both (D-14):
  - `render({ props, children, …data })` replaces the element; `props` must be spread onto it, and a dev check warns when the role or handlers are missing;
  - `wrap({ children, …data })` decorates the element the library owns.
  - Every slot receives the `view` and its `family`, so one slot can differ per view. The rest of the data (`event` and `segment`, `date`, `title`, …) is typed per part; families widen it in their slice specs.

### 3.4 Parts and manifests (D-25, D-72)

- **One part = one getter, one `bc-*` class, one manifest, one slot.** Part names are camelCase, and the class is derived from the name: `dayCell` is `bc-day-cell`.
- **The part catalog** (`PartCatalog`) lists every part and the feature that adds it:

| Group     | Parts                                                                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Calendar  | `root`, `toolbar`, `toolbarTitle`, `navButton`, `viewSwitcher`, `liveRegion`, `loading`, `error`                                                     |
| Events    | `event`, `eventContent`, `backgroundEvent`, `moreButton`, `overflowPopover`, `eventMenu`, `eventActions`, `tooltip`, `draft`, `resizeHandle` (`dnd`) |
| Day grid  | `dayGrid`, `weekdayHeader`, `weekRow`, `dayCell`, `dateLabel`, `weekNumber`, `miniCalendar`                                                          |
| Time grid | `timeGrid`, `dayHeader`, `allDayRow`, `timeGutterHeader`, `timeGutter`, `timeLabel`, `dayColumn`, `timeSlotGroup`, `timeSlot`, `nowIndicator`        |
| Timeline  | `timeline`, `timelineHeader`, `timelineRow`, `rowHeader`, `timelineSlot`                                                                             |
| Agenda    | `agenda`, `agendaDay`, `agendaRow`, `agendaDateCell`, `agendaTimeCell`                                                                               |
| Resources | `resourceHeader`, `unassignedLane`, `resourcePanel`, `resourceTreeItem`                                                                              |
| Sources   | `sourceList`, `sourceItem`                                                                                                                           |

`eventContent` is the label inside an event; replacing it keeps the event's behavior. `draft` exists with `slotSelection` or `dnd`.

- **A manifest** is `<part>.manifest.ts`, next to the getter: a plain object checked with `satisfies PartManifest<'dayCell'>`. It holds:
  - the class (TypeScript checks it matches the part name) and the feature;
  - the default element and role;
  - each `data-*` attribute: its values (a list, `boolean`, `number` or `token-list`) and the feature that emits it, when not the part's own;
  - each `--bc-*` variable: `inline` geometry or a `token` with its default, plus a CSS syntax;
  - the CSS Module file.

  The styling reference is generated from the manifests (D-70).

### 3.5 Formats and messages (D-40, D-67)

- **`formats`** is a partial map of 16 named slots, each `Intl.DateTimeFormatOptions` only: `dateCell`, `weekdayHeader`, `dayHeader`, `timeGutter`, `monthTitle`, `rangeTitle`, `dayTitle`, `agendaTitle`, `agendaDate`, `agendaTime`, `eventTime`, `selectionRange`, `timelineHeader`, `popoverTitle`, `accessibleDate`, `accessibleTime`. Ranges use `formatRange` with the same options. A token string or formatter function is a type error.
- **`messages`** is a partial flat map of 69 keys: landmarks, toolbar, event names and states, DST, selection and constraints, moving and resizing, menus and dialogs, panels, loading. Each is a string, or a function whose arguments are typed per key (`moreEvents(count)`, `repeatedHour(first, second)`). Plurals use `Intl.PluralRules`, with no ICU. Feature packages add keys by declaration merging. English defaults ship at 1.0. The full key list is `src/core/locale.ts`.

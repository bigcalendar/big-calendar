# Types and public API (P5)

> **Status: draft. Part 1 is written and waiting for the maintainer's answers (questions 1–8).** Not normative until the maintainer approves P5. On approval, the types and contracts move into the specs they complete, with a decision.

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

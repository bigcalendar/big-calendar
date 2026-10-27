# Headless API shape

> **Normative.** Split verbatim from the approved plan (`plan/P1-PLAN.md` §4.4, approved 2026-10-27). Changing anything here needs a new entry in the [decision log](../decisions.md).

TanStack Table v9 makes _data_ headless but leaves _behavior_ to the app. We borrow its core and state model, and add a behavior layer (interaction machines and prop-getters) of the kind Zag.js and react-aria provide.

- **Registered features (D-52).** `createCalendar({ features: calendarFeatures({ timeGrid, dayGrid, resources, recurrence, editing, … }), … })`. Families and modules are features. Only registered ones are bundled, their options and APIs exist in the types only when registered, and prerequisites are checked at compile time.
- **State slices (D-53).** Each slice (`date`, `view`, `selection`, `selectedEventId`, `visibleResources`, `collapsedResources`, …) can be:
  - internal, seeded by `defaultX`;
  - controlled by `x` + `onXChange`;
  - bound to an **external atom** created with core's `createAtom` (our facade type, D-07), which the calendar writes to directly.

  Precedence is atom, then controlled value, then internal state. `drafts` and `pending` are always internal and read-only. Slices are exposed as read-only signals, and state changes only through instance actions (`navigate`, `setView`, `select`, …).

- **Plain data (D-54).** View models are plain, immutable data, with positions as fractions and indices and never pixels. Actions live on the instance. Each lane's segments can be subscribed to separately, which is what "re-render only the affected lanes" requires.
- **Options (D-55).** Bindings pass the latest options and callbacks to `calendar.setOptions()` on every render, and the kernel reacts only to real changes. Stale callbacks can't happen.
- **Pipelines.** Read: event copy → ingest and validate → [recurrence expansion] → clip → lane assignment → segmentation → packing → family view model, as computed signals keyed by lane. Write: draft → change → [recurring scope and effects] → callback → pending → commit, rollback or supersede ([edit model](edit-model.md)).
- **Prop-getters.** `connect<Family>(calendar)` returns getters (`getRootProps`, `getSlotProps`, `getSegmentProps`, `getResizeHandleProps`, `getLiveRegionProps`, …). They return framework-neutral descriptors, `{ attrs, on, ref }`, which each binding's `normalize` maps to its own framework.
  - **Getter contract (D-72).**
    - `attrs` always includes the part's stable `bc-*` class. Part identity lives in the headless layer, so headless and `react-ui` markup match and `@big-calendar/styles` works on both.
    - **Registered features add to getter output.** For example, drag and drop adds `data-draggable` and handlers to `getSegmentProps`.
    - **Merge rules:** classes are joined; handlers are chained (base first, then features in registration order); data attributes are combined; all `ref` callbacks are called; a conflicting non-mergeable attribute is a development-time error.
    - **One shared, framework-neutral `mergeProps`** in `interactions` implements the merge and is used by features and every binding. The final contract is O-6, decided at P3 and recorded in P5.
- **Four ways to use it:**
  1. drop-in `<Calendar features={standardFeatures}>` (features always explicit, D-62);
  2. compose react-ui parts with `wrap` and `render` slots;
  3. headless hooks and prop-getters on your own markup;
  4. the kernel alone, with no DOM, in the browser (for example inside a web worker, or driving a non-React renderer).

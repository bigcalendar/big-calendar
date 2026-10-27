# Edit model

> **Normative.** Split verbatim from the approved plan (`plan/P1-PLAN.md` §6.1, approved 2026-10-27). Changing anything here needs a new entry in the [decision log](../decisions.md).

- **The app is the source of truth.** Data always starts outside the calendar (a database, an ICS file).
- **Input forms (D-57).** `events`, `backgroundEvents` and `resources` each accept either:
  - **any iterable** (an array, a Set, `map.values()` and so on). The kernel keeps its own id-indexed copy, as described below, and re-syncs **only when the iterable's identity changes**. In development it warns when a re-sync reverts a recent commit.
  - **an event collection** from core (`createEventCollection(rows)`): reactive, indexed by id, with `upsert`, `patch` and `remove`. The collection is the **single source of truth**. The kernel keeps no copy, confirmed changes are written straight into it, and a rejected change rolls back in the pending layer before anything is written (D-58). Changes tell the kernel exactly which lanes to update.
- **Input order never matters for events (D-59).** Layout ties are broken by earlier start, then longer duration, then id. Resources keep the order the app gives them, because that is the lane order.
- **When an iterable is passed, the kernel keeps a copy of the events, indexed by id.** Three things update it:
  - the `events` prop, as a full re-sync matched by id, so unchanged events cost nothing; **the prop wins** over earlier commits;
  - commits from confirmed changes;
  - a granular API, `calendar.events.upsert(event)`, `.patch(id, fields)` and `.remove(id)`, for updates the calendar didn't start, such as server pushes.

  The app never has to rebuild the whole array to change one event.

- **Every edit becomes one typed `Change`:** `move`, `resize`, `create`, `delete` or `update`. It holds the before and after values in source form (T-11) and is built from typed drafts ([interaction and accessibility](interaction-accessibility.md)).
- **Pending layer.** A change shows on screen immediately, marked `data-state="pending"`.
- **Per-kind callbacks only** (for example `onEventDrop`, `onEventResize`, `onEventCreate`, `onEventDelete`, `onEventUpdate`; final names are O-2). What the callback returns decides what happens:
  - `false` vetoes the change, and the pending entry is removed with no flicker.
  - A **Promise that resolves** commits the change to the copy. If it resolves with the saved event, the server's version is stored, and for a create the temporary id is swapped for the real one so selection and focus carry over.
  - A **Promise that rejects** rolls the change back. A live region announces it, and `onChangeError` fires.
  - **Nothing** (a synchronous handler) commits the change immediately.
- **Concurrency: the newer change wins.** A new change to an event that already has one pending aborts the older one (its `AbortSignal` fires) and is sent at once. Its `before` is the last committed state.
- **`onEventsChange` is optional.** It fires with the full copy after each commit, for apps that mirror state.
- **Recurring edits** arrive as **one change** with a `scope` (`'occurrence'`, `'following'` or `'series'`) and computed `effects`: the concrete operations the recurrence module works out, such as patching the original series' `UNTIL` and creating a new series. They commit or roll back as one unit. **The app always decides the scope** through `resolveRecurringScope(change)`, which is required whenever recurrence is used. There is no built-in prompt.
- **Editing module (opt-in).** It covers keyboard delete, copy/cut/paste, and undo/redo; undo sends the reverse change through the same callbacks. It also exposes a headless event-dialog state. **No prebuilt event dialog ships at 1.0.**
- **Where it lands:** the change pipeline in S1, the editing module in S4, recurring scope and effects in S7.

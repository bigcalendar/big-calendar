import type { LocalizerContract } from '@big-calendar/localizer'
import type { Accessors } from '../accessors/accessors.type'
import type { NavigateDirection } from '../constants/views.constant'
import type { ViewKey, VisibleRange } from '../types/calendar.type'
import type { ViewModelOptions } from './viewModel.type'

/** Args a custom view's {@link ViewDefinition.range} receives. */
export interface ViewRangeArgs {
  localizer: LocalizerContract
  /** The focus date (day-start not guaranteed). */
  date: string
  /** Agenda-style page size, if the host passes one through (may be `undefined`). */
  length?: number | undefined
}

/**
 * Args a custom view's {@link ViewDefinition.navigate} receives. Only ever
 * called for `PREV`/`NEXT` — `TODAY`/`DATE` are view-independent and handled by
 * the store before the view is consulted — so a definition only has to compute
 * its own step.
 */
export interface ViewNavigateArgs {
  localizer: LocalizerContract
  /** The current focus date to step from. */
  date: string
  /** `PREV` or `NEXT` (never `TODAY`/`DATE`). */
  direction: NavigateDirection
  length?: number | undefined
}

/** Args a custom view's {@link ViewDefinition.label} receives. */
export interface ViewLabelArgs {
  localizer: LocalizerContract
  /** The focus date (single-period titles). */
  date: string
  /** The visible range (spanning titles). */
  range: VisibleRange
}

/** Args a custom view's {@link ViewDefinition.buildModel} receives. */
export interface ViewBuildModelArgs<TEvent, TResource = unknown> {
  localizer: LocalizerContract
  accessors: Accessors<TEvent, TResource>
  /** The view key being built (so one definition can back several keys). */
  view: ViewKey
  /** The focus date. */
  date: string
  /** The visible day list (`range.days`), in order. */
  days: string[]
  /** Foreground events. */
  events: TEvent[]
  /** Background events, if any. */
  backgroundEvents?: TEvent[] | undefined
  /** Resource objects, if grouped. */
  resources?: TResource[] | undefined
  /** The same tuning options the built-in builders receive. */
  options?: ViewModelOptions | undefined
}

/**
 * A custom view plugin (the view-registry escape hatch, §9). Four **pure**
 * functions that run **in core** — exactly like the built-in seams — so every
 * framework adapter (React today, others later) derives the identical, correctly
 * localized range / navigation / label / model. A definition is consulted only
 * for a view key that is **not** one of the built-ins (`month`/`week`/
 * `work_week`/`day`/`agenda`); the built-ins stay hardcoded.
 *
 * `TModel` is the shape {@link ViewDefinition.buildModel} returns. It is erased
 * to `unknown` on the {@link CalendarViewModel} `custom` arm (the union can't
 * thread an open generic through the store signal); the matching view-component
 * re-asserts it from the definition it registered. Use {@link defineView} so
 * `TModel` is inferred.
 */
export interface ViewDefinition<TEvent, TResource = unknown, TModel = unknown> {
  /** The visible day-range for a focus date (mirrors the built-in `viewRange`). */
  range(args: ViewRangeArgs): VisibleRange
  /** Step the focus date for `PREV`/`NEXT` (mirrors the built-in `stepFor`). */
  navigate(args: ViewNavigateArgs): string
  /** The localized toolbar title (mirrors the built-in `viewLabel`). */
  label(args: ViewLabelArgs): string
  /** Build the pure view model the matching view-component renders. */
  buildModel(args: ViewBuildModelArgs<TEvent, TResource>): TModel
}

/**
 * Maps a custom view key to its {@link ViewDefinition}. Supplied on the config
 * as `views`. Keys that collide with a built-in are ignored (the built-in wins —
 * the registry is only consulted in each seam's `default` branch). `TModel` is
 * intentionally erased here (registration doesn't carry it); a view-component
 * recovers it via the definition object it owns.
 */
export type ViewRegistry<TEvent = unknown, TResource = unknown> = Record<
  string,
  ViewDefinition<TEvent, TResource>
>

/**
 * The slice of a registry the non-model seams (`range`/`navigate`/`label`)
 * consult. None of those touch `TEvent`, so this stays event-type agnostic —
 * which lets the non-generic `viewRange`/`navigateDate`/`viewLabel` accept a
 * registry without dragging `TEvent` through their signatures.
 */
export type ViewRegistrySeams = Record<string, Pick<ViewDefinition<unknown>, 'range' | 'navigate' | 'label'>>

// Drafts (D-23), changes and callbacks (edit model, D-29), live constraints (D-76).
import type { CalendarEvent, ProcessedEvent } from './data.ts'
import type {
  DateOrDateTimeString,
  DurationString,
  EventId,
  ResourceId,
  TimeZoneName,
} from './values.ts'

// Drafts --------------------------------------------------------------------------------------

/** Where a draft sits. The time grid's all-day row is an embedded day grid, so it's `dayGrid`. */
export type Surface = 'dayGrid' | 'timeGrid' | 'timeline'

/** A broken rule, with the localized message that is shown and announced. */
export interface ConstraintViolation {
  rule:
    | 'allowedResources'
    | 'minDuration'
    | 'maxDuration'
    | 'overlap'
    | 'availability'
    | 'validate'
  message: string
}

interface DraftBase {
  surface: Surface
  /** In the display zone with `timeZone` set (T-11); dates when the draft is all-day. */
  start: DateOrDateTimeString
  end: DateOrDateTimeString
  timeZone: TimeZoneName
  allDay: boolean
  /** The target lane's resource, when resources are registered. */
  resourceId: ResourceId | undefined
  /** Empty when the draft is valid. Invalid drafts carry `data-invalid` and can't be dropped (D-76). */
  violations: readonly ConstraintViolation[]
}

/** A slot selection in progress (pointer, touch long-press or Shift+Arrow). */
export interface CreationDraft extends DraftBase {
  kind: 'creation'
}
export interface InternalDragDraft<TMeta = unknown> extends DraftBase {
  kind: 'internal-drag'
  event: ProcessedEvent<TMeta>
  sourceResourceId: ResourceId | undefined
  /** T-12: the drop changes the event between dates and date-times. */
  converted: boolean
}
export interface InternalResizeDraft<TMeta = unknown> extends DraftBase {
  kind: 'internal-resize'
  event: ProcessedEvent<TMeta>
  edge: 'start' | 'end'
}
/** Something dragged in from outside: another app element, or an event from another calendar. */
export interface ExternalDragDraft<TMeta = unknown> extends DraftBase {
  kind: 'external-drag'
  item: ExternalItem<TMeta>
}
export type Draft<TMeta = unknown> =
  | CreationDraft
  | InternalDragDraft<TMeta>
  | InternalResizeDraft<TMeta>
  | ExternalDragDraft<TMeta>

/**
 * What `dnd.acceptExternal` turns a native drag into. An event dragged out of another Big Calendar
 * arrives as `fromCalendar`, already parsed from our MIME type.
 */
export type ExternalItem<TMeta = unknown> =
  | {
      kind: 'item'
      title: string
      duration: DurationString | undefined
      meta: TMeta | undefined
    }
  | { kind: 'fromCalendar'; event: CalendarEvent<TMeta> }

// Live constraints ----------------------------------------------------------------------------

export interface Constraints<TMeta = unknown> {
  /** Resources an event may be dropped on or created in. */
  allowedResources?:
    readonly ResourceId[] | ((draft: Draft<TMeta>) => readonly ResourceId[])
  minDuration?: DurationString
  maxDuration?: DurationString
  /** `false` refuses drafts overlapping a busy event in the same lane. Default `true`. */
  overlap?: boolean
  /**
   * Synchronous, called on every draft step (D-76). Return `true`, or the message to show and announce.
   * Runs after the declarative rules.
   */
  validate?: (draft: Draft<TMeta>) => true | string
}

// Changes -------------------------------------------------------------------------------------

/** Set when the recurrence feature is registered and the change touches a series (D-30). */
export interface RecurringChangeInfo<TMeta = unknown> {
  scope: RecurringScope
  /** The concrete writes, worked out by the recurrence module. */
  effects: readonly RecurrenceEffect<TMeta>[]
}
export type RecurringScope = 'occurrence' | 'following' | 'series'
export type RecurrenceEffect<TMeta = unknown> =
  | { op: 'create'; event: CalendarEvent<TMeta> }
  | {
      op: 'patch'
      id: EventId
      before: CalendarEvent<TMeta>
      after: CalendarEvent<TMeta>
    }
  | { op: 'remove'; event: CalendarEvent<TMeta> }

interface ChangeBase<TMeta> {
  /** Unique per change; the pending entry's key. */
  changeId: string
  /** Aborted when a newer change to the same event supersedes this one (D-29). */
  signal: AbortSignal
  recurring: RecurringChangeInfo<TMeta> | undefined
}
/** `before` and `after` are in source form (T-11): a moved date stays a date. */
export interface MoveChange<TMeta = unknown> extends ChangeBase<TMeta> {
  kind: 'move'
  before: CalendarEvent<TMeta>
  after: CalendarEvent<TMeta>
  /** How it was moved. */
  via: 'pointer' | 'touch' | 'keyboard' | 'editing'
  /** T-12. */
  converted: boolean
  previousTimeZone: TimeZoneName | undefined
}
export interface ResizeChange<TMeta = unknown> extends ChangeBase<TMeta> {
  kind: 'resize'
  before: CalendarEvent<TMeta>
  after: CalendarEvent<TMeta>
  edge: 'start' | 'end'
  via: 'pointer' | 'touch' | 'keyboard'
}
export interface CreateChange<TMeta = unknown> extends ChangeBase<TMeta> {
  kind: 'create'
  /** Carries a temporary id; resolve with the saved event to swap in the real one. */
  after: CalendarEvent<TMeta>
  /** What started it: an app call, a slot selection, an external drop, or paste. */
  origin:
    | { kind: 'app' }
    | { kind: 'selection'; draft: CreationDraft }
    | { kind: 'external'; draft: ExternalDragDraft<TMeta> }
    | { kind: 'paste'; copiedFrom: EventId }
}
export interface UpdateChange<TMeta = unknown> extends ChangeBase<TMeta> {
  kind: 'update'
  before: CalendarEvent<TMeta>
  after: CalendarEvent<TMeta>
}
export interface DeleteChange<TMeta = unknown> extends ChangeBase<TMeta> {
  kind: 'delete'
  before: CalendarEvent<TMeta>
}
export type Change<TMeta = unknown> =
  | MoveChange<TMeta>
  | ResizeChange<TMeta>
  | CreateChange<TMeta>
  | UpdateChange<TMeta>
  | DeleteChange<TMeta>

/**
 * D-29: `false` vetoes; nothing commits now; a promise commits on resolve (optionally with the saved
 * event) and rolls back on reject.
 */
export type ChangeResult<TMeta = unknown> =
  false | void | Promise<CalendarEvent<TMeta> | void>
export type ChangeHandler<C, TMeta> = (change: C) => ChangeResult<TMeta>

/** A change waiting for its callback's promise; drawn with `data-state="pending"`. */
export interface PendingChange<TMeta = unknown> {
  change: Change<TMeta>
}

/** What `onEventDragOut` reports once a native drag out of the calendar ends (D-36). */
export interface DragOutResult<TMeta = unknown> {
  event: CalendarEvent<TMeta>
  /** The drop target's choice, from `dragend`. `'none'` means nothing took it. */
  dropEffect: 'copy' | 'move' | 'link' | 'none'
}

/** The MIME type an event is serialized under when dragged out (D-36); another calendar reads it. */
export const EVENT_MIME_TYPE = 'application/x-big-calendar-event+json'

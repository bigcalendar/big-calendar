// Part identity (D-72) and the typed manifest every part ships (D-25). One part = one getter, one
// `bc-*` class, one manifest, one `react-ui` slot.

/** Parts and the feature that adds them; `core` parts exist whenever their family is registered. */
export interface PartCatalog {
  // Calendar
  root: 'core'
  toolbar: 'core'
  toolbarTitle: 'core'
  navButton: 'core'
  viewSwitcher: 'core'
  liveRegion: 'core'
  loading: 'core'
  error: 'core'
  // Events, in any family
  event: 'core'
  backgroundEvent: 'core'
  moreButton: 'core'
  overflowPopover: 'core'
  eventMenu: 'core'
  eventActions: 'core'
  tooltip: 'core'
  draft: 'slotSelection' | 'dnd'
  resizeHandle: 'dnd'
  // Day grid
  dayGrid: 'dayGrid'
  weekdayHeader: 'dayGrid'
  weekRow: 'dayGrid'
  dayCell: 'dayGrid'
  dateLabel: 'dayGrid'
  weekNumber: 'dayGrid'
  // Time grid
  timeGrid: 'timeGrid'
  dayHeader: 'timeGrid'
  allDayRow: 'timeGrid'
  timeGutter: 'timeGrid'
  timeLabel: 'timeGrid'
  dayColumn: 'timeGrid'
  timeSlot: 'timeGrid'
  nowIndicator: 'timeGrid'
  // Timeline
  timeline: 'timeline'
  timelineHeader: 'timeline'
  timelineRow: 'timeline'
  rowHeader: 'timeline'
  timelineSlot: 'timeline'
  // Agenda
  agenda: 'agenda'
  agendaDay: 'agenda'
  agendaRow: 'agenda'
  // Resources and sources
  resourceHeader: 'resources'
  unassignedLane: 'resources'
  resourcePanel: 'resources'
  resourceTreeItem: 'resources'
  sourceList: 'sources'
  sourceItem: 'sources'
  // Extra prebuilt UI
  miniCalendar: 'dayGrid'
}
export type PartName = keyof PartCatalog

/** `dayCell` → `bc-day-cell`. */
export type PartClass<P extends PartName> = `bc-${KebabCase<P>}`
type KebabCase<S extends string> = S extends `${infer Head}${infer Tail}`
  ? Tail extends Uncapitalize<Tail>
    ? `${Lowercase<Head>}${KebabCase<Tail>}`
    : `${Lowercase<Head>}-${KebabCase<Uncapitalize<Tail>>}`
  : S

export interface DataAttributeSpec {
  /** Allowed values; `'boolean'` means present or absent; `'token-list'` is space-separated (`~=`). */
  values: readonly string[] | 'boolean' | 'number' | 'token-list'
  description: string
  /** The feature that emits it, when not the part's own (D-71). */
  feature?: string
}

export interface CssVariableSpec {
  /** `inline`: set on the element from the kernel's geometry. `token`: a theme token with a default. */
  kind: 'inline' | 'token'
  syntax:
    | '<number>'
    | '<integer>'
    | '<length>'
    | '<color>'
    | '<time>'
    | '<percentage>'
    | '*'
  description: string
  /** Tokens only. */
  default?: string
}

/**
 * A part's styling contract (D-25, D-68). Written once as `<part>.manifest.ts` next to the getter,
 * checked with `satisfies PartManifest<'dayCell'>`, and used to generate the styling reference (D-70).
 */
export interface PartManifest<P extends PartName> {
  part: P
  className: PartClass<P>
  /** The feature whose registration makes the part exist. */
  feature: PartCatalog[P]
  /** The element `react-ui` renders; render slots may change it if the role stays. */
  element: keyof HTMLElementTagNameMap
  role: string | undefined
  dataAttributes: { readonly [name: `data-${string}`]: DataAttributeSpec }
  cssVariables: { readonly [name: `--bc-${string}`]: CssVariableSpec }
  /** The CSS Module file in `react-ui`, compiled again for `@big-calendar/styles` (D-69). */
  css: `${string}.module.css`
}

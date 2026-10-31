// formats and messages (D-40, D-67). English only at 1.0; locale packs after.

/**
 * Named format slots. Each takes `Intl.DateTimeFormat` options only: no token strings and no
 * formatter functions (D-67). Ranges use `formatRange` with the same options.
 */
export interface Formats {
  /** The day number in a month cell (RBC `dateFormat`). */
  dateCell: Intl.DateTimeFormatOptions
  /** Month column headers (RBC `weekdayFormat`). */
  weekdayHeader: Intl.DateTimeFormatOptions
  /** Time-grid column headers (RBC `dayFormat`). */
  dayHeader: Intl.DateTimeFormatOptions
  /** Time-gutter labels (RBC `timeGutterFormat`). */
  timeGutter: Intl.DateTimeFormatOptions
  /** Toolbar titles, one per family shape (RBC `monthHeaderFormat`, `dayRangeHeaderFormat`, `dayHeaderFormat`, `agendaHeaderFormat`). */
  monthTitle: Intl.DateTimeFormatOptions
  rangeTitle: Intl.DateTimeFormatOptions
  dayTitle: Intl.DateTimeFormatOptions
  agendaTitle: Intl.DateTimeFormatOptions
  /** Agenda date and time columns (RBC `agendaDateFormat`, `agendaTimeFormat`, `agendaTimeRangeFormat`). */
  agendaDate: Intl.DateTimeFormatOptions
  agendaTime: Intl.DateTimeFormatOptions
  /** An event's time span, and its pieces across days (RBC `eventTimeRange*Format`). */
  eventTime: Intl.DateTimeFormatOptions
  /** A slot selection's span (RBC `selectRangeFormat`). */
  selectionRange: Intl.DateTimeFormatOptions
  /** Timeline header cells. */
  timelineHeader: Intl.DateTimeFormatOptions
  /** The "+N more" popover's full-date header (D-50). */
  popoverTitle: Intl.DateTimeFormatOptions
  /** Dates and times inside accessible names (P3 names), which are always complete. */
  accessibleDate: Intl.DateTimeFormatOptions
  accessibleTime: Intl.DateTimeFormatOptions
}

/** A message: a fixed string, or a function of typed arguments. Plurals use `Intl.PluralRules`, no ICU (D-40). */
type Message<Args extends unknown[] = []> = Args extends []
  ? string | (() => string)
  : (...args: Args) => string

/**
 * Every user-facing and accessible string, as one flat map (D-40). Feature packages add their keys
 * by declaration merging. The defaults are English.
 */
export interface Messages {
  // Landmarks and regions
  calendarLabel: Message
  toolbarLabel: Message
  monthGridLabel: Message
  allDayGridLabel: Message
  timeGridLabel: Message
  timelineGridLabel: Message
  agendaLabel: Message
  eventGroupLabel: Message
  // Toolbar
  today: Message
  /** `unit` is the view's localized period name, such as "week". */
  previous: Message<[unit: string]>
  next: Message<[unit: string]>
  viewSwitcherLabel: Message<[currentView: string]>
  monthView: Message
  weekView: Message
  dayView: Message
  agendaView: Message
  timelineView: Message
  // Event names (P3 section 2.6) and states
  allDay: Message
  recurring: Message
  tentative: Message
  cancelled: Message
  readOnly: Message
  pending: Message
  continuesFrom: Message<[date: string]>
  continuesUntil: Message<[date: string]>
  /** Composed from parts; the visible label comes first (WCAG 2.5.3). */
  eventName: Message<[parts: readonly string[]]>
  eventCount: Message<[count: number]>
  moreEvents: Message<[count: number]>
  outsideMonth: Message<[which: 'previous' | 'next']>
  weekNumber: Message<[week: number]>
  now: Message
  noEventsInRange: Message
  // DST (P3 section 4.4)
  afterDstChange: Message
  skippedSlot: Message
  repeatedHour: Message<[first: string, second: string]>
  // Selection and constraints
  selected: Message<[what: string]>
  selectionCleared: Message
  notAllowed: Message<[reason: string]>
  minDurationViolation: Message<[duration: string]>
  maxDurationViolation: Message<[duration: string]>
  overlapViolation: Message
  resourceViolation: Message<[resource: string]>
  // Moving and resizing (keyboard and pointer)
  moving: Message<[title: string]>
  resizing: Message<[title: string]>
  moveCancelled: Message<[title: string]>
  dropped: Message<[description: string]>
  willBecomeAllDay: Message
  willBecomeTimed: Message
  /** The one assertive announcement (D-89). */
  rolledBack: Message<[title: string]>
  // Menus and dialogs
  eventMenuLabel: Message<[title: string]>
  menuOpen: Message
  menuMove: Message
  menuResize: Message
  menuDetails: Message
  menuDelete: Message
  deleteDialogTitle: Message<[title: string]>
  deleteDialogBody: Message<[title: string]>
  confirmDelete: Message
  cancel: Message
  // Panels
  unassignedLane: Message
  resourcePanelLabel: Message
  sourceListLabel: Message
  showPanel: Message
  hidePanel: Message
  // Loading and errors (gap #17)
  loading: Message
  loadError: Message
}

/**
 * Built-in calendar view identifiers.
 *
 * Values intentionally match v1's `views` strings (`month`, `week`, …) so that
 * existing app code and the migration codemods map across without surprises.
 */
export const Views = {
  MONTH: 'month',
  WEEK: 'week',
  WORK_WEEK: 'work_week',
  DAY: 'day',
  AGENDA: 'agenda',
} as const

/** Union of the built-in view string values (`'month' | 'week' | …`). */
export type BuiltinViewKey = (typeof Views)[keyof typeof Views]

/** The built-in view keys as an ordered list (handy for drilldown resolution). */
export const BUILTIN_VIEWS = Object.values(Views)

/**
 * Navigation directions accepted by the store's `navigate` action.
 *
 * Values match v1's `navigate` constants (`PREV`, `NEXT`, …) for parity. `DATE`
 * is the "go to an explicit date" direction; the target date travels alongside
 * it in the action argument.
 */
export const Navigate = {
  PREVIOUS: 'PREV',
  NEXT: 'NEXT',
  TODAY: 'TODAY',
  DATE: 'DATE',
} as const

/** Union of the navigation direction values (`'PREV' | 'NEXT' | …`). */
export type NavigateDirection = (typeof Navigate)[keyof typeof Navigate]

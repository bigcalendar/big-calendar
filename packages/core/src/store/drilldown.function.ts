import type { ViewKey } from '../types/calendar.type'

/**
 * A user-supplied drilldown resolver. Given the clicked date, the current view,
 * and the list of available views, it returns the view to drill into — or
 * `null`/`undefined` to suppress the drilldown.
 */
export type GetDrilldownView = (args: {
  date: string
  view: ViewKey
  views: ViewKey[]
}) => ViewKey | null | undefined

/**
 * Resolve which view a drilldown should land on, mirroring v1's
 * `getDrilldownView`:
 *
 * - With a `getDrilldownView` function, defer to it (its `null`/`undefined`
 *   result disables the drilldown).
 * - Otherwise use the static `drilldownView` (which may itself be `null` to
 *   disable drilldown entirely).
 */
export function resolveDrilldownView(args: {
  date: string
  view: ViewKey
  views: ViewKey[]
  drilldownView: ViewKey | null
  getDrilldownView?: GetDrilldownView | undefined
}): ViewKey | null {
  const { date, view, views, drilldownView, getDrilldownView } = args
  if (!getDrilldownView) return drilldownView
  return getDrilldownView({ date, view, views }) ?? null
}

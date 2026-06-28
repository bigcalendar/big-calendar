import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import { localizer as _locRef } from './localizerRef'
export { demoEvents } from './demoEvents'
export type { DemoEvent } from './demoEvents'
export { localizer } from './localizerRef'

/**
 * Shared dev harness for the `@big-calendar/vue` stories.
 *
 * `localizer` (re-exported from `localizerRef.ts`) is a Vue `shallowRef` so
 * the Storybook toolbar decorator can swap it reactively. Starts with a sync
 * Luxon default; the top-level await here upgrades it to Temporal before any
 * story renders. Pinned to `en-US`/`UTC` and a fixed `NOW` so grids, the
 * today highlight, and the now-indicator render deterministically.
 */
const _temporal = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'UTC' })
_locRef.value = _temporal

/** Frozen "now" so today / now-indicator placement is stable. */
export const NOW = '2026-06-15T12:00:00.000Z'
/** Focus date the demo calendar opens on (Mon, Jun 15 2026). */
export const FOCUS = '2026-06-15'

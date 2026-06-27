import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
export { demoEvents } from './demoEvents'
export type { DemoEvent } from './demoEvents'

/**
 * Shared dev harness for the `@big-calendar/vue` stories.
 *
 * The localizer is async, so it is resolved once at module load via top-level
 * await. Every story importing this gets the same ready-to-use instance.
 * Pinned to `en-US`/`UTC` and a fixed `NOW` so grids, the today highlight,
 * and the now-indicator render deterministically across runs.
 */
export const localizer = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'UTC' })

/** Frozen "now" so today / now-indicator placement is stable. */
export const NOW = '2026-06-15T12:00:00.000Z'
/** Focus date the demo calendar opens on (Mon, Jun 15 2026). */
export const FOCUS = '2026-06-15'

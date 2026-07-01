import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import { setLocalizer } from './localizerRef'
export { demoEvents } from './demoEvents'
export type { DemoEvent } from './demoEvents'
export { localizer } from './localizerRef'

/**
 * Shared dev harness for the `@big-calendar/svelte` stories.
 *
 * `localizer` (re-exported from `localizerRef.ts`) is a live ES-module
 * binding — starts with a synchronous Luxon default, then upgraded here to
 * Temporal once the async polyfill resolves. The Storybook toolbar decorator
 * (`.storybook/withSvelteLocalizerDecorator.ts`) can swap it reactively.
 * Pinned to `en-US`/`UTC` and a fixed `NOW` so grids, the today highlight,
 * and the now-indicator render deterministically.
 */
const _temporal = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'UTC' })
setLocalizer(_temporal)

/** Frozen "now" so today / now-indicator placement is stable. */
export const NOW = '2026-06-15T12:00:00.000Z'

/** Focus date the demo calendar opens on (Mon, Jun 15 2026). */
export const FOCUS = '2026-06-15'

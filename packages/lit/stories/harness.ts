/**
 * Story harness for the Lit Storybook.
 *
 * Re-exports shared fixtures and upgrades the shared localizer from the
 * synchronous Luxon default to Temporal (async) at module evaluation time.
 * Storybook evaluates this file once during story loading, so the upgrade
 * happens before any story renders.
 *
 * Usage in story files:
 *   import { NOW, FOCUS, demoEvents, litLocalizer } from './harness'
 */
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'
import { setLitLocalizer } from './localizerRef'

export { demoEvents } from './demoEvents'
export { litLocalizer } from './localizerRef'

/**
 * The ISO timestamp used as "now" in all stories.
 *
 * Pinned to mid-day on 15 Jun 2026 so focus-week stories render the same
 * visible slot column every time regardless of when Storybook is opened.
 */
export const NOW = '2026-06-15T12:00:00.000Z'

/**
 * The calendar focus date used in all stories.
 *
 * Must match the date portion of `NOW`.
 */
export const FOCUS = '2026-06-15'

// Upgrade to Temporal localizer as soon as the polyfill resolves.
// Storybook ESM evaluation awaits top-level promises in stories/harness.ts
// because it uses dynamic import(). The Luxon localizer in localizerRef.ts
// remains active until the Temporal promise settles.
const _temporal = await createTemporalLocalizer({ locale: 'en-US', timeZone: 'UTC' })
setLitLocalizer(_temporal)

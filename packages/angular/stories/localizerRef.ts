import { createLuxonLocalizer } from '@big-calendar/localizer-luxon'
import type { LocalizerContract } from '@big-calendar/localizer'

/**
 * Module-level mutable localizer shared by all Angular stories.
 *
 * Starts with a synchronous Luxon default so the preview initialises without
 * any async delay. `harness.ts` upgrades it to Temporal once the polyfill
 * resolves. `.storybook/withAngularLocalizerDecorator.ts` updates it whenever
 * the toolbar globals change (direct access) or the hub broadcasts a
 * `bc-globals-sync` postMessage (composition mode).
 *
 * Stories import `{ localizer }` from `./harness`, which re-exports this live
 * binding — every time a story's `render()` function is called it reads the
 * current value.
 */
export let localizer: LocalizerContract = createLuxonLocalizer({ locale: 'en-US', timeZone: 'UTC' })

export function setLocalizer(l: LocalizerContract): void {
  localizer = l
}

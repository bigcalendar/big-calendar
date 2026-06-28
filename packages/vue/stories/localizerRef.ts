import { createLuxonLocalizer } from '@big-calendar/localizer-luxon'
import { shallowRef } from 'vue'

/**
 * Module-level reactive localizer ref shared by all Vue stories.
 *
 * Starts with a synchronous Luxon default so nothing async blocks the
 * Storybook preview initialization chain. `harness.ts` upgrades it to
 * Temporal once the async polyfill resolves. The Storybook toolbar decorator
 * (in `.storybook/withVueLocalizerDecorator.ts`) updates it whenever the
 * toolbar globals change.
 *
 * Stories return this ref from `setup()` as `{ localizer }` — Vue auto-unwraps
 * it in templates, so `:localizer="localizer"` passes the resolved
 * `LocalizerContract`. Stories that pass localizer through `h()` must use
 * `localizer.value` explicitly.
 */
export const localizer = shallowRef(
  createLuxonLocalizer({ locale: 'en-US', timeZone: 'UTC' }),
)

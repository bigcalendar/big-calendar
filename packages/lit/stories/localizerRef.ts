import { createLuxonLocalizer } from '@big-calendar/localizer-luxon'
import type { LocalizerContract } from '@big-calendar/localizer'

/**
 * Module-level localizer ref shared by all Lit stories.
 *
 * Starts with a synchronous Luxon default so nothing async blocks the
 * Storybook preview initialization chain. `harness.ts` upgrades it to
 * Temporal once the async polyfill resolves.
 *
 * Stories bind `.localizer=${litLocalizer.current}` to their `bc-calendar`
 * element, which is a plain property assignment. When `setLitLocalizer()` is
 * called, it updates `litLocalizer.current` and dispatches a
 * `bc-localizer-change` CustomEvent on `window`. Story wrapper elements
 * (\`BcStoryWrapper\`) listen for this event and call `requestUpdate()` to
 * re-render the story with the new localizer.
 */
export const litLocalizer: { current: LocalizerContract } = {
  current: createLuxonLocalizer({ locale: 'en-US', timeZone: 'UTC' }),
}

/**
 * Update the shared localizer and notify all story wrapper elements.
 * Called by `withLitLocalizerDecorator.ts` when the toolbar globals change.
 */
export function setLitLocalizer(l: LocalizerContract): void {
  litLocalizer.current = l
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bc-localizer-change'))
  }
}

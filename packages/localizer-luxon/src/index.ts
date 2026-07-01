import type { LocalizerOptions } from '@big-calendar/localizer'
import { LuxonLocalizer } from './localizer-luxon.class'

export const PACKAGE_NAME = '@big-calendar/localizer-luxon'

export { LuxonLocalizer } from './localizer-luxon.class'

/**
 * Create a {@link LuxonLocalizer}. Synchronous — Luxon is a peer dependency
 * and requires no async polyfill loading.
 */
export function createLuxonLocalizer(options?: LocalizerOptions): LuxonLocalizer {
  return new LuxonLocalizer(options)
}

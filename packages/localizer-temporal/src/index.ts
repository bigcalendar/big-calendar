import type { LocalizerOptions } from '@big-calendar/localizer'
import { loadTemporal } from './loadTemporal.function'
import { TemporalLocalizer } from './localizer-temporal.class'

export const PACKAGE_NAME = '@big-calendar/localizer-temporal'

export { TemporalLocalizer } from './localizer-temporal.class'
export { loadTemporal } from './loadTemporal.function'
export type { TemporalAPI } from './loadTemporal.function'

/**
 * Create a {@link TemporalLocalizer}, resolving the Temporal namespace (native
 * or polyfilled) first. This is the recommended way to construct the localizer.
 */
export async function createTemporalLocalizer(options?: LocalizerOptions): Promise<TemporalLocalizer> {
  return new TemporalLocalizer(options, await loadTemporal())
}

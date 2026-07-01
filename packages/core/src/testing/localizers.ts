import type { LocalizerContract } from '@big-calendar/localizer'
import { createLuxonLocalizer } from '@big-calendar/localizer-luxon'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'

/**
 * Shared localizer harness for `@big-calendar/core` suites (§5.5).
 *
 * Date-dependent tests run against every shipped localizer for parity rather
 * than a hand-rolled fake. Every suite using `describe.each(LOCALIZER_CASES)`
 * automatically covers both `temporal` and `luxon`.
 *
 * Determinism: tests pin an explicit `timeZone` (default `UTC`) so output never
 * depends on the host. `Date` is never used for date math or assertions — only
 * to mint RFC-3339 primitive strings, and assertions read expected values back
 * from the localizer itself.
 */

/** Options accepted by a localizer factory in the harness. */
export interface TestLocalizerOptions {
  locale?: string
  timeZone?: string
}

/** One shipped localizer the suites must pass against. */
export interface LocalizerCase {
  /** Label interpolated into `describe.each` titles via `[$name]`. */
  name: string
  /** Factory resolving a ready-to-use localizer. */
  create: (options?: TestLocalizerOptions) => Promise<LocalizerContract>
}

const DEFAULTS: Required<TestLocalizerOptions> = { locale: 'en-US', timeZone: 'UTC' }

export const LOCALIZER_CASES: LocalizerCase[] = [
  {
    name: 'temporal',
    create: (options) => createTemporalLocalizer({ ...DEFAULTS, ...options }),
  },
  {
    name: 'luxon',
    create: (options) => Promise.resolve(createLuxonLocalizer({ ...DEFAULTS, ...options })),
  },
]

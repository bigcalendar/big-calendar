import { createTemporalLocalizer, type TemporalLocalizer } from '@big-calendar/localizer-temporal'

/**
 * Shared localizer harness for `@big-calendar/core` suites (§5.5).
 *
 * Date-dependent tests run against every shipped localizer for parity rather
 * than a hand-rolled fake. Today that is `temporal` only; the `luxon` arm joins
 * {@link LOCALIZER_CASES} as a single line once `@big-calendar/localizer-luxon`
 * is implemented, and every suite using `describe.each(LOCALIZER_CASES)` picks
 * it up automatically.
 *
 * Determinism: tests pin an explicit `timezone` (default `UTC`) so output never
 * depends on the host. `Date` is never used for date math or assertions — only
 * to mint RFC-3339 primitive strings, and assertions read expected values back
 * from the localizer itself.
 */

/** Options accepted by a localizer factory in the harness. */
export interface TestLocalizerOptions {
  locale?: string
  timezone?: string
}

/** One shipped localizer the suites must pass against. */
export interface LocalizerCase {
  /** Label interpolated into `describe.each` titles via `[$name]`. */
  name: string
  /** Async factory resolving a ready-to-use localizer. */
  create: (options?: TestLocalizerOptions) => Promise<TemporalLocalizer>
}

const DEFAULTS: Required<TestLocalizerOptions> = { locale: 'en-US', timezone: 'UTC' }

export const LOCALIZER_CASES: LocalizerCase[] = [
  {
    name: 'temporal',
    create: (options) => createTemporalLocalizer({ ...DEFAULTS, ...options }),
  },
]

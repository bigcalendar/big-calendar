import type { LocalizerContract } from '@big-calendar/core'
import { createLuxonLocalizer } from '@big-calendar/localizer-luxon'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'

/**
 * Shared localizer harness for `@big-calendar/vue` suites (mirrors the React
 * adapter's harness at `packages/react/src/testing/localizers.ts`).
 *
 * Suites using `describe.each(LOCALIZER_CASES)` automatically cover both the
 * Temporal and Luxon localizers for parity.
 *
 * Determinism: tests pin an explicit `timeZone` (default `UTC`) so output never
 * depends on the host.
 */

export interface TestLocalizerOptions {
  locale?: string
  timeZone?: string
}

export interface LocalizerCase {
  name: string
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

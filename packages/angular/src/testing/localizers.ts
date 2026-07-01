import type { LocalizerContract } from '@big-calendar/core'
import { createLuxonLocalizer } from '@big-calendar/localizer-luxon'
import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'

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

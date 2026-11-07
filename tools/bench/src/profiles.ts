// The benchmark profiles (D-44, D-92; testing standard, "Benchmarks").

/** One browser configuration the scenarios run under. */
export interface Profile {
  /** Used in result keys and the PR table. */
  name: string
  engine: 'chromium' | 'firefox' | 'webkit'
  /** CPU slowdown through CDP `Emulation.setCPUThrottlingRate` (Chromium only). */
  cpuThrottle: number
  /** Delete `globalThis.Temporal` before the page loads, so the polyfill path is measured. */
  deleteTemporal: boolean
  /** Gated profiles fail over their budget; tracked ones only report. */
  budgetMs: number | undefined
}

/** Every profile, in run order. */
export const PROFILES: readonly Profile[] = [
  // Gated at 50ms: native Temporal on a slowed CPU.
  {
    name: 'chromium-4x',
    engine: 'chromium',
    cpuThrottle: 4,
    deleteTemporal: false,
    budgetMs: 50,
  },
  // Gated at 100ms: the polyfill path. Playwright's WebKit has native Temporal, so it's deleted.
  {
    name: 'webkit-polyfill',
    engine: 'webkit',
    cpuThrottle: 1,
    deleteTemporal: true,
    budgetMs: 100,
  },
  // Tracked, not gated.
  {
    name: 'firefox',
    engine: 'firefox',
    cpuThrottle: 1,
    deleteTemporal: false,
    budgetMs: undefined,
  },
  {
    name: 'chromium-polyfill',
    engine: 'chromium',
    cpuThrottle: 1,
    deleteTemporal: true,
    budgetMs: undefined,
  },
]

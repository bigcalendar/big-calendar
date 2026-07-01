import type { Temporal } from 'temporal-polyfill'

/**
 * Lazy, feature-detecting loader for the Temporal API.
 *
 * Native hosts pay nothing: we use `globalThis.Temporal` when it exists and only
 * dynamically import the polyfill otherwise (§5.2 / §15.10). The resolved
 * namespace is cached so subsequent localizers share one instance.
 */

/**
 * The slice of the Temporal namespace the localizer needs (native or
 * polyfilled). Declared structurally so the full namespace assigns to it without
 * relying on an `import()` type expression.
 */
export interface TemporalAPI {
  Instant: { from(item: string): Temporal.Instant }
  ZonedDateTime: { from(item: string): Temporal.ZonedDateTime }
  PlainDate: { from(item: string): Temporal.PlainDate }
}

let cached: TemporalAPI | undefined

interface MaybeTemporalGlobal {
  Temporal?: TemporalAPI
}

/** Resolve the Temporal namespace, loading the polyfill on demand. */
export async function loadTemporal(): Promise<TemporalAPI> {
  if (cached) {
    return cached
  }
  const native = (globalThis as MaybeTemporalGlobal).Temporal
  cached = native ?? (await import('temporal-polyfill')).Temporal
  return cached
}

/**
 * Full IANA time-zone list sourced from `Intl.supportedValuesOf('timeZone')`,
 * which is available in every browser and Node version this project targets.
 * The list is computed once at module load so it is stable across the session.
 */
export const timeZoneList: readonly string[] = Intl.supportedValuesOf('timeZone')

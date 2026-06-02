/**
 * Ponyfill for `Intl.Locale` week information (`getWeekInfo()` / `weekInfo`).
 *
 * Week start is load-bearing for the calendar (month grid alignment, week view),
 * so we never assume the host exposes it. When the native API is present we use
 * it; otherwise we fall back to a compact CLDR-derived region table. `firstDay`
 * and `weekend` entries follow ISO-8601: 1 = Monday … 7 = Sunday.
 */

export interface WeekInfo {
  /** 1 = Monday … 7 = Sunday. */
  firstDay: number
  /** Weekday numbers that make up the weekend (ISO-8601). */
  weekend: number[]
  /** Minimal days in the first week of the year. */
  minimalDays: number
}

/** CLDR default ("001"): week starts Monday, weekend Sat+Sun. */
const DEFAULT_WEEK_INFO: WeekInfo = { firstDay: 1, weekend: [6, 7], minimalDays: 1 }

/** Regions whose week starts on Sunday (7). Best-effort CLDR subset. */
const SUNDAY_FIRST = new Set<string>([
  'AG', 'AR', 'AS', 'AU', 'BD', 'BR', 'BS', 'BT', 'BW', 'BZ', 'CA', 'CN', 'CO',
  'DM', 'DO', 'ET', 'GT', 'GU', 'HK', 'HN', 'ID', 'IL', 'IN', 'JM', 'JP', 'KE',
  'KH', 'KR', 'LA', 'MH', 'MM', 'MO', 'MT', 'MX', 'MZ', 'NI', 'NP', 'PA', 'PE',
  'PH', 'PK', 'PR', 'PY', 'SA', 'SG', 'SV', 'TH', 'TT', 'TW', 'UM', 'US', 'VE',
  'VI', 'WS', 'YE', 'ZA', 'ZW',
])

/** Regions whose week starts on Saturday (6). Best-effort CLDR subset. */
const SATURDAY_FIRST = new Set<string>(['AF', 'BH', 'DJ', 'DZ', 'EG', 'IQ', 'IR', 'JO', 'KW', 'LY', 'OM', 'QA', 'SD', 'SY'])

/** Regions with a Friday+Saturday weekend. Best-effort CLDR subset. */
const FRI_SAT_WEEKEND = new Set<string>(['AE', 'AF', 'BH', 'DJ', 'DZ', 'EG', 'IQ', 'IR', 'JO', 'KW', 'LY', 'OM', 'QA', 'SA', 'SD', 'SY', 'YE'])

interface MaybeWeekInfoLocale extends Intl.Locale {
  getWeekInfo?: () => WeekInfo
  weekInfo?: WeekInfo
}

function nativeWeekInfo(locale: Intl.Locale): WeekInfo | undefined {
  const candidate = locale as MaybeWeekInfoLocale
  try {
    if (typeof candidate.getWeekInfo === 'function') {
      return candidate.getWeekInfo()
    }
    if (candidate.weekInfo) {
      return candidate.weekInfo
    }
  } catch {
    // Some engines throw on partial support; fall through to the table.
  }
  return undefined
}

function regionOf(locale: Intl.Locale): string | undefined {
  if (locale.region) {
    return locale.region.toUpperCase()
  }
  const maximized = (() => {
    try {
      return locale.maximize().region
    } catch {
      return undefined
    }
  })()
  return maximized ? maximized.toUpperCase() : undefined
}

/**
 * Resolve week information for a locale, preferring the native `Intl.Locale`
 * API and falling back to the region table when the host lacks it.
 */
export function getWeekInfo(locale: Intl.Locale): WeekInfo {
  const native = nativeWeekInfo(locale)
  if (native) {
    return native
  }

  const region = regionOf(locale)
  if (!region) {
    return DEFAULT_WEEK_INFO
  }

  const firstDay = SUNDAY_FIRST.has(region) ? 7 : SATURDAY_FIRST.has(region) ? 6 : 1
  const weekend = FRI_SAT_WEEKEND.has(region) ? [5, 6] : [6, 7]
  return { firstDay, weekend, minimalDays: 1 }
}

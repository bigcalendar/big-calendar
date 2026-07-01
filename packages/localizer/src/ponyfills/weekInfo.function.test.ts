import { describe, expect, it } from 'vitest'
import { getWeekInfo } from './weekInfo.function'

/** A locale-like object with no native week API, to force the table fallback. */
function fakeLocale(tag: string, region?: string): Intl.Locale {
  return {
    toString: () => tag,
    region,
    maximize: () => ({ region: region ?? 'US' }) as Intl.Locale,
  } as unknown as Intl.Locale
}

describe('getWeekInfo', () => {
  it('uses the native Intl.Locale API when present', () => {
    const info = getWeekInfo(new Intl.Locale('en-US'))
    expect(typeof info.firstDay).toBe('number')
    expect(Array.isArray(info.weekend)).toBe(true)
  })

  it('falls back to Sunday-first for US-style regions', () => {
    expect(getWeekInfo(fakeLocale('en-US', 'US')).firstDay).toBe(7)
  })

  it('falls back to Saturday-first for relevant regions', () => {
    expect(getWeekInfo(fakeLocale('ar-EG', 'EG')).firstDay).toBe(6)
  })

  it('falls back to Monday-first for unlisted regions', () => {
    const info = getWeekInfo(fakeLocale('de-DE', 'DE'))
    expect(info.firstDay).toBe(1)
    expect(info.weekend).toEqual([6, 7])
  })

  it('uses a Friday/Saturday weekend where applicable', () => {
    expect(getWeekInfo(fakeLocale('ar-AE', 'AE')).weekend).toEqual([5, 6])
  })

  it('maximizes the locale to find a region when none is given', () => {
    expect(getWeekInfo(fakeLocale('en', undefined)).firstDay).toBe(7)
  })

  it('defaults when no region can be resolved', () => {
    const noRegion = {
      toString: () => 'und',
      region: undefined,
      maximize: () => ({ region: undefined }) as unknown as Intl.Locale,
    } as unknown as Intl.Locale
    expect(getWeekInfo(noRegion).firstDay).toBe(1)
  })
})

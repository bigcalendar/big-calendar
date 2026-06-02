import type { LocalizerContract } from '@big-calendar/localizer'
import { describe, expect, it } from 'vitest'
import { Navigate, Views } from '../constants/views.constant'
import { navigateDate } from './navigateDate.function'

/**
 * Minimal localizer test double. Only `add` is implemented (UTC date math via
 * the native `Date`, which is fine for a stand-in); every other contract method
 * is intentionally absent. Shared with the store test via import — keeping it in
 * a test file keeps it out of coverage.
 */
export function makeFakeLocalizer(): LocalizerContract {
  const add: LocalizerContract['add'] = ({ value, amount, unit }) => {
    const d = new Date(value)
    switch (unit) {
      case 'day':
        d.setUTCDate(d.getUTCDate() + amount)
        break
      case 'week':
        d.setUTCDate(d.getUTCDate() + amount * 7)
        break
      case 'month':
        d.setUTCMonth(d.getUTCMonth() + amount)
        break
      case 'year':
        d.setUTCFullYear(d.getUTCFullYear() + amount)
        break
      case 'hour':
        d.setUTCHours(d.getUTCHours() + amount)
        break
      case 'minute':
        d.setUTCMinutes(d.getUTCMinutes() + amount)
        break
      case 'second':
        d.setUTCSeconds(d.getUTCSeconds() + amount)
        break
      case 'millisecond':
        d.setUTCMilliseconds(d.getUTCMilliseconds() + amount)
        break
    }
    return d.toISOString()
  }
  return { add } as unknown as LocalizerContract
}

const localizer = makeFakeLocalizer()
const date = '2026-06-15T00:00:00.000Z'
const getNow = () => '2026-01-20T00:00:00.000Z'

describe('navigateDate', () => {
  it('TODAY returns getNow()', () => {
    expect(
      navigateDate({ localizer, date, direction: Navigate.TODAY, view: Views.MONTH, getNow }),
    ).toBe('2026-01-20T00:00:00.000Z')
  })

  it('DATE returns the explicit target', () => {
    expect(
      navigateDate({
        localizer,
        date,
        direction: Navigate.DATE,
        view: Views.MONTH,
        getNow,
        target: '2027-03-01T00:00:00.000Z',
      }),
    ).toBe('2027-03-01T00:00:00.000Z')
  })

  it('DATE without a target keeps the current date', () => {
    expect(
      navigateDate({ localizer, date, direction: Navigate.DATE, view: Views.MONTH, getNow }),
    ).toBe(date)
  })

  it('NEXT in month view advances one month', () => {
    expect(
      navigateDate({ localizer, date, direction: Navigate.NEXT, view: Views.MONTH, getNow }),
    ).toBe('2026-07-15T00:00:00.000Z')
  })

  it('PREVIOUS in month view goes back one month', () => {
    expect(
      navigateDate({ localizer, date, direction: Navigate.PREVIOUS, view: Views.MONTH, getNow }),
    ).toBe('2026-05-15T00:00:00.000Z')
  })

  it('NEXT in week view advances seven days', () => {
    expect(
      navigateDate({ localizer, date, direction: Navigate.NEXT, view: Views.WEEK, getNow }),
    ).toBe('2026-06-22T00:00:00.000Z')
  })

  it('NEXT in work_week view advances seven days', () => {
    expect(
      navigateDate({ localizer, date, direction: Navigate.NEXT, view: Views.WORK_WEEK, getNow }),
    ).toBe('2026-06-22T00:00:00.000Z')
  })

  it('PREVIOUS in day view goes back one day', () => {
    expect(
      navigateDate({ localizer, date, direction: Navigate.PREVIOUS, view: Views.DAY, getNow }),
    ).toBe('2026-06-14T00:00:00.000Z')
  })

  it('NEXT in agenda view advances the default 30-day length', () => {
    expect(
      navigateDate({ localizer, date, direction: Navigate.NEXT, view: Views.AGENDA, getNow }),
    ).toBe('2026-07-15T00:00:00.000Z')
  })

  it('NEXT in agenda view honors a custom length', () => {
    expect(
      navigateDate({
        localizer,
        date,
        direction: Navigate.NEXT,
        view: Views.AGENDA,
        getNow,
        length: 7,
      }),
    ).toBe('2026-06-22T00:00:00.000Z')
  })
})

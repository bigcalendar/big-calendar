import { beforeAll, describe, expect, it } from 'vitest'
import { Navigate, Views } from '../constants/views.constant'
import { LOCALIZER_CASES } from '../testing/localizers'
import { navigateDate } from './navigateDate.function'

const date = '2026-06-15T00:00:00.000Z'
const getNow = () => '2026-01-20T00:00:00.000Z'

describe.each(LOCALIZER_CASES)('navigateDate [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    // navigateDate only ever calls `add`; one real localizer covers every view's step.
    localizer = await create()
  })

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
    ).toBe(localizer.add({ value: date, amount: 1, unit: 'month' }))
  })

  it('PREVIOUS in month view goes back one month', () => {
    expect(
      navigateDate({ localizer, date, direction: Navigate.PREVIOUS, view: Views.MONTH, getNow }),
    ).toBe(localizer.add({ value: date, amount: -1, unit: 'month' }))
  })

  it('NEXT in week view advances one week', () => {
    expect(
      navigateDate({ localizer, date, direction: Navigate.NEXT, view: Views.WEEK, getNow }),
    ).toBe(localizer.add({ value: date, amount: 1, unit: 'week' }))
  })

  it('NEXT in work_week view advances one week', () => {
    expect(
      navigateDate({ localizer, date, direction: Navigate.NEXT, view: Views.WORK_WEEK, getNow }),
    ).toBe(localizer.add({ value: date, amount: 1, unit: 'week' }))
  })

  it('PREVIOUS in day view goes back one day', () => {
    expect(
      navigateDate({ localizer, date, direction: Navigate.PREVIOUS, view: Views.DAY, getNow }),
    ).toBe(localizer.add({ value: date, amount: -1, unit: 'day' }))
  })

  it('NEXT in agenda view advances the default 30-day length', () => {
    expect(
      navigateDate({ localizer, date, direction: Navigate.NEXT, view: Views.AGENDA, getNow }),
    ).toBe(localizer.add({ value: date, amount: 30, unit: 'day' }))
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
    ).toBe(localizer.add({ value: date, amount: 7, unit: 'day' }))
  })
})

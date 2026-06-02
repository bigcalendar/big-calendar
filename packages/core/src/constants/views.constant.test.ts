import { describe, expect, it } from 'vitest'
import { Navigate, Views } from './views.constant'

describe('Views', () => {
  it('matches v1 view string values for parity', () => {
    expect(Views).toEqual({
      MONTH: 'month',
      WEEK: 'week',
      WORK_WEEK: 'work_week',
      DAY: 'day',
      AGENDA: 'agenda',
    })
  })
})

describe('Navigate', () => {
  it('matches v1 navigate constant values for parity', () => {
    expect(Navigate).toEqual({
      PREVIOUS: 'PREV',
      NEXT: 'NEXT',
      TODAY: 'TODAY',
      DATE: 'DATE',
    })
  })
})

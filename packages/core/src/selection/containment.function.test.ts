import { describe, expect, it } from 'vitest'
import { getContainingBgEvents } from './containment.function'

interface Ev {
  id: number
  start: string
  end: string
}

const sel = (start: string, end: string) => ({ start, end })

describe('getContainingBgEvents', () => {
  it('returns background events that fully contain the selection', () => {
    const bg: Ev = { id: 1, start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T12:00:00.000Z' }
    const result = getContainingBgEvents({
      selection: { ...sel('2026-06-15T10:00:00.000Z', '2026-06-15T11:00:00.000Z'), backgroundEvents: [bg] },
    })
    expect(result).toEqual([bg])
  })

  it('excludes background events that only partially overlap the selection', () => {
    // bg ends before the selection ends → does not fully contain
    const bg: Ev = { id: 2, start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:30:00.000Z' }
    const result = getContainingBgEvents({
      selection: { ...sel('2026-06-15T10:00:00.000Z', '2026-06-15T11:00:00.000Z'), backgroundEvents: [bg] },
    })
    expect(result).toEqual([])
  })

  it('excludes background events that start after the selection starts', () => {
    // bg starts after selection start → selection extends before bg
    const bg: Ev = { id: 3, start: '2026-06-15T10:30:00.000Z', end: '2026-06-15T12:00:00.000Z' }
    const result = getContainingBgEvents({
      selection: { ...sel('2026-06-15T10:00:00.000Z', '2026-06-15T11:00:00.000Z'), backgroundEvents: [bg] },
    })
    expect(result).toEqual([])
  })

  it('returns an empty array when backgroundEvents is absent', () => {
    const result = getContainingBgEvents({
      selection: sel('2026-06-15T10:00:00.000Z', '2026-06-15T11:00:00.000Z'),
    })
    expect(result).toEqual([])
  })

  it('returns an empty array when backgroundEvents is empty', () => {
    const result = getContainingBgEvents({
      selection: { ...sel('2026-06-15T10:00:00.000Z', '2026-06-15T11:00:00.000Z'), backgroundEvents: [] },
    })
    expect(result).toEqual([])
  })

  it('returns only the events that fully contain the selection when the array is mixed', () => {
    const container: Ev = { id: 4, start: '2026-06-15T08:00:00.000Z', end: '2026-06-15T17:00:00.000Z' }
    const partial: Ev = { id: 5, start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:30:00.000Z' }
    const result = getContainingBgEvents({
      selection: {
        ...sel('2026-06-15T10:00:00.000Z', '2026-06-15T11:00:00.000Z'),
        backgroundEvents: [container, partial],
      },
    })
    expect(result).toEqual([container])
  })

  it('uses custom accessors when provided', () => {
    const bg = { id: 6, startsAt: '2026-06-15T09:00:00.000Z', endsAt: '2026-06-15T12:00:00.000Z' }
    const result = getContainingBgEvents({
      selection: { ...sel('2026-06-15T10:00:00.000Z', '2026-06-15T11:00:00.000Z'), backgroundEvents: [bg] },
      bgStartAccessor: (ev) => ev.startsAt,
      bgEndAccessor: (ev) => ev.endsAt,
    })
    expect(result).toEqual([bg])
  })

  it('excludes background events where the accessor returns null', () => {
    const bg = { id: 7 }
    const result = getContainingBgEvents({
      selection: { ...sel('2026-06-15T10:00:00.000Z', '2026-06-15T11:00:00.000Z'), backgroundEvents: [bg] },
      bgStartAccessor: () => null,
      bgEndAccessor: () => null,
    })
    expect(result).toEqual([])
  })

  it('treats a bg event that exactly matches the selection bounds as containing', () => {
    const bg: Ev = { id: 8, start: '2026-06-15T10:00:00.000Z', end: '2026-06-15T11:00:00.000Z' }
    const result = getContainingBgEvents({
      selection: { ...sel('2026-06-15T10:00:00.000Z', '2026-06-15T11:00:00.000Z'), backgroundEvents: [bg] },
    })
    expect(result).toEqual([bg])
  })
})

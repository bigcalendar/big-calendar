import { describe, expect, it } from 'vitest'
import { accessor, DEFAULT_ACCESSORS, resolveAccessors, wrapAccessor } from './accessors.function'

interface Event {
  id: number
  title: string
  start: string
}

const event: Event = { id: 7, title: 'Standup', start: '2026-06-01T09:00:00Z' }

describe('accessor', () => {
  it('invokes a function accessor with the data', () => {
    expect(accessor({ data: event, field: (e: Event) => e.title })).toBe('Standup')
  })

  it('reads a present string key', () => {
    expect(accessor({ data: event, field: 'start' })).toBe('2026-06-01T09:00:00Z')
  })

  it('returns null for a missing string key', () => {
    expect(accessor({ data: event, field: 'nope' })).toBeNull()
  })

  it('returns null when data is not an object', () => {
    expect(accessor({ data: 'scalar', field: 'length' })).toBeNull()
  })

  it('returns null when data is null', () => {
    expect(accessor({ data: null, field: 'id' })).toBeNull()
  })

  it('passes a function accessor through even when data is null', () => {
    expect(accessor({ data: null, field: () => 'forced' })).toBe('forced')
  })
})

describe('wrapAccessor', () => {
  it('binds a field into a reusable reader', () => {
    const readTitle = wrapAccessor<Event, string>('title')
    expect(readTitle(event)).toBe('Standup')
  })

  it('propagates null for unresolved reads', () => {
    const readMissing = wrapAccessor<Event, string>('missing')
    expect(readMissing(event)).toBeNull()
  })
})

describe('resolveAccessors', () => {
  it('returns the v1-parity defaults when no overrides are given', () => {
    expect(resolveAccessors()).toEqual(DEFAULT_ACCESSORS)
  })

  it('defaults tooltip to the title field and resourceId to the resource id', () => {
    expect(DEFAULT_ACCESSORS.tooltip).toBe('title')
    expect(DEFAULT_ACCESSORS.resourceId).toBe('id')
  })

  it('merges overrides over the defaults, keeping untouched keys', () => {
    const start = (e: Event) => e.start
    const resolved = resolveAccessors<Event, unknown>({ start })
    expect(resolved.start).toBe(start)
    expect(resolved.title).toBe('title')
  })
})

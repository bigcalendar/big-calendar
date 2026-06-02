import { describe, expect, it } from 'vitest'
import { DEFAULT_ACCESSORS } from '../accessors/accessors.function'
import type { Accessors } from '../accessors/accessors.type'
import { groupEventsByResource } from './resources.function'

interface Event {
  id: number
  title: string
  resourceId?: number | number[]
}
interface Resource {
  id: number
  title: string
}

// DEFAULT_ACCESSORS: event.resource → 'resourceId', resource.resourceId → 'id'
const accessors = DEFAULT_ACCESSORS as unknown as Accessors<Event, Resource>

const ev = (id: number, resourceId?: number | number[]): Event => ({
  id,
  title: `e${id}`,
  ...(resourceId === undefined ? {} : { resourceId }),
})
const resources: Resource[] = [
  { id: 1, title: 'Room A' },
  { id: 2, title: 'Room B' },
]

describe('groupEventsByResource', () => {
  it('returns a single null group when there are no resources', () => {
    const events = [ev(1), ev(2)]
    const groups = groupEventsByResource({ events, resources: undefined, accessors })
    expect(groups).toHaveLength(1)
    expect(groups[0]).toMatchObject({ resource: null, resourceId: null })
    expect(groups[0]?.events).toBe(events)
  })

  it('buckets events under their resource, preserving resource order', () => {
    const groups = groupEventsByResource({
      events: [ev(1, 2), ev(2, 1), ev(3, 1)],
      resources,
      accessors,
    })
    expect(groups.map((g) => g.resourceId)).toEqual([1, 2])
    expect(groups[0]?.events.map((e) => e.id)).toEqual([2, 3])
    expect(groups[1]?.events.map((e) => e.id)).toEqual([1])
  })

  it('places an event with multiple resource ids into each group', () => {
    const groups = groupEventsByResource({ events: [ev(1, [1, 2])], resources, accessors })
    expect(groups[0]?.events.map((e) => e.id)).toEqual([1])
    expect(groups[1]?.events.map((e) => e.id)).toEqual([1])
  })

  it('drops events with no resource or an unknown resource id', () => {
    const groups = groupEventsByResource({ events: [ev(1), ev(2, 99)], resources, accessors })
    expect(groups.every((g) => g.events.length === 0)).toBe(true)
  })
})

import type { ResourceId } from '../types/calendar.type'

/**
 * Events bucketed under one resource. When the calendar has no resources, a
 * single group with `resource`/`resourceId` of `null` holds every event.
 */
export interface ResourceGroup<TEvent, TResource> {
  resource: TResource | null
  resourceId: ResourceId | null
  events: TEvent[]
}

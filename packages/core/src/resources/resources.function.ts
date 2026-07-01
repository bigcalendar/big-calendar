import { wrapAccessor } from '../accessors/accessors.function'
import type { Accessors } from '../accessors/accessors.type'
import type { ResourceGroup } from './resources.type'

/**
 * Bucket events under their resource(s), in resource order. With no resources,
 * returns a single `null` group holding every event. An event's `resource`
 * accessor may yield one id or many (it then lands in each matching group);
 * events whose resource matches none of the provided resources are dropped from
 * the grouped output. Ports v1's `Resources.groupEvents`. Pure.
 */
export function groupEventsByResource<TEvent, TResource>(args: {
  events: TEvent[]
  resources: TResource[] | undefined
  accessors: Accessors<TEvent, TResource>
}): ResourceGroup<TEvent, TResource>[] {
  const { events, resources, accessors } = args

  if (!resources) {
    return [{ resource: null, resourceId: null, events }]
  }

  const getResourceId = wrapAccessor(accessors.resourceId)
  const getEventResource = wrapAccessor(accessors.resource)

  const groups: ResourceGroup<TEvent, TResource>[] = resources.map((resource) => ({
    resource,
    resourceId: getResourceId(resource),
    events: [],
  }))
  const byId = new Map(groups.map((group) => [group.resourceId, group]))

  for (const event of events) {
    const raw = getEventResource(event)
    const ids = raw == null ? [] : Array.isArray(raw) ? raw : [raw]
    for (const id of ids) {
      byId.get(id)?.events.push(event)
    }
  }

  return groups
}

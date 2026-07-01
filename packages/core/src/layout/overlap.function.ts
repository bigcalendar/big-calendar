import type { DayLayoutAlgorithm, DayLayoutBox, DayLayoutEvent } from './layout.type'

/**
 * Internal placement node. Every event becomes exactly one of:
 * - a **container** (`rows` set) — the root of an overlap group,
 * - a **row** (`leaves` set, `container` set) — a lane inside a container,
 * - a **leaf** (`row`/`container` set) — an event sharing a row.
 *
 * Widths grow over their neighbours for the classic "overlapping" look, so we
 * never have to juggle z-indexes for sizing — paint order alone settles it.
 */
interface Node {
  event: DayLayoutEvent
  start: number
  end: number
  top: number
  height: number
  order: number
  rows?: Node[]
  leaves?: Node[]
  container?: Node
  row?: Node
}

/** The event's width before any overlap grow, as a fraction of the column. */
function baseWidth(node: Node): number {
  // A container is as wide as its busiest row needs (max leaves + the row
  // itself), plus the container's own lane.
  if (node.rows) {
    const columns =
      node.rows.reduce((max, row) => Math.max(max, (row.leaves?.length ?? 0) + 1), 0) + 1
    return 1 / columns
  }
  // A row splits the space its container left, between itself and its leaves.
  if (node.leaves && node.container) {
    return (1 - baseWidth(node.container)) / (node.leaves.length + 1)
  }
  // A leaf is as wide as its row.
  if (node.row) {
    return baseWidth(node.row)
  }
  return 1
}

/** The rendered width: grown ×1.7 (capped) unless growing would clip a sibling. */
function width(node: Node): number {
  const base = baseWidth(node)
  const grown = Math.min(1, base * 1.7)

  // Containers can always grow.
  if (node.rows) return grown
  // Rows grow only when they actually hold leaves.
  if (node.leaves) return node.leaves.length > 0 ? grown : base
  // Leaves grow unless they're the last one in their row.
  if (node.row?.leaves) {
    const leaves = node.row.leaves
    return leaves.indexOf(node) === leaves.length - 1 ? base : grown
  }
  return base
}

/** The event's left edge, as a fraction of the column. */
function xOffset(node: Node): number {
  // Containers start at the left.
  if (node.rows) return 0
  // Rows start where their container ends.
  if (node.leaves && node.container) return baseWidth(node.container)
  // Leaves spread evenly across the space left by their row.
  const row = node.row
  if (row?.leaves) {
    const index = row.leaves.indexOf(node) + 1
    return xOffset(row) + index * baseWidth(row)
  }
  return 0
}

/** Two events share a row if they start together, or one starts inside the other. */
function onSameRow(a: Node, b: Node, minimumStartDifference: number): boolean {
  return (
    Math.abs(b.start - a.start) < minimumStartDifference ||
    (b.start > a.start && b.start < a.end)
  )
}

/**
 * Order events for grouping: by start ascending, ties broken by longer events
 * first, then walk so that each overlap group is contiguous. Mirrors v1's
 * `sortByRender` so container/row/leaf assignment is stable.
 */
function sortByRender(events: Node[]): Node[] {
  const byTime = [...events].sort((a, b) => a.start - b.start || b.end - a.end)

  const sorted: Node[] = []
  let event = byTime.shift()
  while (event) {
    sorted.push(event)

    // First event whose start is at/after this one's end → start of next group.
    const current = event
    const nextGroupAt = byTime.findIndex((test) => current.end <= test.start)

    // If that event isn't already adjacent, pull it forward so groups stay contiguous.
    if (nextGroupAt > 0) {
      sorted.push(...byTime.splice(nextGroupAt, 1))
    }

    event = byTime.shift()
  }

  return sorted
}

/**
 * Overlapping day-layout: events that share time grow over one another in
 * staggered columns, producing the dense, Google-Calendar-style packing.
 *
 * Pure: vertical placement (`top`/`height`) is passed straight through; only
 * the horizontal `left`/`width` are computed. Output is in paint order, with
 * `zIndex` rising so later events sit above the ones they overlap.
 */
export const overlap: DayLayoutAlgorithm = ({ events, minimumStartDifference }): DayLayoutBox[] => {
  const nodes: Node[] = events.map((event, order) => ({
    event,
    start: event.start,
    end: event.end,
    top: event.top,
    height: event.height,
    order,
  }))

  const inRenderOrder = sortByRender(nodes)
  inRenderOrder.forEach((node, order) => {
    node.order = order
  })

  // Group overlapping events into containers → rows → leaves, keeping order.
  const containers: Node[] = []
  for (const event of inRenderOrder) {
    const container = containers.find(
      (c) => c.end > event.start || Math.abs(event.start - c.start) < minimumStartDifference,
    )

    // No container fits → this event becomes one.
    if (!container) {
      event.rows = []
      containers.push(event)
      continue
    }

    event.container = container
    const rows = container.rows ?? []

    // Slot it into the last existing row it shares time with, if any.
    const row = rows.findLast((candidate) => onSameRow(candidate, event, minimumStartDifference))

    if (row) {
      const leaves = row.leaves ?? []
      leaves.push(event)
      row.leaves = leaves
      event.row = row
    } else {
      // No row fits → this event becomes a row.
      event.leaves = []
      rows.push(event)
    }
  }

  return inRenderOrder.map((node) => ({
    id: node.event.id,
    top: node.top,
    height: node.height,
    left: Math.max(0, xOffset(node)),
    width: width(node),
    zIndex: node.order,
  }))
}

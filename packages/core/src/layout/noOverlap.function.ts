import type { DayLayoutAlgorithm, DayLayoutBox, DayLayoutEvent } from './layout.type'

/**
 * Internal placement node for the column-packing pass. `friends` are the events
 * this one vertically overlaps; `idx` is the column it lands in; `size` is that
 * column's width as a fraction of the day column.
 */
interface Placed {
  event: DayLayoutEvent
  top: number
  height: number
  friends: Placed[]
  idx: number
  size: number
  order: number
}

/** Vertical-overlap test, faithful to v1: `a` is the earlier (i), `b` the later (j). */
function overlapsVertically(a: Placed, b: Placed): boolean {
  const aTop = a.top
  const aBottom = a.top + a.height
  const bTop = b.top
  const bBottom = b.top + b.height
  return (
    (bTop >= aTop && bBottom <= aBottom) ||
    (bBottom > aTop && bBottom <= aBottom) ||
    (bTop >= aTop && bTop < aBottom)
  )
}

/** The smallest non-negative column index not already taken by a friend. */
function lowestFreeIdx(taken: Set<number>): number {
  let i = 0
  while (taken.has(i)) i++
  return i
}

/** Gather a node and every friend reachable from it into `acc` (connected component). */
function collectComponent(node: Placed, acc: Set<Placed>): void {
  if (acc.has(node)) return
  acc.add(node)
  for (const friend of node.friends) collectComponent(friend, acc)
}

/**
 * Non-overlapping day-layout: events that share time are packed into adjacent
 * columns that never visually overlap, each connected group splitting the
 * column evenly. The last column in a group stretches to the right edge.
 *
 * Pure and fraction-based: `top`/`height` pass through, `left`/`width` are
 * computed as `0..1` fractions (no pixel padding — the React layer adds gaps).
 * `minimumStartDifference` is unused here; packing is purely by vertical overlap.
 */
export const noOverlap: DayLayoutAlgorithm = ({ events }): DayLayoutBox[] => {
  const placed: Placed[] = events.map((event, order) => ({
    event,
    top: event.top,
    height: event.height,
    friends: [],
    idx: -1,
    size: -1,
    order,
  }))

  // Top to bottom; ties go to the taller event first (matches v1).
  placed.sort((a, b) => {
    if (a.top !== b.top) return a.top - b.top
    return b.top + b.height - (a.top + a.height)
  })
  placed.forEach((node, order) => {
    node.order = order
  })

  // Build the bidirectional "friends" graph of vertically overlapping events.
  placed.forEach((a, i) => {
    for (const b of placed.slice(i + 1)) {
      if (overlapsVertically(a, b)) {
        a.friends.push(b)
        b.friends.push(a)
      }
    }
  })

  // Assign each event the lowest column not used by an already-placed friend.
  for (const node of placed) {
    const taken = new Set<number>()
    for (const friend of node.friends) {
      if (friend.idx >= 0) taken.add(friend.idx)
    }
    node.idx = lowestFreeIdx(taken)
  }

  // Each connected group splits the width evenly by its widest column index.
  for (const node of placed) {
    if (node.size >= 0) continue
    const component = new Set<Placed>()
    collectComponent(node, component)
    let maxIdx = 0
    for (const member of component) maxIdx = Math.max(maxIdx, member.idx)
    const size = 1 / (maxIdx + 1)
    for (const member of component) member.size = size
  }

  return placed.map((node) => {
    const left = node.idx * node.size
    // The right-most event in its group stretches to fill the remaining width.
    const maxFriendIdx = node.friends.reduce((max, friend) => Math.max(max, friend.idx), 0)
    const width = maxFriendIdx <= node.idx ? 1 - node.idx * node.size : node.size
    return {
      id: node.event.id,
      top: node.top,
      height: node.height,
      left,
      width,
      zIndex: node.order,
    }
  })
}

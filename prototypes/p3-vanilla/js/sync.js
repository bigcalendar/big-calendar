// Keyed child reconciliation: reuses existing elements by key, as a framework
// would, so focused nodes and screen-reader context survive re-renders.
export function sync(parent, items) {
  const old = (parent.__keyed ??= new Map())
  const next = new Map()
  let cursor = parent.firstChild
  for (const item of items) {
    let el = old.get(item.key)
    if (!el) el = item.create()
    item.update?.(el)
    next.set(item.key, el)
    if (el !== cursor) parent.insertBefore(el, cursor)
    else cursor = cursor.nextSibling
  }
  for (const [key, el] of old) if (!next.has(key)) el.remove()
  parent.__keyed = next
}

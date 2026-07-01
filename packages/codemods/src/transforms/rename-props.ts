import type { Transform } from 'jscodeshift'

/**
 * Maps old v1 prop names to their new equivalents.
 *
 * Note: `resourceGroupingLayout` value type changed (boolean → 'resource'|'day').
 * The prop is renamed here; the value itself is left as-is and should be
 * reviewed manually (false → 'resource', true → 'day').
 */
const PROP_MAP: Record<string, string> = {
  resourceGroupingLayout: 'resourceLayout',
  onSelecting: 'onSlotSelecting',
}

const TARGET_ELEMENTS = new Set(['Calendar', 'CalendarProvider'])

const transform: Transform = (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)
  let modified = false

  root
    .find(j.JSXOpeningElement)
    .filter((path) => {
      const { name } = path.node
      return name.type === 'JSXIdentifier' && TARGET_ELEMENTS.has(name.name)
    })
    .forEach((path) => {
      ;(path.node.attributes ?? []).forEach((attr) => {
        if (
          attr.type === 'JSXAttribute' &&
          attr.name.type === 'JSXIdentifier' &&
          attr.name.name in PROP_MAP
        ) {
          attr.name = j.jsxIdentifier(PROP_MAP[attr.name.name as string]!)
          modified = true
        }
      })
    })

  return modified ? root.toSource() : null
}

export const parser = 'tsx' as const
export default transform

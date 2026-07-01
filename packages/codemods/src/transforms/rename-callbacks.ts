import type { JSXAttribute, Transform } from 'jscodeshift'

/** Maps old v1 callback prop names to their new equivalents. */
const CALLBACK_MAP: Record<string, string> = {
  onSelectEvent: 'onEventClick',
  onDoubleClickEvent: 'onEventDoubleClick',
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
          attr.name.name in CALLBACK_MAP
        ) {
          ;(attr as JSXAttribute).name = j.jsxIdentifier(
            CALLBACK_MAP[attr.name.name as string]!,
          )
          modified = true
        }
      })
    })

  return modified ? root.toSource() : null
}

export const parser = 'tsx' as const
export default transform

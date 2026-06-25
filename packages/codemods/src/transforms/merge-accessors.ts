import type { JSXAttribute, ObjectExpression, ObjectProperty, Property, Transform } from 'jscodeshift'

/** Maps old v1 `*Accessor` prop names to their `accessors` object keys. */
const PROP_MAP: Record<string, string> = {
  titleAccessor: 'title',
  tooltipAccessor: 'tooltip',
  allDayAccessor: 'allDay',
  startAccessor: 'start',
  endAccessor: 'end',
  resourceAccessor: 'resource',
  resourceIdAccessor: 'resourceId',
  resourceTitleAccessor: 'resourceTitle',
  draggableAccessor: 'draggable',
  resizableAccessor: 'resizable',
  typeAccessor: 'type',
}

/** Extracts the JS expression from a JSXAttribute value. */
function extractValue(attr: JSXAttribute, j: Parameters<Transform>[1]['jscodeshift']) {
  const { value } = attr
  if (value === null) return j.booleanLiteral(true)
  if (value.type === 'StringLiteral') return j.stringLiteral(value.value)
  if (value.type === 'JSXExpressionContainer') {
    const { expression } = value
    return expression.type === 'JSXEmptyExpression' ? j.identifier('undefined') : expression
  }
  return j.identifier('undefined')
}

const transform: Transform = (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)
  let modified = false

  root
    .find(j.JSXOpeningElement)
    .filter((path) => {
      const { name } = path.node
      return name.type === 'JSXIdentifier' && name.name === 'Calendar'
    })
    .forEach((path) => {
      const { attributes } = path.node

      // Collect *Accessor attributes present on this element
      const accessorAttrs = attributes.filter(
        (attr): attr is JSXAttribute =>
          attr.type === 'JSXAttribute' &&
          attr.name.type === 'JSXIdentifier' &&
          attr.name.name in PROP_MAP,
      ) as JSXAttribute[]

      if (accessorAttrs.length === 0) return

      // Build object properties for the collected accessors
      const newProperties = accessorAttrs.map((attr) => {
        const key = PROP_MAP[(attr.name as { name: string }).name]
        return j.property('init', j.identifier(key), extractValue(attr, j)) as Property
      })

      // Find an existing `accessors` attribute to merge into
      const existingAttr = attributes.find(
        (attr): attr is JSXAttribute =>
          attr.type === 'JSXAttribute' &&
          attr.name.type === 'JSXIdentifier' &&
          (attr.name as { name: string }).name === 'accessors',
      ) as JSXAttribute | undefined

      if (existingAttr) {
        const container = existingAttr.value
        if (
          container?.type === 'JSXExpressionContainer' &&
          container.expression.type === 'ObjectExpression'
        ) {
          ;(container.expression as ObjectExpression).properties.push(...(newProperties as ObjectProperty[]))
        }
      } else {
        // Insert a new `accessors={{ … }}` prop in place of the first accessor prop
        const firstIdx = attributes.findIndex(
          (attr) =>
            attr.type === 'JSXAttribute' &&
            attr.name.type === 'JSXIdentifier' &&
            (attr.name as { name: string }).name in PROP_MAP,
        )
        const newAttr = j.jsxAttribute(
          j.jsxIdentifier('accessors'),
          j.jsxExpressionContainer(j.objectExpression(newProperties)),
        )
        attributes.splice(firstIdx, 0, newAttr)
      }

      // Remove the individual *Accessor props
      path.node.attributes = attributes.filter(
        (attr) =>
          !(
            attr.type === 'JSXAttribute' &&
            attr.name.type === 'JSXIdentifier' &&
            (attr.name as { name: string }).name in PROP_MAP
          ),
      )

      modified = true
    })

  return modified ? root.toSource() : null
}

export const parser = 'tsx' as const
export default transform

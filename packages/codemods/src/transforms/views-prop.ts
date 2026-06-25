import type {
  BooleanLiteral,
  Expression,
  JSXAttribute,
  JSXExpressionContainer,
  ObjectExpression,
  ObjectProperty,
  Property,
  StringLiteral,
  Transform,
} from 'jscodeshift'

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
      const attrs = (path.node.attributes ?? []) as JSXAttribute[]
      const viewsAttr = attrs.find(
        (attr) =>
          attr.type === 'JSXAttribute' &&
          attr.name.type === 'JSXIdentifier' &&
          (attr.name as { name: string }).name === 'views',
      )
      if (!viewsAttr) return

      const attrValue = viewsAttr.value

      // ── Case 1: views="month" (string literal) → views={['month']}
      if (attrValue !== null && attrValue !== undefined && attrValue.type === 'StringLiteral') {
        viewsAttr.value = j.jsxExpressionContainer(
          j.arrayExpression([j.stringLiteral((attrValue as StringLiteral).value)]),
        )
        modified = true
        return
      }

      // ── Case 2: views={...} — unwrap the expression container
      if (attrValue == null || attrValue.type !== 'JSXExpressionContainer') return
      const expr = (attrValue as JSXExpressionContainer).expression
      if (expr.type === 'JSXEmptyExpression') return

      // ── Case 2a: views={['month', 'week']} — array already compatible, skip
      if (expr.type === 'ArrayExpression') return

      // ── Case 2b: views={{ month: true, week: CustomView, day: false }}
      if (expr.type !== 'ObjectExpression') return

      const objExpr = expr as ObjectExpression
      const viewKeys: string[] = []
      const defEntries: Array<{ key: string; value: Expression }> = []

      for (const prop of objExpr.properties) {
        // Skip spread elements (SpreadElement / SpreadProperty)
        if (prop.type === 'SpreadElement' || prop.type === 'SpreadProperty') continue
        const p = prop as Property | ObjectProperty
        // Resolve the key name
        let keyName: string | null = null
        if (p.key.type === 'Identifier') keyName = (p.key as { name: string }).name
        else if (p.key.type === 'StringLiteral') keyName = (p.key as StringLiteral).value
        if (!keyName) continue

        const val = p.value as Expression
        if (val.type === 'BooleanLiteral') {
          if ((val as BooleanLiteral).value) viewKeys.push(keyName)
          // false → excluded (view disabled), do not add to viewKeys
        } else {
          // Non-boolean value → treat as a custom component registration
          defEntries.push({ key: keyName, value: val })
        }
      }

      viewsAttr.value = j.jsxExpressionContainer(
        j.arrayExpression(viewKeys.map((k) => j.stringLiteral(k))),
      )

      // If any custom component registrations exist, insert a `viewDefinitions` prop
      if (defEntries.length > 0) {
        const defProps = defEntries.map(({ key, value }) =>
          j.property('init', j.identifier(key), value as Parameters<typeof j.property>[2]),
        )
        const defAttr = j.jsxAttribute(
          j.jsxIdentifier('viewDefinitions'),
          j.jsxExpressionContainer(j.objectExpression(defProps as unknown as Property[])),
        )
        // Insert viewDefinitions immediately after the views prop
        const nodeAttrs = path.node.attributes ?? []
        const viewsIdx = nodeAttrs.indexOf(viewsAttr)
        nodeAttrs.splice(viewsIdx + 1, 0, defAttr)
      }

      modified = true
    })

  return modified ? root.toSource() : null
}

export const parser = 'tsx' as const
export default transform

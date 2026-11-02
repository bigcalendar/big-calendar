/**
 * Every component in a `.component.tsx` file sets `displayName` (D-46). A component is an exported
 * function whose name starts with a capital letter.
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Exported components set displayName (D-46).' },
    schema: [],
    messages: {
      missing:
        "Set `{{name}}.displayName = '{{name}}'` (D-46, docs/standards/react.md).",
    },
  },
  create(context) {
    if (!context.filename.endsWith('.component.tsx')) return {}
    const components = new Map()
    const named = new Set()
    return {
      'ExportNamedDeclaration > FunctionDeclaration'(node) {
        if (node.id && /^[A-Z]/.test(node.id.name))
          components.set(node.id.name, node)
      },
      'AssignmentExpression[left.type="MemberExpression"][left.property.name="displayName"]'(
        node,
      ) {
        if (node.left.object.type === 'Identifier')
          named.add(node.left.object.name)
      },
      'Program:exit'() {
        for (const [name, node] of components) {
          if (!named.has(name))
            context.report({ node, messageId: 'missing', data: { name } })
        }
      },
    }
  },
}

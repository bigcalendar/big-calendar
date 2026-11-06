/**
 * D-46, as D-102 scopes it: a function we declare and name takes at most one parameter (an object
 * when it needs more than one value). Inline callbacks passed to another API (`sort((a, b) => …)`,
 * `reduce`, event handlers) take the parameters their caller defines, so they're exempt.
 */

/** @param {import('estree').Node & { parent?: import('estree').Node }} node */
function isNamed(node) {
  if (node.type === 'FunctionDeclaration') return true
  const parent = node.parent
  if (!parent) return false
  if (
    parent.type === 'VariableDeclarator' ||
    parent.type === 'MethodDefinition'
  )
    return true
  if (parent.type === 'AssignmentExpression' && parent.right === node)
    return true
  if (parent.type === 'PropertyDefinition') return true
  return false
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Named functions take one object parameter (D-46, D-102).',
    },
    schema: [],
    messages: {
      tooMany:
        'Pass one object parameter instead of {{count}} parameters (D-46, docs/standards/code.md). Inline callbacks passed to another API are exempt.',
    },
  },
  create(context) {
    /** @param {any} node */
    function check(node) {
      if (node.params.length > 1 && isNamed(node)) {
        context.report({
          node,
          messageId: 'tooMany',
          data: { count: String(node.params.length) },
        })
      }
    }
    return {
      FunctionDeclaration: check,
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    }
  },
}

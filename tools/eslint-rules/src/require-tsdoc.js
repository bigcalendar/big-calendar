/**
 * Every exported symbol has a TSDoc comment (D-65). `eslint-plugin-tsdoc` checks the comment's
 * syntax; this rule checks that it exists. Re-exports (`export { x } from`, `export *`) are
 * documented where they're declared.
 */

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'Exported symbols have a TSDoc comment (D-65).' },
    schema: [],
    messages: {
      missing:
        'Document the exported `{{name}}` with a TSDoc comment (D-65, docs/standards/documentation.md).',
    },
  },
  create(context) {
    const source = context.sourceCode
    function hasDoc(node) {
      return source
        .getCommentsBefore(node)
        .some(
          (comment) =>
            comment.type === 'Block' && comment.value.startsWith('*'),
        )
    }
    function nameOf(declaration) {
      if (declaration.id?.name) return declaration.id.name
      if (declaration.declarations) {
        return declaration.declarations.map((d) => d.id.name ?? '…').join(', ')
      }
      return 'default'
    }
    return {
      ExportNamedDeclaration(node) {
        if (!node.declaration || hasDoc(node)) return
        context.report({
          node,
          messageId: 'missing',
          data: { name: nameOf(node.declaration) },
        })
      },
      ExportDefaultDeclaration(node) {
        if (!hasDoc(node))
          context.report({
            node,
            messageId: 'missing',
            data: { name: 'default' },
          })
      },
    }
  },
}

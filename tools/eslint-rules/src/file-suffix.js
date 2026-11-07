import { basename } from 'node:path'

/** Suffixes a source file may have (D-46), plus the files every package needs. */
const allowed = [
  /\.component\.tsx$/,
  /\.hook\.ts$/,
  /\.function\.ts$/,
  /\.type\.ts$/,
  /\.constant\.ts$/,
  /\.manifest\.ts$/, // part manifests (D-95)
  /\.test\.tsx?$/,
  /\.test-d\.ts$/,
  /\.stories\.tsx$/,
  /^index\.tsx?$/,
]

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Source files use one of the D-46 suffixes (docs/standards/code.md).',
    },
    schema: [],
    messages: {
      suffix:
        '"{{name}}" needs a D-46 suffix: .component.tsx, .hook.ts, .function.ts, .type.ts or .constant.ts (docs/standards/code.md).',
    },
  },
  create(context) {
    const name = basename(context.filename)
    return {
      Program(node) {
        if (!allowed.some((pattern) => pattern.test(name))) {
          context.report({ node, messageId: 'suffix', data: { name } })
        }
      },
    }
  },
}

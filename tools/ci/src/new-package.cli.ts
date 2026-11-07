// `node tools/ci/src/new-package.cli.ts --name recurrence --layer module --depends-on core
//   --purpose "Full RFC 5545 RRULE expansion."`: the new-package skill's scaffold step.
// Afterwards: `pnpm install`, `pnpm exec nx sync`, then fill in the TODOs in its AGENTS.md.
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { writePackage, type Layer } from './new-package.ts'

const { values } = parseArgs({
  options: {
    name: { type: 'string' },
    layer: { type: 'string' },
    purpose: { type: 'string' },
    'depends-on': { type: 'string', multiple: true, default: [] },
  },
})
if (!values.name || !values.layer || !values.purpose) {
  console.error(
    'Usage: new-package.cli.ts --name <name> --layer <layer> --purpose "<one line>" [--depends-on <name>]…',
  )
  process.exit(1)
}
const created = writePackage({
  root: fileURLToPath(new URL('../../..', import.meta.url)),
  name: values.name,
  layer: values.layer as Layer,
  purpose: values.purpose,
  dependsOn: values['depends-on'],
})
console.log(created.join('\n'))
console.log(
  '\nNext: pnpm install && pnpm exec nx sync, then fill in the TODOs in its AGENTS.md.',
)

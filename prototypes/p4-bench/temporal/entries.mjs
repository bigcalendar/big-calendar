// Build one page bundle per implementation: native, temporal-polyfill/full, @js-temporal/polyfill.
import { build } from 'esbuild'
const impls = {
  native: `export const T = globalThis.Temporal`,
  tp: `export { Temporal as T } from 'temporal-polyfill/full/implementation'`,
  js: `export { Temporal as T } from '@js-temporal/polyfill'`,
}
for (const [name, src] of Object.entries(impls)) {
  await build({
    stdin: { contents: `${src}\nexport * from './corpus.js'`, resolveDir: import.meta.dirname },
    bundle: true, minify: false, format: 'esm', outfile: `${import.meta.dirname}/dist/${name}.js`, target: 'es2022',
  })
}

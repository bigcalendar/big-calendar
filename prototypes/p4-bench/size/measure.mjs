// Bundle each candidate import as the product would use it; report min, gzip, brotli.
import { build } from 'esbuild'
import { gzipSync, brotliCompressSync, constants } from 'node:zlib'

const entries = {
  'temporal-polyfill/full (all calendars)': `import { Temporal } from 'temporal-polyfill/full/implementation'; globalThis.Temporal = Temporal`,
  'temporal-polyfill (ISO and Gregorian only)': `import { Temporal } from 'temporal-polyfill/implementation'; globalThis.Temporal = Temporal`,
  '@js-temporal/polyfill': `import { Temporal } from '@js-temporal/polyfill'; globalThis.Temporal = Temporal`,
  'alien-signals': `import { signal, computed, effect, effectScope, startBatch, endBatch } from 'alien-signals'; globalThis.x = { signal, computed, effect, effectScope, startBatch, endBatch }`,
  '@preact/signals-core': `import { signal, computed, effect, batch, untracked } from '@preact/signals-core'; globalThis.x = { signal, computed, effect, batch, untracked }`,
  '@atlaskit/pragmatic-drag-and-drop (element adapter)': `import { draggable, dropTargetForElements, monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'; import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'; import { disableNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview'; globalThis.x = { draggable, dropTargetForElements, monitorForElements, combine, disableNativeDragPreview }`,
  '@atlaskit/pragmatic-drag-and-drop-auto-scroll': `import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'; globalThis.x = autoScrollForElements`,
}
const kb = (n) => (n / 1024).toFixed(1)
const rows = []
for (const [name, contents] of Object.entries(entries)) {
  const r = await build({ stdin: { contents, resolveDir: process.cwd() }, bundle: true, minify: true, format: 'esm', write: false, target: 'es2022', define: { 'process.env.NODE_ENV': '"production"' } })
  const code = r.outputFiles[0].contents
  rows.push({ name, min: kb(code.length), gzip: kb(gzipSync(code, { level: 9 }).length), brotli: kb(brotliCompressSync(code, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length) })
}
console.table(rows)

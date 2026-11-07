// Rollup builds the app; the bundle then runs in Node. Bare imports resolve through Node's own
// resolution (the browser condition isn't needed yet), so no resolve plugin is required.
import { rollup } from 'rollup'
import { runBundle } from './run-bundle.mjs'

const bundle = await rollup({
  input: 'src/main.js',
  plugins: [
    {
      name: 'node-resolve',
      resolveId: (id) =>
        id.startsWith('@big-calendar/')
          ? import.meta.resolve(id).replace('file://', '')
          : null,
    },
  ],
})
await bundle.write({ file: 'dist/main.js', format: 'es' })
runBundle('dist/main.js')

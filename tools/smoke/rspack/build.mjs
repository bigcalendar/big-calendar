// Rspack builds the app for the browser; the bundle then runs in Node.
import { rspack } from '@rspack/core'
import { join } from 'node:path'
import { runBundle } from './run-bundle.mjs'

const stats = await new Promise((resolve, reject) => {
  rspack({
    mode: 'production',
    target: 'web',
    context: import.meta.dirname,
    entry: './src/main.js',
    output: { path: join(import.meta.dirname, 'dist'), filename: 'main.js' },
  }).run((error, result) => (error ? reject(error) : resolve(result)))
})
if (stats.hasErrors()) throw new Error(stats.toString('errors-only'))
runBundle('dist/main.js')

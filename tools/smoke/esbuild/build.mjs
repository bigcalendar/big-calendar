// esbuild builds the app for the browser; the bundle then runs in Node.
import { build } from 'esbuild'
import { runBundle } from './run-bundle.mjs'

await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  outfile: 'dist/main.js',
  logLevel: 'silent',
})
runBundle('dist/main.js')

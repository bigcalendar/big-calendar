// Vite (Rolldown) builds the app; the bundle then runs in Node.
import { build } from 'vite'
import { runBundle } from './run-bundle.mjs'

await build({
  root: import.meta.dirname,
  logLevel: 'silent',
  build: {
    outDir: 'dist',
    lib: { entry: 'src/main.js', formats: ['es'], fileName: 'main' },
  },
})
runBundle('dist/main.js')

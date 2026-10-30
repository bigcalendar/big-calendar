import { build } from 'esbuild'
import { gzipSync } from 'node:zlib'
for (const name of ['pointer', 'native', 'pragmatic']) {
  const r = await build({ entryPoints: [`${import.meta.dirname}/engines/${name}.js`], bundle: true, minify: true, format: 'esm', outfile: `${import.meta.dirname}/dist/${name}.js`, target: 'es2022', metafile: true })
  const own = await build({ entryPoints: [`${import.meta.dirname}/engines/${name}.js`], bundle: true, minify: true, format: 'esm', write: false, external: ['../shared.js'], target: 'es2022' })
  const all = (await import('node:fs')).readFileSync(`${import.meta.dirname}/dist/${name}.js`)
  console.log(name.padEnd(10), 'engine-only gzip', (gzipSync(own.outputFiles[0].contents).length / 1024).toFixed(1), 'KB; page bundle gzip', (gzipSync(all).length / 1024).toFixed(1), 'KB')
}

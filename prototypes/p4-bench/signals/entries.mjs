import { build } from 'esbuild'
for (const name of ['alien', 'preact'])
  await build({
    stdin: {
      contents: `export * as F from './facade-${name}.js'\nexport * from './workload.js'`,
      resolveDir: import.meta.dirname,
    },
    bundle: true,
    minify: true,
    format: 'esm',
    outfile: `${import.meta.dirname}/dist/${name}.js`,
    target: 'es2022',
  })

import { coverage, libraryConfig } from '../../vite.library.ts'

export default libraryConfig({
  root: import.meta.dirname,
  entries: { '.': 'src/index.ts' },
  reactCompiler: true,
  testEnvironment: 'browser',
  thresholds: coverage.react,
})

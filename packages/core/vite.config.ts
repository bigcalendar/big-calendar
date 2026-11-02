import { libraryConfig } from '../../vite.library.ts'

export default libraryConfig({
  root: import.meta.dirname,
  entries: { '.': 'src/index.ts' },
})

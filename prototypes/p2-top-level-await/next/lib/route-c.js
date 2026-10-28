import { source } from './loader.js'
export const c = {
  seen: typeof globalThis.Temporal?.Now?.instant === 'function',
  source,
}

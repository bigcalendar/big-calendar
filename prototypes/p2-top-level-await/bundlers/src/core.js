import { source } from './loader.js'
// Evaluated after the loader, so Temporal must already exist (D-32).
export const coreSeen = typeof globalThis.Temporal?.Now?.instant === 'function'
export const coreSource = source

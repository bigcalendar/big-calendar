import { source } from './loader.js'
import { coreSeen } from './core.js'
export const interactionsSeen =
  typeof globalThis.Temporal?.Now?.instant === 'function' && coreSeen === true
export const interactionsSource = source

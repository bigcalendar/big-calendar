// Scenario 1: one static graph; two packages both import the loader.
import { run } from './report.js'
import { coreSeen, coreSource } from './core.js'
import { interactionsSeen } from './interactions.js'
run('static', () => ({
  ok: coreSeen === true && interactionsSeen === true && Boolean(coreSource),
  source: coreSource,
}))

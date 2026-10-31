// Machine contract misuse that must NOT compile.
import { defineMachine } from '../src/interactions/index.ts'

type S = { mode: 'idle' } | { mode: 'busy'; id: string }
type E = { type: 'GO'; id: string } | { type: 'STOP' }

defineMachine<S, E, {}>({
  id: 'x',
  initial: { mode: 'idle' },
  table: {
    idle: {
      // expect: Property 'id' is missing
      GO: () => ({ state: { mode: 'busy' }, effects: [] }),
    },
    busy: {
      // expect: Type '{ type: "redraw"; }' is not assignable to type 'Effect'
      STOP: () => ({ state: { mode: 'idle' }, effects: [{ type: 'redraw' }] }),
    },
  },
})

defineMachine<S, E, {}>({
  id: 'y',
  initial: { mode: 'idle' },
  table: {
    // expect: 'sleeping' does not exist
    sleeping: {},
  },
})

// How a delayed transition (long-press) surfaces through XState's pure transition().
import { setup, initialTransition, transition } from 'xstate'
const m = setup({}).createMachine({
  initial: 'idle',
  states: {
    idle: { on: { DOWN: 'pressing' } },
    pressing: { after: { 500: 'pressed' }, on: { UP: 'idle' } },
    pressed: {},
  },
})
let [s] = initialTransition(m)
let acts
;[s, acts] = transition(m, s, { type: 'DOWN' })
console.log(
  'after DOWN:',
  s.value,
  acts.map((a) => ({ type: a.type, params: a.params })),
)
;[s, acts] = transition(m, s, { type: 'UP' })
console.log(
  'after UP:',
  s.value,
  acts.map((a) => ({ type: a.type, params: a.params })),
)

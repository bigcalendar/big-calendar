// Both O-6 candidates must behave identically: same states, same effects, in
// the same order, for the same events. No DOM needed: the machines are pure.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as hand from '../js/machines/move-fsm.js'
import * as xs from '../js/machines/move-xstate.js'
import { messages } from '../js/messages.js'

const slots = Array.from({ length: 48 }, (_, i) => i)
const ctx = {
  messages,
  title: (id) => `Event ${id}`,
  slotsOf: () => slots,
  validate: ({ date }) => (date.endsWith('31') ? 'on a weekend' : null),
  positionOf: () => ({ surface: 'time', date: '2026-10-28', slot: 18 }),
  describe: (id, d, invalid) =>
    `${id} ${d.surface} ${d.date} ${d.slot ?? ''}${invalid ? ' ' + invalid : ''}`,
}
const key = (k, shift = false) => ({
  type: 'KEY',
  key: { key: k, shift, ctrl: false },
})
const script = [
  { type: 'KEY', key: { key: 'ArrowDown' } }, // ignored while idle
  { type: 'START', id: 'standup' },
  key('ArrowDown'),
  key('ArrowDown', true),
  key('ArrowRight'),
  key('ArrowRight'),
  key('ArrowRight'), // Saturday the 31st: invalid
  { type: 'DROP' }, // refused
  key('Escape'), // not a move key: no change
  key('ArrowLeft'),
  {
    type: 'POINTER_DROP',
    target: { surface: 'time', date: '2026-10-31', slot: 20 },
  }, // refused, draft follows the pointer
  {
    type: 'POINTER_DROP',
    target: { surface: 'time', date: '2026-10-29', slot: 20 },
  }, // accepted
  { type: 'START', id: 'retro' },
  key('ArrowUp'),
  { type: 'CANCEL' },
]

function run(machine) {
  let state = machine.initialMove
  return script.map((event) => {
    const r = machine.transition(state, event, ctx)
    state = r.state
    const { snapshot, ...visible } = r.state
    return { event: event.type, state: visible, effects: r.effects }
  })
}

test('the hand-written machine and the XState machine behave identically', () => {
  assert.deepEqual(run(xs), run(hand))
})

test('the script covers move, refusal, pointer drop and cancel', () => {
  const effects = run(hand).flatMap((r) => r.effects.map((e) => e.type))
  for (const t of ['announce', 'render', 'commit', 'focus'])
    assert.ok(effects.includes(t), t)
  assert.equal(run(hand).at(-1).state.mode, 'idle')
})

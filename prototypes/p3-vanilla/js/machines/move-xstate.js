// O-6 candidate (b): the same move machine in XState v5, run through XState's
// pure transition() so the same tiny effects runtime performs the effects.
// It exposes the same interface as move-fsm.js: initialMove and
// transition(state, event, ctx) → { state, effects }.
import {
  setup,
  assign,
  initialTransition,
  transition as xTransition,
} from 'xstate'
import { step } from './move-fsm.js'

const dropTarget = ({ context, event }) =>
  event.type === 'POINTER_DROP' ? event.target : context.draft

const machine = setup({
  actions: {
    // Effects are performed by the caller; these are placeholders.
    announce: () => {},
    render: () => {},
    commit: () => {},
    focus: () => {},
  },
  guards: {
    validDrop: (args) => !args.event.ctx.validate(dropTarget(args)),
    keyMoves: ({ context, event }) =>
      step(context.draft, event.key, event.ctx) !== null,
  },
}).createMachine({
  id: 'move',
  context: { id: null, origin: null, draft: null },
  initial: 'idle',
  states: {
    idle: {
      on: {
        START: {
          target: 'moving',
          actions: [
            assign(({ event }) => {
              const origin = event.ctx.positionOf(event.id)
              return { id: event.id, origin, draft: origin }
            }),
            {
              type: 'announce',
              params: ({ context, event }) => ({
                text: event.ctx.messages.moving(event.ctx.title(context.id)),
              }),
            },
            'render',
          ],
        },
      },
    },
    moving: {
      on: {
        CANCEL: {
          target: 'idle',
          actions: [
            {
              type: 'announce',
              params: ({ context, event }) => ({
                text: event.ctx.messages.moveCancelled(
                  event.ctx.title(context.id),
                ),
              }),
            },
            'render',
            { type: 'focus', params: ({ context }) => ({ id: context.id }) },
          ],
        },
        DROP: [
          { guard: 'validDrop', target: 'idle', actions: dropActions() },
          { actions: refusedActions() },
        ],
        POINTER_DROP: [
          { guard: 'validDrop', target: 'idle', actions: dropActions() },
          {
            actions: [
              assign({ draft: ({ event }) => event.target }),
              ...refusedActions(),
            ],
          },
        ],
        KEY: {
          guard: 'keyMoves',
          actions: [
            assign({
              draft: ({ context, event }) =>
                step(context.draft, event.key, event.ctx),
            }),
            'render',
            {
              type: 'announce',
              params: ({ context, event }) => ({
                text: event.ctx.describe(
                  context.id,
                  context.draft,
                  event.ctx.validate(context.draft),
                ),
              }),
            },
          ],
        },
      },
    },
  },
})

function dropActions() {
  return [
    {
      type: 'commit',
      params: (args) => ({
        id: args.context.id,
        from: args.context.origin,
        to: dropTarget(args),
      }),
    },
    'render',
    { type: 'focus', params: ({ context }) => ({ id: context.id }) },
    {
      type: 'announce',
      params: (args) => ({
        text: args.event.ctx.messages.dropped(
          args.event.ctx.describe(args.context.id, dropTarget(args)),
        ),
      }),
    },
  ]
}
function refusedActions() {
  return [
    {
      type: 'announce',
      params: (args) => ({
        text: args.event.ctx.describe(
          args.context.id,
          dropTarget(args),
          args.event.ctx.validate(dropTarget(args)),
        ),
      }),
    },
    'render',
  ]
}

/** The app reads `mode`, `id` and `draft`; keep the snapshot alongside. */
function view(snapshot) {
  const { id, origin, draft } = snapshot.context
  return snapshot.value === 'moving'
    ? { mode: 'moving', id, origin, draft, snapshot }
    : { mode: 'idle', snapshot }
}

export const initialMove = view(initialTransition(machine)[0])

export function transition(state, event, ctx) {
  const [next, actions] = xTransition(machine, state.snapshot, {
    ...event,
    ctx,
  })
  return {
    state: view(next),
    effects: actions.map((a) => ({ type: a.type, ...a.params })),
  }
}

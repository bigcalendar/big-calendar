// The P3 move machine (accessibility spec 6.4) in the table form, plus a feature extending it.
import type { Draft, InternalDragDraft } from '../core/index.ts'
import {
  defineMachine,
  extendMachine,
  mergeProps,
  transition,
  type Coordinates,
  type PropDescriptor,
} from '../interactions/index.ts'

type MoveState =
  | { mode: 'idle' }
  | {
      mode: 'moving'
      key: string
      origin: InternalDragDraft
      draft: InternalDragDraft
    }
type MoveEvent =
  | { type: 'START'; key: string }
  | {
      type: 'STEP'
      key:
        | 'ArrowUp'
        | 'ArrowDown'
        | 'ArrowLeft'
        | 'ArrowRight'
        | 'PageUp'
        | 'PageDown'
      shift: boolean
    }
  | { type: 'POINTER_TARGET'; at: Coordinates }
  | { type: 'DROP' }
  | { type: 'CANCEL' }
interface MoveContext {
  draftFor(key: string): InternalDragDraft
  step(
    draft: InternalDragDraft,
    key: string,
    shift: boolean,
  ): InternalDragDraft | null
  at(draft: InternalDragDraft, at: Coordinates): InternalDragDraft
  messages: {
    moving(title: string): string
    cancelled(title: string): string
    dropped(where: string): string
  }
  describe(draft: Draft): string
}

const idle = { mode: 'idle' } as const

const move = defineMachine<MoveState, MoveEvent, MoveContext>({
  id: 'move',
  initial: idle,
  table: {
    idle: {
      START: (_state, event, ctx) => {
        const draft = ctx.draftFor(event.key)
        return {
          state: { mode: 'moving', key: event.key, origin: draft, draft },
          effects: [
            { type: 'draft', draft },
            {
              type: 'announce',
              politeness: 'polite',
              message: ctx.messages.moving(draft.event.event.title),
            },
          ],
        }
      },
    },
    moving: {
      STEP: (state, event, ctx) => {
        const draft = ctx.step(state.draft, event.key, event.shift)
        if (!draft) return { state, effects: [] }
        return {
          state: { ...state, draft },
          effects: [
            { type: 'draft', draft },
            {
              type: 'announce',
              politeness: 'polite',
              message: ctx.describe(draft),
            },
          ],
        }
      },
      POINTER_TARGET: (state, event, ctx) => {
        const draft = ctx.at(state.draft, event.at)
        return {
          state: { ...state, draft },
          effects: [{ type: 'draft', draft }],
        }
      },
      DROP: (state, _event, ctx) =>
        state.draft.violations.length
          ? {
              state,
              effects: [
                {
                  type: 'announce',
                  politeness: 'polite',
                  message: ctx.describe(state.draft),
                },
              ],
            }
          : {
              state: idle,
              effects: [
                { type: 'commit', draft: state.draft },
                { type: 'draft', draft: null },
                { type: 'focus', target: { kind: 'event', key: state.key } },
                {
                  type: 'announce',
                  politeness: 'polite',
                  message: ctx.messages.dropped(ctx.describe(state.draft)),
                },
              ],
            },
      CANCEL: (state, _event, ctx) => ({
        state: idle,
        effects: [
          { type: 'draft', draft: null },
          { type: 'focus', target: { kind: 'event', key: state.key } },
          {
            type: 'announce',
            politeness: 'polite',
            message: ctx.messages.cancelled(state.origin.event.event.title),
          },
        ],
      }),
    },
  },
})

// A feature adds touch long-press: a new mode and new events, with a timer effect.
type PressState = { mode: 'pressing'; key: string }
type PressEvent =
  | { type: 'PRESS'; key: string }
  | { type: 'LONG_PRESS'; key: string }
  | { type: 'RELEASE' }
const withTouch = extendMachine<
  MoveState,
  MoveEvent,
  MoveContext,
  PressState,
  PressEvent
>(move, {
  idle: {
    PRESS: (_state, event) => ({
      state: { mode: 'pressing', key: event.key },
      effects: [
        {
          type: 'timerStart',
          id: 'long-press',
          ms: 400,
          event: { type: 'LONG_PRESS', key: event.key },
        },
      ],
    }),
  },
  pressing: {
    LONG_PRESS: (state, _event, ctx) =>
      transition(move, idle, { type: 'START', key: state.key }, ctx),
    RELEASE: () => ({
      state: idle,
      effects: [{ type: 'timerCancel', id: 'long-press' }],
    }),
  },
})
void withTouch

// Merging descriptors: base first, then features in registration order.
declare const base: PropDescriptor
declare const dndPart: PropDescriptor
const merged: PropDescriptor = mergeProps(base, dndPart)
merged.on.keydown?.(new KeyboardEvent('keydown'))

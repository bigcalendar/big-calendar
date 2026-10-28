// O-6 candidate (a): the move machine as a hand-written finite-state machine.
// transition(state, event, ctx) is pure and returns { state, effects }. A tiny
// runtime (in app.js) performs the effects: announce, render, commit, focus.
//
// States: idle → moving → idle. Draft positions are coordinates, never pixels:
//   { surface: 'month' | 'allday' | 'time', date, slot? }
import { addDays } from '../dates.js'

export const initialMove = { mode: 'idle' }

export function transition(state, event, ctx) {
  switch (state.mode) {
    case 'idle':
      if (event.type === 'START') {
        const origin = ctx.positionOf(event.id)
        const next = { mode: 'moving', id: event.id, origin, draft: origin }
        return {
          state: next,
          effects: [
            {
              type: 'announce',
              text: ctx.messages.moving(ctx.title(event.id)),
            },
            { type: 'render' },
          ],
        }
      }
      return { state, effects: [] }

    case 'moving': {
      if (event.type === 'CANCEL') {
        return {
          state: initialMove,
          effects: [
            {
              type: 'announce',
              text: ctx.messages.moveCancelled(ctx.title(state.id)),
            },
            { type: 'render' },
            { type: 'focus', id: state.id },
          ],
        }
      }
      if (event.type === 'DROP' || event.type === 'POINTER_DROP') {
        const draft = event.type === 'POINTER_DROP' ? event.target : state.draft
        const invalid = ctx.validate(draft)
        if (invalid) {
          return {
            state: { ...state, draft },
            effects: [
              {
                type: 'announce',
                text: ctx.describe(state.id, draft, invalid),
              },
              { type: 'render' },
            ],
          }
        }
        return {
          state: initialMove,
          effects: [
            { type: 'commit', id: state.id, from: state.origin, to: draft },
            { type: 'render' },
            { type: 'focus', id: state.id },
            {
              type: 'announce',
              text: ctx.messages.dropped(ctx.describe(state.id, draft)),
            },
          ],
        }
      }
      if (event.type === 'KEY') {
        const draft = step(state.draft, event.key, ctx)
        if (!draft) return { state, effects: [] }
        return {
          state: { ...state, draft },
          effects: [
            { type: 'render' },
            {
              type: 'announce',
              text: ctx.describe(state.id, draft, ctx.validate(draft)),
            },
          ],
        }
      }
      return { state, effects: [] }
    }
  }
  return { state, effects: [] }
}

/** One keyboard step of the draft (spec 6.4, step 2). Returns null if the key does nothing. */
function step(draft, k, ctx) {
  const { surface, date, slot } = draft
  const day = (n) => ({ ...draft, date: addDays(date, n) })
  if (surface === 'month') {
    switch (k.key) {
      case 'ArrowLeft':
        return day(-1)
      case 'ArrowRight':
        return day(1)
      case 'ArrowUp':
        return day(-7)
      case 'ArrowDown':
        return day(7)
      case 'PageUp':
        return day(-28)
      case 'PageDown':
        return day(28)
    }
    return null
  }
  if (surface === 'allday') {
    switch (k.key) {
      case 'ArrowLeft':
        return day(-1)
      case 'ArrowRight':
        return day(1)
      case 'PageUp':
        return day(-7)
      case 'PageDown':
        return day(7)
      // Hop into the time body: an all-day event becomes timed (T-12).
      case 'ArrowDown':
        return { surface: 'time', date, slot: ctx.slotsOf(date)[0] }
    }
    return null
  }
  const slots = ctx.slotsOf(date)
  const i = slots.indexOf(slot)
  const by = (n) => {
    const j = i + n
    if (j < 0)
      return n === -1
        ? { surface: 'allday', date }
        : { ...draft, slot: slots[0] }
    return { ...draft, slot: slots[Math.min(j, slots.length - 1)] }
  }
  switch (k.key) {
    case 'ArrowUp':
      return by(k.shift ? -2 : -1)
    case 'ArrowDown':
      return by(k.shift ? 2 : 1)
    case 'ArrowLeft':
      return day(-1)
    case 'ArrowRight':
      return day(1)
    case 'PageUp':
      return day(-7)
    case 'PageDown':
      return day(7)
  }
  return null
}

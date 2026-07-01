import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import { defineComponent, h } from 'vue'
import type { Component } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import CalendarProvider from '../CalendarProvider/CalendarProvider.vue'
import { LOCALIZER_CASES } from '../testing/localizers'
import { useSlotSelection } from './useSlotSelection'

function makeWrapper(
  localizer: LocalizerContract,
  child: ReturnType<typeof defineComponent>,
) {
  return mount(
    defineComponent({
      setup() {
        return () =>
          h(CalendarProvider as Component, { localizer, defaultView: Views.MONTH, selectable: true }, {
            default: () => h(child),
          })
      },
    }),
  )
}

describe.each(LOCALIZER_CASES)('useSlotSelection [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a function', () => {
    let handler: ((e: PointerEvent) => void) | undefined

    const Probe = defineComponent({
      setup() {
        handler = useSlotSelection('day')
        return () => null
      },
    })

    makeWrapper(localizer, Probe)
    expect(typeof handler).toBe('function')
  })

  it('ignores non-primary button events', () => {
    let handler: ((e: PointerEvent) => void) | undefined

    const Probe = defineComponent({
      setup() {
        handler = useSlotSelection('day')
        return () => null
      },
    })

    makeWrapper(localizer, Probe)

    const addSpy = vi.spyOn(window, 'addEventListener')
    const event = new PointerEvent('pointerdown', { button: 2, bubbles: true })
    handler!(event)
    expect(addSpy).not.toHaveBeenCalled()
  })

  it('ignores events over [data-bc-event] elements', () => {
    let handler: ((e: PointerEvent) => void) | undefined

    const Probe = defineComponent({
      setup() {
        handler = useSlotSelection('day')
        return () => null
      },
    })

    makeWrapper(localizer, Probe)

    const eventEl = document.createElement('div')
    eventEl.setAttribute('data-bc-event', 'evt-1')
    document.body.appendChild(eventEl)

    const addSpy = vi.spyOn(window, 'addEventListener')
    const pe = new PointerEvent('pointerdown', { button: 0, bubbles: true })
    Object.defineProperty(pe, 'target', { value: eventEl })
    handler!(pe)
    expect(addSpy).not.toHaveBeenCalled()

    document.body.removeChild(eventEl)
  })

  it('ignores events with no [data-slot-index] ancestor', () => {
    let handler: ((e: PointerEvent) => void) | undefined

    const Probe = defineComponent({
      setup() {
        handler = useSlotSelection('day')
        return () => null
      },
    })

    makeWrapper(localizer, Probe)

    const addSpy = vi.spyOn(window, 'addEventListener')
    const div = document.createElement('div')
    const pe = new PointerEvent('pointerdown', { button: 0, bubbles: true })
    Object.defineProperty(pe, 'target', { value: div })
    handler!(pe)
    expect(addSpy).not.toHaveBeenCalled()
  })

  it('attaches pointermove/pointerup/pointercancel listeners on valid press', () => {
    let handler: ((e: PointerEvent) => void) | undefined

    const Probe = defineComponent({
      setup() {
        handler = useSlotSelection('day')
        return () => null
      },
    })

    makeWrapper(localizer, Probe)

    const cell = document.createElement('div')
    cell.setAttribute('data-slot-index', '2')
    cell.setAttribute('data-date', '2024-01-01')
    document.body.appendChild(cell)

    const addSpy = vi.spyOn(window, 'addEventListener')
    const pe = new PointerEvent('pointerdown', {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerType: 'mouse',
    })
    Object.defineProperty(pe, 'target', { value: cell })
    Object.defineProperty(pe, 'currentTarget', { value: document.body })

    handler!(pe)

    const calls = addSpy.mock.calls.map((c) => c[0])
    expect(calls).toContain('pointermove')
    expect(calls).toContain('pointerup')
    expect(calls).toContain('pointercancel')

    // cleanup: fire pointercancel
    window.dispatchEvent(new PointerEvent('pointercancel'))
    document.body.removeChild(cell)
  })

  it('does nothing when selectable is false', () => {
    let handler: ((e: PointerEvent) => void) | undefined

    const NotSelectable = defineComponent({
      setup() {
        return () =>
          h(
            CalendarProvider as Component,
            { localizer, defaultView: Views.MONTH, selectable: false },
            {
              default: () =>
                h(
                  defineComponent({
                    setup() {
                      handler = useSlotSelection('day')
                      return () => null
                    },
                  }),
                ),
            },
          )
      },
    })

    mount(NotSelectable)

    const addSpy = vi.spyOn(window, 'addEventListener')
    const cell = document.createElement('div')
    cell.setAttribute('data-slot-index', '0')
    cell.setAttribute('data-date', '2024-01-01')
    const pe = new PointerEvent('pointerdown', { button: 0 })
    Object.defineProperty(pe, 'target', { value: cell })

    handler!(pe)
    expect(addSpy).not.toHaveBeenCalled()
  })
})

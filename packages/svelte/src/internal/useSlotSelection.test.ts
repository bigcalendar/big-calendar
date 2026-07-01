import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import { render } from '@testing-library/svelte'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { makeContext } from '../testing/makeContext'
import Probe from '../testing/Probe.svelte'
import { useSlotSelection } from './useSlotSelection.svelte'

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

    render(Probe, {
      props: { run: () => { handler = useSlotSelection('day') } },
      context: makeContext(localizer, Views.MONTH),
    })

    expect(typeof handler).toBe('function')
  })

  it('ignores non-primary button events', () => {
    let handler: ((e: PointerEvent) => void) | undefined

    render(Probe, {
      props: { run: () => { handler = useSlotSelection('day') } },
      context: makeContext(localizer, Views.MONTH),
    })

    const addSpy = vi.spyOn(window, 'addEventListener')
    handler!(new PointerEvent('pointerdown', { button: 2, bubbles: true }))
    expect(addSpy).not.toHaveBeenCalled()
  })

  it('ignores events over [data-bc-event] elements', () => {
    let handler: ((e: PointerEvent) => void) | undefined

    render(Probe, {
      props: { run: () => { handler = useSlotSelection('day') } },
      context: makeContext(localizer, Views.MONTH),
    })

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

    render(Probe, {
      props: { run: () => { handler = useSlotSelection('day') } },
      context: makeContext(localizer, Views.MONTH),
    })

    const addSpy = vi.spyOn(window, 'addEventListener')
    const div = document.createElement('div')
    const pe = new PointerEvent('pointerdown', { button: 0, bubbles: true })
    Object.defineProperty(pe, 'target', { value: div })
    handler!(pe)
    expect(addSpy).not.toHaveBeenCalled()
  })

  it('attaches pointermove/pointerup/pointercancel listeners on valid press', () => {
    let handler: ((e: PointerEvent) => void) | undefined

    render(Probe, {
      props: { run: () => { handler = useSlotSelection('day') } },
      context: makeContext(localizer, Views.MONTH),
    })

    const cell = document.createElement('div')
    cell.setAttribute('data-slot-index', '2')
    cell.setAttribute('data-date', '2024-01-01')
    document.body.appendChild(cell)

    const addSpy = vi.spyOn(window, 'addEventListener')
    const pe = new PointerEvent('pointerdown', {
      button: 0, clientX: 100, clientY: 100, pointerType: 'mouse',
    })
    Object.defineProperty(pe, 'target', { value: cell })
    Object.defineProperty(pe, 'currentTarget', { value: document.body })

    handler!(pe)

    const calls = addSpy.mock.calls.map((c) => c[0])
    expect(calls).toContain('pointermove')
    expect(calls).toContain('pointerup')
    expect(calls).toContain('pointercancel')

    window.dispatchEvent(new PointerEvent('pointercancel'))
    document.body.removeChild(cell)
  })

  it('does nothing when selectable is false in the store', () => {
    let handler: ((e: PointerEvent) => void) | undefined

    render(Probe, {
      props: { run: () => { handler = useSlotSelection('day') } },
      context: makeContext(localizer, Views.MONTH, { selectable: false }),
    })

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

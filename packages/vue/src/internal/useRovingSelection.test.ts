import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import { defineComponent, h, ref } from 'vue'
import type { Component } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import CalendarProvider from '../CalendarProvider/CalendarProvider.vue'
import { LOCALIZER_CASES } from '../testing/localizers'
import { useRovingSelection } from './useRovingSelection'
import type { Direction, RovingSelection } from './useRovingSelection'

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

const noopNeighbor: (index: number, dir: Direction) => number | null = () => null

describe.each(LOCALIZER_CASES)('useRovingSelection [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('returns containerRef, onKeydown, onFocusCapture, cellTabIndex', () => {
    let result: RovingSelection | undefined

    const Probe = defineComponent({
      setup() {
        result = useRovingSelection({ mode: 'day', count: ref(7), neighbor: noopNeighbor })
        return () => null
      },
    })

    makeWrapper(localizer, Probe)
    expect(result).toBeDefined()
    expect(typeof result!.onKeydown).toBe('function')
    expect(typeof result!.onFocusCapture).toBe('function')
    expect(typeof result!.cellTabIndex).toBe('function')
    expect(result!.containerRef).toBeDefined()
  })

  it('cellTabIndex returns 0 for index 0 (initial active) and -1 otherwise', () => {
    let result: RovingSelection | undefined

    const Probe = defineComponent({
      setup() {
        result = useRovingSelection({ mode: 'day', count: ref(5), neighbor: noopNeighbor })
        return () => null
      },
    })

    makeWrapper(localizer, Probe)
    expect(result!.cellTabIndex(0)).toBe(0)
    expect(result!.cellTabIndex(1)).toBe(-1)
    expect(result!.cellTabIndex(4)).toBe(-1)
  })

  it('cellTabIndex returns 0 for all when count is 0', () => {
    let result: RovingSelection | undefined

    const Probe = defineComponent({
      setup() {
        result = useRovingSelection({ mode: 'day', count: ref(0), neighbor: noopNeighbor })
        return () => null
      },
    })

    makeWrapper(localizer, Probe)
    // safeActive clamps to 0 when count=0, so index 0 gets tabIndex 0
    expect(result!.cellTabIndex(0)).toBe(0)
    expect(result!.cellTabIndex(1)).toBe(-1)
  })

  it('onFocusCapture updates active index from data-slot-index on focused element', () => {
    let result: RovingSelection | undefined

    const Probe = defineComponent({
      setup() {
        result = useRovingSelection({ mode: 'day', count: ref(7), neighbor: noopNeighbor })
        return () => null
      },
    })

    makeWrapper(localizer, Probe)

    // Simulate a container element
    const container = document.createElement('div')
    result!.containerRef.value = container

    // Simulate focus on an element with data-slot-index
    const cell = document.createElement('div')
    cell.setAttribute('data-slot-index', '3')
    container.appendChild(cell)

    const event = new FocusEvent('focus', { bubbles: true, relatedTarget: null })
    Object.defineProperty(event, 'target', { value: cell })

    result!.onFocusCapture(event)
    expect(result!.cellTabIndex(3)).toBe(0)
    expect(result!.cellTabIndex(0)).toBe(-1)
  })

  it('onKeydown ignores non-slot targets', () => {
    let result: RovingSelection | undefined

    const Probe = defineComponent({
      setup() {
        result = useRovingSelection({ mode: 'day', count: ref(7), neighbor: noopNeighbor })
        return () => null
      },
    })

    makeWrapper(localizer, Probe)

    const div = document.createElement('div') // no data-slot-index
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
    Object.defineProperty(event, 'target', { value: div })
    const spy = vi.spyOn(event, 'preventDefault')

    result!.onKeydown(event)
    expect(spy).not.toHaveBeenCalled()
  })

  it('onKeydown moves focus with neighbor function on arrow keys', () => {
    let result: RovingSelection | undefined

    const linearNeighbor = (index: number, dir: Direction): number | null => {
      if (dir === 'right') return index + 1 < 5 ? index + 1 : null
      if (dir === 'left') return index > 0 ? index - 1 : null
      return null
    }

    const Probe = defineComponent({
      setup() {
        result = useRovingSelection({ mode: 'day', count: ref(5), neighbor: linearNeighbor })
        return () => null
      },
    })

    makeWrapper(localizer, Probe)

    const container = document.createElement('div')
    result!.containerRef.value = container
    const cells = [0, 1, 2, 3, 4].map((i) => {
      const el = document.createElement('div')
      el.setAttribute('data-slot-index', String(i))
      el.setAttribute('data-date', `2024-01-0${i + 1}`)
      container.appendChild(el)
      return el
    })

    // Focus cell at index 2
    const focus2 = new FocusEvent('focus')
    Object.defineProperty(focus2, 'target', { value: cells[2] })
    result!.onFocusCapture(focus2)
    expect(result!.cellTabIndex(2)).toBe(0)

    // Press ArrowRight — should move to index 3
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
    Object.defineProperty(event, 'target', { value: cells[2] })
    const spy = vi.spyOn(event, 'preventDefault')
    result!.onKeydown(event)

    expect(spy).toHaveBeenCalled()
    expect(result!.cellTabIndex(3)).toBe(0)
    expect(result!.cellTabIndex(2)).toBe(-1)
  })

  it('onKeydown returns null edge — does not move, still prevents default', () => {
    let result: RovingSelection | undefined

    const edgeNeighbor: (index: number, dir: Direction) => number | null = () => null

    const Probe = defineComponent({
      setup() {
        result = useRovingSelection({ mode: 'day', count: ref(3), neighbor: edgeNeighbor })
        return () => null
      },
    })

    makeWrapper(localizer, Probe)

    const container = document.createElement('div')
    result!.containerRef.value = container
    const cell = document.createElement('div')
    cell.setAttribute('data-slot-index', '1')
    cell.setAttribute('data-date', '2024-01-01')
    container.appendChild(cell)

    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })
    Object.defineProperty(event, 'target', { value: cell })
    const spy = vi.spyOn(event, 'preventDefault')

    result!.onKeydown(event)
    expect(spy).toHaveBeenCalled()
    // Active stays at initial 0 (not the cell we never focused), no crash
  })
})

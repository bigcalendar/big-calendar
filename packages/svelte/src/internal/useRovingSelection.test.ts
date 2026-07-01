import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import { render } from '@testing-library/svelte'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { makeContext } from '../testing/makeContext'
import Probe from '../testing/Probe.svelte'
import type { Direction, RovingSelection } from './useRovingSelection.svelte'
import { useRovingSelection } from './useRovingSelection.svelte'

const noopNeighbor: (index: number, dir: Direction) => number | null = () => null

describe.each(LOCALIZER_CASES)('useRovingSelection [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  it('returns onKeydown, onFocusCapture, cellTabIndex', () => {
    let result: RovingSelection | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useRovingSelection({
            mode: 'day',
            getContainer: () => null,
            getCount: () => 7,
            neighbor: noopNeighbor,
          })
        },
      },
      context: makeContext(localizer, Views.MONTH),
    })

    expect(typeof result!.onKeydown).toBe('function')
    expect(typeof result!.onFocusCapture).toBe('function')
    expect(typeof result!.cellTabIndex).toBe('function')
  })

  it('cellTabIndex returns 0 for index 0 (initial active) and -1 otherwise', () => {
    let result: RovingSelection | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useRovingSelection({
            mode: 'day',
            getContainer: () => null,
            getCount: () => 5,
            neighbor: noopNeighbor,
          })
        },
      },
      context: makeContext(localizer, Views.MONTH),
    })

    expect(result!.cellTabIndex(0)).toBe(0)
    expect(result!.cellTabIndex(1)).toBe(-1)
    expect(result!.cellTabIndex(4)).toBe(-1)
  })

  it('cellTabIndex returns 0 for index 0 when count is 0', () => {
    let result: RovingSelection | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useRovingSelection({
            mode: 'day',
            getContainer: () => null,
            getCount: () => 0,
            neighbor: noopNeighbor,
          })
        },
      },
      context: makeContext(localizer, Views.MONTH),
    })

    expect(result!.cellTabIndex(0)).toBe(0)
    expect(result!.cellTabIndex(1)).toBe(-1)
  })

  it('onFocusCapture updates active index from data-slot-index on focused element', () => {
    let result: RovingSelection | undefined
    const container = document.createElement('div')

    render(Probe, {
      props: {
        run: () => {
          result = useRovingSelection({
            mode: 'day',
            getContainer: () => container,
            getCount: () => 7,
            neighbor: noopNeighbor,
          })
        },
      },
      context: makeContext(localizer, Views.MONTH),
    })

    const cell = document.createElement('div')
    cell.setAttribute('data-slot-index', '3')
    container.appendChild(cell)

    const event = new FocusEvent('focus', { bubbles: true })
    Object.defineProperty(event, 'target', { value: cell })

    result!.onFocusCapture(event)
    expect(result!.cellTabIndex(3)).toBe(0)
    expect(result!.cellTabIndex(0)).toBe(-1)
  })

  it('onKeydown ignores non-slot targets', () => {
    let result: RovingSelection | undefined

    render(Probe, {
      props: {
        run: () => {
          result = useRovingSelection({
            mode: 'day',
            getContainer: () => null,
            getCount: () => 7,
            neighbor: noopNeighbor,
          })
        },
      },
      context: makeContext(localizer, Views.MONTH),
    })

    const div = document.createElement('div')
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
    Object.defineProperty(event, 'target', { value: div })
    const spy = vi.spyOn(event, 'preventDefault')

    result!.onKeydown(event)
    expect(spy).not.toHaveBeenCalled()
  })

  it('onKeydown moves focus with neighbor function on arrow keys', () => {
    let result: RovingSelection | undefined
    const container = document.createElement('div')

    const linearNeighbor = (index: number, dir: Direction): number | null => {
      if (dir === 'right') return index + 1 < 5 ? index + 1 : null
      if (dir === 'left') return index > 0 ? index - 1 : null
      return null
    }

    render(Probe, {
      props: {
        run: () => {
          result = useRovingSelection({
            mode: 'day',
            getContainer: () => container,
            getCount: () => 5,
            neighbor: linearNeighbor,
          })
        },
      },
      context: makeContext(localizer, Views.MONTH),
    })

    const cells = [0, 1, 2, 3, 4].map((i) => {
      const el = document.createElement('div')
      el.setAttribute('data-slot-index', String(i))
      el.setAttribute('data-date', `2024-01-0${i + 1}`)
      container.appendChild(el)
      return el
    })

    const focus2 = new FocusEvent('focus')
    Object.defineProperty(focus2, 'target', { value: cells[2] })
    result!.onFocusCapture(focus2)
    expect(result!.cellTabIndex(2)).toBe(0)

    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
    Object.defineProperty(event, 'target', { value: cells[2] })
    const spy = vi.spyOn(event, 'preventDefault')
    result!.onKeydown(event)

    expect(spy).toHaveBeenCalled()
    expect(result!.cellTabIndex(3)).toBe(0)
    expect(result!.cellTabIndex(2)).toBe(-1)
  })
})

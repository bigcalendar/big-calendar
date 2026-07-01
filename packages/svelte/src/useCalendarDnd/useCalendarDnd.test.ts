import { Views } from '@big-calendar/core'
import type { LocalizerContract } from '@big-calendar/core'
import * as dndModule from '@big-calendar/dnd'
import { tick } from 'svelte'
import { render } from '@testing-library/svelte'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { LOCALIZER_CASES } from '../testing/localizers'
import { makeContext } from '../testing/makeContext'
import CalendarDndProbe from './CalendarDndProbe.test.svelte'

describe.each(LOCALIZER_CASES)('useCalendarDnd [$name]', ({ create }) => {
  let localizer: LocalizerContract

  beforeAll(async () => {
    localizer = await create()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not call bindCalendarDnd when container is null', () => {
    const bindSpy = vi.spyOn(dndModule, 'bindCalendarDnd').mockReturnValue(() => {})

    render(CalendarDndProbe, {
      props: { onSetContainer: () => {} },
      context: makeContext(localizer, Views.MONTH),
    })

    expect(bindSpy).not.toHaveBeenCalled()
  })

  it('calls bindCalendarDnd with mode=day for month view when container is set', async () => {
    const cleanupFn = vi.fn()
    const bindSpy = vi.spyOn(dndModule, 'bindCalendarDnd').mockReturnValue(cleanupFn)
    let setContainer!: (el: HTMLElement | null) => void

    render(CalendarDndProbe, {
      props: { onSetContainer: (fn) => { setContainer = fn } },
      context: makeContext(localizer, Views.MONTH),
    })

    setContainer(document.createElement('div'))
    await tick()

    expect(bindSpy).toHaveBeenCalledWith(expect.objectContaining({ mode: 'day' }))
  })

  it('calls bindCalendarDnd with mode=time for week view', async () => {
    const bindSpy = vi.spyOn(dndModule, 'bindCalendarDnd').mockReturnValue(() => {})
    let setContainer!: (el: HTMLElement | null) => void

    render(CalendarDndProbe, {
      props: { onSetContainer: (fn) => { setContainer = fn } },
      context: makeContext(localizer, Views.WEEK),
    })

    setContainer(document.createElement('div'))
    await tick()

    expect(bindSpy).toHaveBeenCalledWith(expect.objectContaining({ mode: 'time' }))
  })

  it('does not call bindCalendarDnd for agenda view (mode=null)', async () => {
    const bindSpy = vi.spyOn(dndModule, 'bindCalendarDnd').mockReturnValue(() => {})
    let setContainer!: (el: HTMLElement | null) => void

    render(CalendarDndProbe, {
      props: { onSetContainer: (fn) => { setContainer = fn } },
      context: makeContext(localizer, Views.AGENDA),
    })

    setContainer(document.createElement('div'))
    await tick()

    expect(bindSpy).not.toHaveBeenCalled()
  })

  it('runs cleanup on unmount when binding was active', async () => {
    const cleanupFn = vi.fn()
    vi.spyOn(dndModule, 'bindCalendarDnd').mockReturnValue(cleanupFn)
    let setContainer!: (el: HTMLElement | null) => void

    const { unmount } = render(CalendarDndProbe, {
      props: { onSetContainer: (fn) => { setContainer = fn } },
      context: makeContext(localizer, Views.MONTH),
    })

    setContainer(document.createElement('div'))
    await tick()

    await unmount()
    expect(cleanupFn).toHaveBeenCalled()
  })
})

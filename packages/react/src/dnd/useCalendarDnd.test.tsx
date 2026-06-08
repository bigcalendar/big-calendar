import { Views } from '@big-calendar/core'
import type { ViewKey } from '@big-calendar/core'
import { render } from '@testing-library/react'
import { useRef } from 'react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { CalendarProvider } from '../CalendarProvider'
import { LOCALIZER_CASES } from '../testing/localizers'
import { useCalendarDnd } from './useCalendarDnd'

// Mock the optional controller so the hook's wiring is asserted deterministically
// (the real one drives native drag events jsdom can't dispatch).
const { bindSpy, cleanupSpy } = vi.hoisted(() => {
  const cleanupSpy = vi.fn()
  const bindSpy = vi.fn<(opts: { root: HTMLElement; mode: string }) => () => void>(() => cleanupSpy)
  return { bindSpy, cleanupSpy }
})
vi.mock('@big-calendar/dnd', () => ({ bindCalendarDnd: bindSpy }))

interface Event {
  id: number
  title: string
  start: string
  end: string
}

const focus = '2026-06-15'

function Harness({ attach = true }: { attach?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useCalendarDnd(ref)
  return <div ref={attach ? ref : undefined} className="bc-calendar" data-testid="root" />
}

describe.each(LOCALIZER_CASES)('useCalendarDnd [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    localizer = await create()
  })
  beforeEach(() => {
    bindSpy.mockClear()
    cleanupSpy.mockClear()
  })

  function renderHook(props: { view?: ViewKey; attach?: boolean } = {}) {
    const { view = Views.MONTH, attach = true } = props
    return render(
      <CalendarProvider<Event> localizer={localizer} defaultDate={focus} view={view}>
        <Harness attach={attach} />
      </CalendarProvider>,
    )
  }

  it('binds the controller in day mode for the month view', () => {
    const { getByTestId } = renderHook({ view: Views.MONTH })
    expect(bindSpy).toHaveBeenCalledTimes(1)
    expect(bindSpy.mock.calls[0]![0]).toMatchObject({ root: getByTestId('root'), mode: 'day' })
  })

  it('binds the controller in time mode for the time-grid views', () => {
    const { getByTestId } = renderHook({ view: Views.WEEK })
    expect(bindSpy).toHaveBeenCalledTimes(1)
    expect(bindSpy.mock.calls[0]![0]).toMatchObject({ root: getByTestId('root'), mode: 'time' })
  })

  it('does not bind for a view without move support (agenda)', () => {
    renderHook({ view: Views.AGENDA })
    expect(bindSpy).not.toHaveBeenCalled()
  })

  it('does not bind when the container ref is unattached', () => {
    renderHook({ view: Views.MONTH, attach: false })
    expect(bindSpy).not.toHaveBeenCalled()
  })

  it('rebinds with the new mode when the view changes move mode', () => {
    const { rerender } = renderHook({ view: Views.MONTH })
    expect(bindSpy).toHaveBeenCalledTimes(1)
    rerender(
      <CalendarProvider<Event> localizer={localizer} defaultDate={focus} view={Views.WEEK}>
        <Harness />
      </CalendarProvider>,
    )
    expect(cleanupSpy).toHaveBeenCalledTimes(1)
    expect(bindSpy).toHaveBeenCalledTimes(2)
    expect(bindSpy.mock.calls[1]![0]).toMatchObject({ mode: 'time' })
  })

  it('releases the binding and does not rebind when the view loses support', () => {
    const { rerender } = renderHook({ view: Views.MONTH })
    expect(bindSpy).toHaveBeenCalledTimes(1)
    rerender(
      <CalendarProvider<Event> localizer={localizer} defaultDate={focus} view={Views.AGENDA}>
        <Harness />
      </CalendarProvider>,
    )
    expect(cleanupSpy).toHaveBeenCalledTimes(1)
    expect(bindSpy).toHaveBeenCalledTimes(1)
  })

  it('tears the binding down on unmount', () => {
    const { unmount } = renderHook({ view: Views.MONTH })
    unmount()
    expect(cleanupSpy).toHaveBeenCalledTimes(1)
  })
})

import { Views } from '@big-calendar/core'
import { render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeAll, describe, expect, it } from 'vitest'
import { useSignalValue } from '../internal/useSignalValue'
import { LOCALIZER_CASES } from '../testing/localizers'
import CalendarProvider from './CalendarProvider.component'
import { useCalendarContext } from './useCalendarContext'
import { useCalendarStore } from './useCalendarStore'

interface Event {
  id: number
}

describe.each(LOCALIZER_CASES)('CalendarProvider [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    localizer = await create()
  })

  // The provider tests only read the view signal; the localizer is never
  // exercised for date work here.
  function makeWrapper(view = Views.WEEK) {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <CalendarProvider<Event> localizer={localizer} defaultView={view}>
          {children}
        </CalendarProvider>
      )
    }
  }

  it('provides the store to descendants via useCalendarContext', () => {
    const { result } = renderHook(() => useCalendarContext<Event>(), { wrapper: makeWrapper() })
    expect(result.current.store.view.value).toBe(Views.WEEK)
  })

  it('exposes the same store through the useCalendarStore convenience hook', () => {
    const { result } = renderHook(() => useCalendarStore<Event>(), { wrapper: makeWrapper() })
    expect(result.current.view.value).toBe(Views.WEEK)
  })

  it('lets a sibling component read calendar state from context', () => {
    function ViewBadge() {
      const store = useCalendarStore<Event>()
      const view = useSignalValue(store.view)
      return <span>view: {view}</span>
    }

    render(
      <CalendarProvider<Event> localizer={localizer} defaultView={Views.MONTH}>
        <ViewBadge />
      </CalendarProvider>,
    )

    expect(screen.getByText(`view: ${Views.MONTH}`)).toBeTruthy()
  })

  it('renders visually-hidden instruction elements that match the context description ids', () => {
    let ids: { selection: string; event: string } | undefined
    function Probe() {
      ids = useCalendarContext<Event>().descriptionIds
      return null
    }
    render(
      <CalendarProvider<Event> localizer={localizer} defaultView={Views.WEEK}>
        <Probe />
      </CalendarProvider>,
    )
    const selection = document.getElementById(ids!.selection)
    const event = document.getElementById(ids!.event)
    expect(selection?.className).toBe('bc-sr-only')
    expect(selection?.textContent).toContain('arrow keys')
    expect(event?.textContent).toContain('F2')
  })

  it('throws when context hooks are used outside a provider', () => {
    expect(() => renderHook(() => useCalendarContext())).toThrow(/within a <CalendarProvider>/)
  })
})

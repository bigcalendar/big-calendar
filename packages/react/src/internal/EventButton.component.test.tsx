import { Views } from '@big-calendar/core'
import { act, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { CalendarProvider } from '../CalendarProvider'
import type { CalendarProviderProps } from '../CalendarProvider'
import { LOCALIZER_CASES } from '../testing/localizers'
import EventButton from './EventButton.component'

interface Event {
  id?: number
  title: string
  start: string
  end: string
}

const event: Event = { id: 1, title: 'Standup', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z' }
const DOUBLE_CLICK_MS = 250

// One localizer is enough — EventButton exercises no date formatting itself.
const { create } = LOCALIZER_CASES[0]!

describe('EventButton', () => {
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    localizer = await create()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function renderButton(extra?: Partial<CalendarProviderProps<Event>>) {
    const result = render(
      <CalendarProvider<Event>
        localizer={localizer}
        defaultDate="2026-06-15"
        defaultView={Views.DAY}
        events={[event]}
        {...extra}
      >
        <EventButton event={event} title="Standup" time="9:00 AM" className="bc-event">
          <span>content</span>
        </EventButton>
      </CalendarProvider>,
    )
    const button = result.container.querySelector('button.bc-event') as HTMLButtonElement
    return { ...result, button }
  }

  it('renders a button with the event marker, accessible name, shortcuts, and unselected state', () => {
    const { button } = renderButton()
    expect(button.type).toBe('button')
    expect(button.dataset.bcEvent).toBe('1')
    expect(button.getAttribute('aria-label')).toBe('Standup, 9:00 AM')
    expect(button.getAttribute('aria-keyshortcuts')).toBe('Enter Space F2')
    expect(button.getAttribute('aria-selected')).toBe('false')
  })

  it('selects the event and fires onEventClick after the double-click window on a single click', () => {
    vi.useFakeTimers()
    const onEventClick = vi.fn()
    const { button } = renderButton({ onEventClick })
    // Real pointer clicks carry detail >= 1 (keyboard-synthesized clicks are 0).
    fireEvent.click(button, { detail: 1 })
    expect(onEventClick).not.toHaveBeenCalled() // still waiting to rule out a double
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onEventClick).toHaveBeenCalledWith(event)
    expect(button.getAttribute('aria-selected')).toBe('true')
  })

  it('fires onEventDoubleClick and cancels the pending single on a double click', () => {
    vi.useFakeTimers()
    const onEventClick = vi.fn()
    const onEventDoubleClick = vi.fn()
    const { button } = renderButton({ onEventClick, onEventDoubleClick })
    fireEvent.click(button, { detail: 1 })
    fireEvent.doubleClick(button)
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onEventDoubleClick).toHaveBeenCalledWith(event)
    expect(onEventClick).not.toHaveBeenCalled()
  })

  it('activates the primary action immediately on Enter and Space (keyboard)', () => {
    const onEventClick = vi.fn()
    const { button } = renderButton({ onEventClick })
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(onEventClick).toHaveBeenCalledTimes(1)
    expect(button.getAttribute('aria-selected')).toBe('true')
    fireEvent.keyDown(button, { key: ' ' })
    expect(onEventClick).toHaveBeenCalledTimes(2)
  })

  it('activates the secondary action on F2', () => {
    const onEventDoubleClick = vi.fn()
    const { button } = renderButton({ onEventDoubleClick })
    fireEvent.keyDown(button, { key: 'F2' })
    expect(onEventDoubleClick).toHaveBeenCalledWith(event)
  })

  it('stops pointerdown from reaching the surface beneath (no slot selection)', () => {
    const onPointerDown = vi.fn()
    const { container } = render(
      <CalendarProvider<Event> localizer={localizer} defaultDate="2026-06-15" defaultView={Views.DAY} events={[event]}>
        <div onPointerDown={onPointerDown}>
          <EventButton event={event} title="Standup" className="bc-event">
            <span>content</span>
          </EventButton>
        </div>
      </CalendarProvider>,
    )
    const button = container.querySelector('button.bc-event') as HTMLButtonElement
    fireEvent.pointerDown(button)
    expect(onPointerDown).not.toHaveBeenCalled()
  })

  it('omits the marker value and select for an event without an id, still firing the callback', () => {
    const onEventClick = vi.fn()
    const bare: Event = { title: 'No id', start: event.start, end: event.end }
    const { container } = render(
      <CalendarProvider<Event> localizer={localizer} defaultDate="2026-06-15" defaultView={Views.DAY} events={[bare]} onEventClick={onEventClick}>
        <EventButton event={bare} title="No id" className="bc-event">
          <span>content</span>
        </EventButton>
      </CalendarProvider>,
    )
    const button = container.querySelector('button.bc-event') as HTMLButtonElement
    expect(button.dataset.bcEvent).toBe('')
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(onEventClick).toHaveBeenCalledWith(bare)
    expect(button.getAttribute('aria-selected')).toBe('false')
  })
})

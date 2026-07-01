import { Views } from '@big-calendar/core'
import { act, fireEvent, render } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { CalendarProvider, useCalendarContext } from '../CalendarProvider'
import type { CalendarProviderProps } from '../CalendarProvider'
import { LOCALIZER_CASES } from '../testing/localizers'
import EventButton from './EventButton.component'

/** Activates `store.dndEnabled` inside a CalendarProvider (simulates useCalendarDnd). */
function DndEnabler() {
  const { store } = useCalendarContext()
  useEffect(() => {
    store.dndEnabled.value = true
    return () => {
      store.dndEnabled.value = false
    }
  }, [store])
  return null
}

interface Event {
  id?: number
  title: string
  start: string
  end: string
  draggable?: boolean
  resizable?: boolean
}

const event: Event = { id: 1, title: 'Standup', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z', draggable: true, resizable: true }
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

  it('describes the keyboard model via aria-describedby', () => {
    const { button } = renderButton()
    const id = button.getAttribute('aria-describedby')
    expect(id).toBeTruthy()
    const description = document.getElementById(id!)
    expect(description?.textContent).toContain('F2')
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
    expect(onEventClick).toHaveBeenCalledWith(event, expect.any(MouseEvent))
    expect(button.getAttribute('aria-selected')).toBe('true')
  })

  it('selects the event, fires onEventDoubleClick, and cancels the pending single on a double click', () => {
    vi.useFakeTimers()
    const onEventClick = vi.fn()
    const onEventDoubleClick = vi.fn()
    const { button } = renderButton({ onEventClick, onEventDoubleClick })
    fireEvent.click(button, { detail: 1 })
    fireEvent.doubleClick(button)
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onEventDoubleClick).toHaveBeenCalledWith(event, expect.any(MouseEvent))
    expect(onEventClick).not.toHaveBeenCalled()
    expect(button.getAttribute('aria-selected')).toBe('true')
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

  it('activates the secondary action and selects on F2', () => {
    const onEventDoubleClick = vi.fn()
    const { button } = renderButton({ onEventDoubleClick })
    fireEvent.keyDown(button, { key: 'F2' })
    expect(onEventDoubleClick).toHaveBeenCalledWith(event, expect.any(KeyboardEvent))
    expect(button.getAttribute('aria-selected')).toBe('true')
  })

  it('ignores keyboard-synthesized clicks (detail 0) and guards a duplicate click', () => {
    vi.useFakeTimers()
    const onEventClick = vi.fn()
    const { button } = renderButton({ onEventClick })
    fireEvent.click(button, { detail: 0 }) // keyboard-synthesized — ignored here
    fireEvent.click(button, { detail: 1 }) // arms the single-click timer
    fireEvent.click(button, { detail: 1 }) // second press while pending — ignored
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onEventClick).toHaveBeenCalledTimes(1)
  })

  it('ignores keys other than Enter / Space / F2', () => {
    const onEventClick = vi.fn()
    const onEventDoubleClick = vi.fn()
    const { button } = renderButton({ onEventClick, onEventDoubleClick })
    fireEvent.keyDown(button, { key: 'a' })
    expect(onEventClick).not.toHaveBeenCalled()
    expect(onEventDoubleClick).not.toHaveBeenCalled()
  })

  it('clears a pending single-click timer on unmount (no late fire)', () => {
    vi.useFakeTimers()
    const onEventClick = vi.fn()
    const { button, unmount } = renderButton({ onEventClick })
    fireEvent.click(button, { detail: 1 }) // arms the timer
    unmount()
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onEventClick).not.toHaveBeenCalled()
  })

  it('fires onEventRightClick with the event and DOM event on contextmenu', () => {
    const onEventRightClick = vi.fn()
    const { button } = renderButton({ onEventRightClick })
    fireEvent.contextMenu(button)
    expect(onEventRightClick).toHaveBeenCalledTimes(1)
    expect(onEventRightClick.mock.calls[0]![0]).toBe(event)
    expect(typeof onEventRightClick.mock.calls[0]![1].preventDefault).toBe('function')
  })

  it('leaves the native context menu untouched when no right-click handler is wired', () => {
    const { button } = renderButton() // no handlers
    const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    button.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(false)
  })

  it('fires onEventMiddleClick only for the middle button (auxclick button 1)', () => {
    const onEventMiddleClick = vi.fn()
    const { button } = renderButton({ onEventMiddleClick })
    fireEvent(button, new MouseEvent('auxclick', { bubbles: true, button: 2 })) // right-button — ignored
    expect(onEventMiddleClick).not.toHaveBeenCalled()
    fireEvent(button, new MouseEvent('auxclick', { bubbles: true, button: 1 }))
    expect(onEventMiddleClick).toHaveBeenCalledTimes(1)
    expect(onEventMiddleClick.mock.calls[0]![0]).toBe(event)
    expect(typeof onEventMiddleClick.mock.calls[0]![1].preventDefault).toBe('function')
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
    expect(onEventClick).toHaveBeenCalledWith(bare, expect.any(KeyboardEvent))
    expect(button.getAttribute('aria-selected')).toBe('false')
  })

  function renderWithHandles(
    extra?: Partial<CalendarProviderProps<Event>>,
    edges: readonly ('start' | 'end')[] = ['start', 'end'],
    dnd = true,
  ) {
    const result = render(
      <CalendarProvider<Event>
        localizer={localizer}
        defaultDate="2026-06-15"
        defaultView={Views.DAY}
        events={[event]}
        {...extra}
      >
        {dnd && <DndEnabler />}
        <EventButton event={event} title="Standup" className="bc-event" resizeEdges={edges}>
          <span>content</span>
        </EventButton>
      </CalendarProvider>,
    )
    return result.container
  }

  it('renders the requested resize handles when DnD is enabled and the event is resizable', () => {
    const container = renderWithHandles()
    expect(container.querySelector('[data-bc-resize="start"]')).not.toBeNull()
    expect(container.querySelector('[data-bc-resize="end"]')).not.toBeNull()
  })

  it('renders only the requested edges (month single-edge segments)', () => {
    const container = renderWithHandles(undefined, ['end'])
    expect(container.querySelector('[data-bc-resize="start"]')).toBeNull()
    expect(container.querySelector('[data-bc-resize="end"]')).not.toBeNull()
  })

  it('omits resize handles when DnD is not enabled (even if the event is resizable)', () => {
    const container = renderWithHandles(undefined, ['start', 'end'], false)
    expect(container.querySelector('[data-bc-resize]')).toBeNull()
  })

  it('omits resize handles when the event is not resizable', () => {
    const container = renderWithHandles({ accessors: { resizable: () => false } })
    expect(container.querySelector('[data-bc-resize]')).toBeNull()
  })

  it('omits resize handles when resizeEdges is not set', () => {
    const { button } = renderButton()
    expect(button.querySelector('[data-bc-resize]')).toBeNull()
  })

  it('adds bc-event-draggable class when DnD is enabled and the event is draggable', () => {
    const container = renderWithHandles()
    expect(container.querySelector('.bc-event-draggable')).not.toBeNull()
  })

  it('omits bc-event-draggable class when DnD is not enabled', () => {
    const container = renderWithHandles(undefined, ['start', 'end'], false)
    expect(container.querySelector('.bc-event-draggable')).toBeNull()
  })

  it('omits bc-event-draggable class when the event is not draggable', () => {
    const container = renderWithHandles({ accessors: { draggable: () => false } })
    expect(container.querySelector('.bc-event-draggable')).toBeNull()
  })
})

import { Views } from '@big-calendar/core'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { CalendarProvider } from '../CalendarProvider'
import type { CalendarProviderProps } from '../CalendarProvider'
import type { AgendaEventProps } from '../components.type'
import { LOCALIZER_CASES } from '../testing/localizers'
import AgendaView from './AgendaView.component'

interface Event {
  id?: number
  title?: string
  start: string
  end: string
  allDay?: boolean
}

const focus = '2026-06-15'
const events: Event[] = [
  { id: 1, title: 'Standup', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z', allDay: false },
  // bare event: no id/title/allDay → exercises the accessor fallbacks
  { start: '2026-06-15T11:00:00.000Z', end: '2026-06-15T12:00:00.000Z' },
]

describe.each(LOCALIZER_CASES)('AgendaView [$name]', ({ create }) => {
  const DOUBLE_CLICK_MS = 250
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    localizer = await create()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function renderAgenda(extra?: Partial<CalendarProviderProps<Event>>) {
    return render(
      <CalendarProvider<Event> localizer={localizer} defaultDate={focus} defaultView={Views.AGENDA} events={events} {...extra}>
        <AgendaView />
      </CalendarProvider>,
    )
  }

  it('renders a day group with resolved title and time, and falls back for bare events', () => {
    renderAgenda()
    // Expected header/time read back from the real localizer (§5.5).
    const dateLabel = localizer.format({ value: focus, format: 'agendaDate' })
    const from = localizer.format({ value: '2026-06-15T11:00:00.000Z', format: 'agendaTime' })
    const to = localizer.format({ value: '2026-06-15T12:00:00.000Z', format: 'agendaTime' })
    expect(screen.getByText(dateLabel)).toBeTruthy()
    expect(screen.getByText('Standup')).toBeTruthy()
    // bare event → time range still formatted from start/end
    expect(screen.getByText(`${from} – ${to}`)).toBeTruthy()
  })

  it('renders the Date / Time / Event column header', () => {
    const { container } = renderAgenda()
    const headings = container.querySelectorAll('.bc-agenda-heading')
    expect(Array.from(headings).map((h) => h.textContent)).toEqual(['Date', 'Time', 'Event'])
  })

  it('sets --bc-agenda-rows on a day group so the date cell can span its events', () => {
    // Both test events fall on the focus day → that group spans two event rows.
    const { container } = renderAgenda()
    const day = container.querySelector('.bc-agenda-day') as HTMLElement
    expect(day.style.getPropertyValue('--bc-agenda-rows')).toBe('2')
  })

  it('renders the empty state when no events fall in range', () => {
    renderAgenda({ events: [] })
    expect(screen.getByText('There are no events in this range.')).toBeTruthy()
  })

  it('renders nothing when the active view is not the agenda', () => {
    const { container } = renderAgenda({ defaultView: Views.MONTH })
    expect(container.querySelector('.bc-agenda')).toBeNull()
  })

  it('honors agenda slot overrides (date / event / empty)', () => {
    function CustomEvent({ title }: AgendaEventProps<Event>) {
      return <div data-testid="custom-event">{title}</div>
    }
    renderAgenda({
      components: {
        agenda: {
          date: ({ label }) => <div data-testid="custom-date">{label}</div>,
          event: CustomEvent,
          empty: ({ message }) => <div data-testid="custom-empty">{message}</div>,
        },
      },
    })
    expect(screen.getByTestId('custom-date')).toBeTruthy()
    expect(screen.getAllByTestId('custom-event').length).toBe(2)
  })

  it('renders the event title as a plain span (not a button) when no handler is wired', () => {
    const { container } = renderAgenda()
    expect(container.querySelector('button.bc-agenda-event')).toBeNull()
    const titles = container.querySelectorAll('span.bc-agenda-event')
    expect(titles.length).toBe(2)
    expect(screen.getByText('Standup')).toBeTruthy()
  })

  it('renders each title as its own button (natural tab order) when a handler is wired', () => {
    const { container } = renderAgenda({ onEventClick: () => {} })
    const buttons = container.querySelectorAll('button.bc-agenda-event')
    expect(buttons.length).toBe(2)
    // Natural tab order: each button is independently tabbable (no roving -1).
    for (const b of buttons) expect((b as HTMLButtonElement).tabIndex).toBe(0)
  })

  it('promotes the title to a button when only onEventRightClick is wired', () => {
    const { container } = renderAgenda({ onEventRightClick: () => {} })
    expect(container.querySelectorAll('button.bc-agenda-event').length).toBe(2)
  })

  it('fires onEventClick after the double-click window on a single click', () => {
    vi.useFakeTimers()
    const onEventClick = vi.fn()
    renderAgenda({ onEventClick })
    fireEvent.click(screen.getByRole('button', { name: 'Standup' }), { detail: 1 })
    expect(onEventClick).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onEventClick).toHaveBeenCalledWith(expect.objectContaining({ title: 'Standup' }))
  })

  it('fires onEventDoubleClick and cancels the pending single on a double click', () => {
    vi.useFakeTimers()
    const onEventClick = vi.fn()
    const onEventDoubleClick = vi.fn()
    renderAgenda({ onEventClick, onEventDoubleClick })
    const button = screen.getByRole('button', { name: 'Standup' })
    fireEvent.click(button, { detail: 1 })
    fireEvent.doubleClick(button)
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onEventDoubleClick).toHaveBeenCalledWith(expect.objectContaining({ title: 'Standup' }))
    expect(onEventClick).not.toHaveBeenCalled()
  })

  it('activates primary on Enter/Space and secondary on F2 (keyboard)', () => {
    const onEventClick = vi.fn()
    const onEventDoubleClick = vi.fn()
    renderAgenda({ onEventClick, onEventDoubleClick })
    const button = screen.getByRole('button', { name: 'Standup' })
    fireEvent.keyDown(button, { key: 'Enter' })
    fireEvent.keyDown(button, { key: ' ' })
    expect(onEventClick).toHaveBeenCalledTimes(2)
    fireEvent.keyDown(button, { key: 'F2' })
    expect(onEventDoubleClick).toHaveBeenCalledTimes(1)
  })

  it('ignores keyboard-synthesized clicks (detail 0) and guards a duplicate click', () => {
    vi.useFakeTimers()
    const onEventClick = vi.fn()
    renderAgenda({ onEventClick })
    const button = screen.getByRole('button', { name: 'Standup' })
    fireEvent.click(button, { detail: 0 })
    fireEvent.click(button, { detail: 1 })
    fireEvent.click(button, { detail: 1 })
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onEventClick).toHaveBeenCalledTimes(1)
  })

  it('fires the secondary action on a double-click with no pending single', () => {
    const onEventDoubleClick = vi.fn()
    renderAgenda({ onEventDoubleClick })
    fireEvent.doubleClick(screen.getByRole('button', { name: 'Standup' }))
    expect(onEventDoubleClick).toHaveBeenCalledTimes(1)
  })

  it('ignores keys other than Enter / Space / F2', () => {
    const onEventClick = vi.fn()
    const onEventDoubleClick = vi.fn()
    renderAgenda({ onEventClick, onEventDoubleClick })
    fireEvent.keyDown(screen.getByRole('button', { name: 'Standup' }), { key: 'a' })
    expect(onEventClick).not.toHaveBeenCalled()
    expect(onEventDoubleClick).not.toHaveBeenCalled()
  })

  it('clears a pending single-click timer on unmount (no late fire)', () => {
    vi.useFakeTimers()
    const onEventClick = vi.fn()
    const { unmount } = renderAgenda({ onEventClick })
    fireEvent.click(screen.getByRole('button', { name: 'Standup' }), { detail: 1 })
    unmount()
    act(() => {
      vi.advanceTimersByTime(DOUBLE_CLICK_MS)
    })
    expect(onEventClick).not.toHaveBeenCalled()
  })

  it('fires onEventRightClick with the event and DOM event on contextmenu', () => {
    const onEventRightClick = vi.fn()
    renderAgenda({ onEventRightClick })
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Standup' }))
    expect(onEventRightClick).toHaveBeenCalledTimes(1)
    expect(onEventRightClick.mock.calls[0]![0]).toEqual(expect.objectContaining({ title: 'Standup' }))
    expect(typeof onEventRightClick.mock.calls[0]![1].preventDefault).toBe('function')
  })

  it('fires onEventMiddleClick only for the middle button (auxclick button 1)', () => {
    const onEventMiddleClick = vi.fn()
    renderAgenda({ onEventMiddleClick })
    const button = screen.getByRole('button', { name: 'Standup' })
    fireEvent(button, new MouseEvent('auxclick', { bubbles: true, button: 2 }))
    expect(onEventMiddleClick).not.toHaveBeenCalled()
    fireEvent(button, new MouseEvent('auxclick', { bubbles: true, button: 1 }))
    expect(onEventMiddleClick).toHaveBeenCalledTimes(1)
  })
})

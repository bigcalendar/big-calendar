import { Views } from '@big-calendar/core'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CalendarProvider } from '../CalendarProvider'
import type { CalendarProviderProps } from '../CalendarProvider'
import type { AgendaEventProps } from '../components.type'
import type { CalendarProps } from '../useCalendar'
import AgendaView from './AgendaView.component'

interface Event {
  id?: number
  title?: string
  start: string
  end: string
  allDay?: boolean
}

const day = (d: string) => d.slice(0, 10)
const addDays = (d: string, n: number) => {
  const date = new Date(`${day(d)}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + n)
  return date.toISOString().slice(0, 10)
}

// A compact UTC-day fake supporting the agenda range + model + label formatting.
const localizer = {
  format: ({ value, format }: { value: string; format: string }) => `${format}:${value}`,
  startOf: ({ value }: { value: string }) => day(value),
  add: ({ value, amount }: { value: string; amount: number }) => addDays(value, amount),
  // month-path methods: only needed so a MONTH-view store computes without
  // throwing (empty grid) for the "not the agenda" branch.
  firstVisibleDay: (value: string) => day(value),
  lastVisibleDay: (value: string) => day(value),
  visibleDays: () => [],
  range: ({ start, end }: { start: string; end: string }) => {
    const out: string[] = []
    for (let d = day(start); d <= day(end); d = addDays(d, 1)) out.push(d)
    return out
  },
  sortEvents: ({ events }: { events: Array<{ start: string }> }) =>
    [...events].sort((a, b) => (a.start < b.start ? -1 : 1)),
  inEventRange: ({
    event,
    range,
  }: {
    event: { start: string; end: string }
    range: { start: string; end: string }
  }) => event.start < range.end && event.end >= range.start,
  getMinutesFromMidnight: () => 0,
} as unknown as CalendarProps<Event>['localizer']

const focus = '2026-06-15'
const events: Event[] = [
  { id: 1, title: 'Standup', start: '2026-06-15T09:00:00.000Z', end: '2026-06-15T10:00:00.000Z', allDay: false },
  // bare event: no id/title/allDay → exercises the accessor fallbacks
  { start: '2026-06-15T11:00:00.000Z', end: '2026-06-15T12:00:00.000Z' },
]

function renderAgenda(extra?: Partial<CalendarProviderProps<Event>>) {
  return render(
    <CalendarProvider<Event> localizer={localizer} defaultDate={focus} defaultView={Views.AGENDA} events={events} {...extra}>
      <AgendaView />
    </CalendarProvider>,
  )
}

describe('AgendaView', () => {
  it('renders a day group with resolved title and time, and falls back for bare events', () => {
    renderAgenda()
    expect(screen.getByText('agendaDate:2026-06-15')).toBeTruthy()
    expect(screen.getByText('Standup')).toBeTruthy()
    // bare event → time range still formatted from start/end
    expect(screen.getByText('agendaTime:2026-06-15T11:00:00.000Z – agendaTime:2026-06-15T12:00:00.000Z')).toBeTruthy()
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
})

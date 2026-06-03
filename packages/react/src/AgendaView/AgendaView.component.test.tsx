import { Views } from '@big-calendar/core'
import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it } from 'vitest'
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
  let localizer: Awaited<ReturnType<typeof create>>
  beforeAll(async () => {
    localizer = await create()
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

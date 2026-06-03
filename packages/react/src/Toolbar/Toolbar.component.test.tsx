import { Views } from '@big-calendar/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CalendarProvider } from '../CalendarProvider'
import type { CalendarProviderProps } from '../CalendarProvider'
import type { CalendarProps } from '../useCalendar'
import type { ToolbarProps } from '../components.type'
import Toolbar from './Toolbar.component'

interface Event {
  id: number
}

// Minimal UTC-ish fake: enough for the month range, a day switch, navigation,
// and the label formatter (which echoes "<role>:<value>").
const localizer = {
  format: ({ value, format }: { value: string; format: string }) => `${format}:${value}`,
  firstVisibleDay: (value: string) => value,
  lastVisibleDay: (value: string) => value,
  visibleDays: (value: string) => [value],
  startOf: ({ value }: { value: string }) => value,
  add: ({ value }: { value: string }) => value,
  getMinutesFromMidnight: () => 0,
} as unknown as CalendarProps<Event>['localizer']

function renderToolbar(extra?: Partial<CalendarProviderProps<Event>>) {
  return render(
    <CalendarProvider<Event> localizer={localizer} defaultDate="2026-06-15" defaultView={Views.MONTH} {...extra}>
      <Toolbar />
    </CalendarProvider>,
  )
}

describe('Toolbar', () => {
  it('renders today/prev/next, the localized label, and a button per view', () => {
    renderToolbar()
    expect(screen.getByRole('button', { name: 'Today' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy()
    // month label uses the monthHeader role on the focus date
    expect(screen.getByText('monthHeader:2026-06-15')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Month' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Agenda' })).toBeTruthy()
  })

  it('marks the active view button via aria-pressed and switches on click', () => {
    renderToolbar()
    const month = screen.getByRole('button', { name: 'Month' })
    const day = screen.getByRole('button', { name: 'Day' })
    expect(month.getAttribute('aria-pressed')).toBe('true')
    expect(day.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(day)
    expect(day.getAttribute('aria-pressed')).toBe('true')
    expect(month.getAttribute('aria-pressed')).toBe('false')
  })

  it('fires navigation through the store for next / back / today', () => {
    const onNavigate = vi.fn()
    renderToolbar({ onNavigate })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onNavigate).toHaveBeenLastCalledWith({ date: '2026-06-15', view: Views.MONTH })
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onNavigate).toHaveBeenLastCalledWith({ date: '2026-06-15', view: Views.MONTH })
    fireEvent.click(screen.getByRole('button', { name: 'Today' }))
    expect(onNavigate).toHaveBeenCalledTimes(3)
  })

  it('renders a components.toolbar override instead of the default', () => {
    function CustomToolbar({ label }: ToolbarProps) {
      return <div data-testid="custom">{label}</div>
    }
    renderToolbar({ components: { toolbar: CustomToolbar } })
    expect(screen.getByTestId('custom').textContent).toBe('monthHeader:2026-06-15')
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull()
  })
})

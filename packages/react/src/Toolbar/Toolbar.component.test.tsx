import { Views } from '@big-calendar/core'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { CalendarProvider } from '../CalendarProvider'
import type { CalendarProviderProps } from '../CalendarProvider'
import type { ToolbarProps } from '../components.type'
import { LOCALIZER_CASES } from '../testing/localizers'
import Toolbar from './Toolbar.component'

interface Event {
  id: number
}

const FOCUS = '2026-06-15'

describe.each(LOCALIZER_CASES)('Toolbar [$name]', ({ create }) => {
  let localizer: Awaited<ReturnType<typeof create>>
  // Expected label/navigation values read back from the real localizer, never
  // hand-rolled. monthHeader title + one month-sized step in each direction.
  let monthLabel: string

  beforeAll(async () => {
    localizer = await create()
    monthLabel = localizer.format({ value: FOCUS, format: 'monthHeader' })
  })

  function renderToolbar(extra?: Partial<CalendarProviderProps<Event>>) {
    return render(
      <CalendarProvider<Event> localizer={localizer} defaultDate={FOCUS} defaultView={Views.MONTH} {...extra}>
        <Toolbar />
      </CalendarProvider>,
    )
  }

  it('renders today/prev/next, the localized label, and a button per view', () => {
    renderToolbar()
    expect(screen.getByRole('button', { name: 'Today' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy()
    // month label uses the monthHeader role on the focus date
    expect(screen.getByText(monthLabel)).toBeTruthy()
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
    const next = localizer.add({ value: FOCUS, amount: 1, unit: 'month' })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onNavigate).toHaveBeenLastCalledWith({ date: next, view: Views.MONTH })
    // Back steps from the current (post-Next) focus date.
    const back = localizer.add({ value: next, amount: -1, unit: 'month' })
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onNavigate).toHaveBeenLastCalledWith({ date: back, view: Views.MONTH })
    fireEvent.click(screen.getByRole('button', { name: 'Today' }))
    expect(onNavigate).toHaveBeenCalledTimes(3)
  })

  it('renders a components.toolbar override instead of the default', () => {
    function CustomToolbar({ label }: ToolbarProps) {
      return <div data-testid="custom">{label}</div>
    }
    renderToolbar({ components: { toolbar: CustomToolbar } })
    expect(screen.getByTestId('custom').textContent).toBe(monthLabel)
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull()
  })
})

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Popover from './Popover.component'

/** Dispatch the native popover `toggle` event (jsdom has no Popover API). */
function dispatchToggle(panel: HTMLElement, newState: 'open' | 'closed') {
  fireEvent(panel, Object.assign(new Event('toggle'), { newState }))
}

function renderPopover() {
  render(
    <Popover trigger={(props) => <button {...props}>Open</button>}>
      <p>Panel body</p>
    </Popover>,
  )
  const trigger = screen.getByRole('button', { name: 'Open' })
  const panel = document.getElementById(trigger.getAttribute('aria-controls') ?? '')
  if (!panel) throw new Error('panel not found')
  return { trigger, panel }
}

describe('Popover', () => {
  it('wires the trigger to the panel via the native Popover API', () => {
    const { trigger, panel } = renderPopover()

    expect(trigger.getAttribute('popovertarget')).toBe(panel.id)
    expect(trigger.getAttribute('aria-controls')).toBe(panel.id)
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(panel.getAttribute('popover')).toBe('auto')
  })

  it('mounts content only while open and reflects state on the trigger', async () => {
    const { trigger, panel } = renderPopover()
    expect(screen.queryByText('Panel body')).toBeNull()

    dispatchToggle(panel, 'open')

    expect(screen.getByText('Panel body')).toBeTruthy()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    // The positioning effect runs floating-ui and pins the panel.
    await waitFor(() => expect(panel.style.position).toBe('fixed'))
    expect(panel.style.insetInlineStart).toMatch(/px$/)

    dispatchToggle(panel, 'closed')

    expect(screen.queryByText('Panel body')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('repositions on window resize while open', async () => {
    const { panel } = renderPopover()
    dispatchToggle(panel, 'open')
    await waitFor(() => expect(panel.style.position).toBe('fixed'))

    panel.style.position = ''
    fireEvent(window, new Event('resize'))

    await waitFor(() => expect(panel.style.position).toBe('fixed'))
  })

  it('positions with a custom placement', async () => {
    render(
      <Popover placement="top" trigger={(props) => <button {...props}>Open</button>}>
        <p>Panel body</p>
      </Popover>,
    )
    const trigger = screen.getByRole('button', { name: 'Open' })
    const panel = document.getElementById(trigger.getAttribute('aria-controls') ?? '')
    if (!panel) throw new Error('panel not found')
    dispatchToggle(panel, 'open')
    await waitFor(() => expect(panel.style.position).toBe('fixed'))
  })

  it('skips positioning when the trigger never attaches the anchor ref', () => {
    const { container } = render(
      <Popover trigger={() => <button>No ref</button>}>
        <p>Panel body</p>
      </Popover>,
    )
    const panel = container.querySelector('[popover]') as HTMLElement
    dispatchToggle(panel, 'open')
    // The anchor ref was never set, so positioning bails before pinning the panel.
    expect(panel.style.position).toBe('')
  })

  it('uses a custom panel class when provided', () => {
    render(
      <Popover className="custom-panel" trigger={(props) => <button {...props}>Open</button>}>
        <p>Body</p>
      </Popover>,
    )
    const trigger = screen.getByRole('button', { name: 'Open' })
    const panel = document.getElementById(trigger.getAttribute('aria-controls') ?? '')
    expect(panel?.classList.contains('custom-panel')).toBe(true)
  })
})

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Tooltip from './Tooltip.component'

/** The native Popover API surface we mock onto the prototype (absent in jsdom). */
type PopoverProto = { showPopover?: () => void; hidePopover?: () => void }

function renderTooltip() {
  const { container } = render(
    <Tooltip label="More info">
      <button>Trigger</button>
    </Tooltip>,
  )
  const trigger = screen.getByRole('button', { name: 'Trigger' })
  const tip = container.querySelector('[role="tooltip"]')
  const anchor = container.querySelector('.bc-tooltip-anchor')
  if (!tip || !anchor) throw new Error('tooltip parts not found')
  return { trigger, tip: tip as HTMLElement, anchor: anchor as HTMLElement }
}

describe('Tooltip', () => {
  it('describes the trigger and renders a manual popover', () => {
    const { trigger, tip } = renderTooltip()

    expect(tip.id).toBeTruthy()
    expect(trigger.getAttribute('aria-describedby')).toBe(tip.id)
    expect(tip.getAttribute('popover')).toBe('manual')
    expect(tip.getAttribute('role')).toBe('tooltip')
    expect(tip.textContent).toBe('More info')
  })

  it('opens on hover and positions, closes on leave (no native API)', async () => {
    const { tip, anchor } = renderTooltip()

    fireEvent.pointerEnter(anchor)
    await waitFor(() => expect(tip.style.position).toBe('fixed'))

    fireEvent.pointerLeave(anchor)
    fireEvent.focus(anchor)
    fireEvent.blur(anchor)
    fireEvent.click(anchor)
    // No native API present — the above must not throw.
  })

  it('accepts a custom placement', async () => {
    const { container } = render(
      <Tooltip label="Below" placement="bottom">
        <button>Trigger</button>
      </Tooltip>,
    )
    const anchor = container.querySelector('.bc-tooltip-anchor')
    const tip = container.querySelector('[role="tooltip"]')
    if (!anchor || !tip) throw new Error('tooltip parts not found')
    fireEvent.pointerEnter(anchor)
    await waitFor(() => expect((tip as HTMLElement).style.position).toBe('fixed'))
  })

  describe('with the native Popover API', () => {
    const show = vi.fn<() => void>()
    const hide = vi.fn<() => void>()

    beforeEach(() => {
      const proto = HTMLElement.prototype as unknown as PopoverProto
      proto.showPopover = show
      proto.hidePopover = hide
    })

    afterEach(() => {
      Reflect.deleteProperty(HTMLElement.prototype, 'showPopover')
      Reflect.deleteProperty(HTMLElement.prototype, 'hidePopover')
      show.mockClear()
      hide.mockClear()
    })

    it('shows and hides via the imperative API', async () => {
      const { anchor, tip } = renderTooltip()

      fireEvent.pointerEnter(anchor)
      expect(show).toHaveBeenCalled()
      await waitFor(() => expect(tip.style.position).toBe('fixed'))

      fireEvent.pointerLeave(anchor)
      expect(hide).toHaveBeenCalled()
    })
  })
})

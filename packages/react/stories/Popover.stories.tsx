import type { Meta, StoryObj } from '@storybook/react-vite'
import { Popover } from '../src'

const meta: Meta<typeof Popover> = {
  title: 'React/Top layer/Popover',
  component: Popover,
  parameters: {
    docs: {
      description: {
        component:
          'An anchored top-layer popover on the native Popover API. The trigger carries `popovertarget`, so the browser owns open/close, light-dismiss, and Esc; placement comes from `@floating-ui/core`, lazily loaded on first open.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof Popover>

/** Click the trigger to open a panel in the top layer. Click away or press Esc to dismiss. */
export const Basic: Story = {
  render: () => (
    <div style={{ padding: 48 }}>
      <Popover
        trigger={(props) => (
          <button {...props} className="bc-show-more">
            Open popover
          </button>
        )}
      >
        <div className="bc-popover-title">Top-layer panel</div>
        <p style={{ margin: 0 }}>
          Rendered in the browser top layer, so it escapes ancestor overflow and stacking.
        </p>
      </Popover>
    </div>
  ),
}

/** A list of items, mirroring how the month / all-day "+N more" popover is composed. */
export const WithList: Story = {
  render: () => (
    <div style={{ padding: 48 }}>
      <Popover
        placement="bottom-start"
        trigger={(props) => (
          <button {...props} className="bc-show-more">
            +3 more
          </button>
        )}
      >
        <ul className="bc-popover-events">
          <li className="bc-popover-event">Sprint planning</li>
          <li className="bc-popover-event">Release cut</li>
          <li className="bc-popover-event">Retro</li>
        </ul>
      </Popover>
    </div>
  ),
}

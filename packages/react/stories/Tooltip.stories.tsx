import type { Meta, StoryObj } from '@storybook/react-vite'
import { Tooltip } from '../src'

const meta: Meta<typeof Tooltip> = {
  title: 'React/Top layer/Tooltip',
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component:
          'A top-layer tooltip on the native Popover API. Opens on hover and focus, toggles on tap (so it is reachable without a pointer hover), and wires the label to the trigger via `aria-describedby`. Positioned with `@floating-ui/core`.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof Tooltip>

/** Hover, focus, or tap the trigger to reveal the tooltip above it. */
export const Basic: Story = {
  render: () => (
    <div style={{ padding: 80 }}>
      <Tooltip label="Jumps to today's date">
        <button className="bc-show-more">Today</button>
      </Tooltip>
    </div>
  ),
}

/** Placement can be steered; here the tooltip opens below the trigger. */
export const Below: Story = {
  render: () => (
    <div style={{ padding: 80 }}>
      <Tooltip label="Shown below the trigger" placement="bottom">
        <button className="bc-show-more">Hover me</button>
      </Tooltip>
    </div>
  ),
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Dialog } from '../src'

const meta: Meta<typeof Dialog> = {
  title: 'React/Top layer/Dialog',
  component: Dialog,
  parameters: {
    docs: {
      description: {
        component:
          'A modal dialog on the native `<dialog>` element. `showModal()` provides the focus trap, Esc-to-close, top-layer rendering, and `::backdrop`; focus returns to the previously-focused element on close.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof Dialog>

function DialogDemo() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ padding: 40 }}>
      <button className="bc-show-more" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} aria-label="Demo dialog">
        <div className="bc-popover-title">Modal dialog</div>
        <p>
          A native modal: focus is trapped inside, Esc closes it, and the backdrop dims the page.
          Closing returns focus to the button that opened it.
        </p>
        <button className="bc-show-more" onClick={() => setOpen(false)}>
          Close
        </button>
      </Dialog>
    </div>
  )
}

/** Open the modal, then dismiss it with the close button, the backdrop, or Esc. */
export const Basic: Story = {
  render: () => <DialogDemo />,
}

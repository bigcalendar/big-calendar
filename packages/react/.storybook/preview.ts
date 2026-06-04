import type { Preview } from '@storybook/react-vite'
// The shipped stylesheet drives all calendar layout/skin; stories render against
// the real CSS so visual regressions surface here, not just in apps.
import '@big-calendar/styles/index.css'

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
  },
}

export default preview

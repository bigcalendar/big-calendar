import type { Preview } from '@storybook/vue3-vite'
import '@big-calendar/styles/index.css'

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
  },
}

export default preview

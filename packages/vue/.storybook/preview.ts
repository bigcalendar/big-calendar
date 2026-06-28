import type { Preview } from '@storybook/vue3-vite'
import '@big-calendar/styles/index.css'
import './withVueLocalizerDecorator'

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Concepts',
          'Calendar',
          ['Standard', 'CalendarProvider', 'Views', 'Toolbar', 'Custom Components', 'Custom Rendering', 'Event Type Accessor', 'Localization'],
          'Events',
          ['Overview', 'Event Callbacks'],
          'Selection',
          ['Overview', 'Selectable'],
          'Drag & Drop',
          ['Overview', 'Event Drag & Drop', 'Drop from Outside'],
          'Background Events',
          ['Overview', 'With Background Events'],
          'Resources',
          ['Overview', 'With Resources', 'Resource Type Accessor'],
          'Primitives',
          ['Popover', 'Tooltip', 'Dialog'],
          'Advanced',
          ['Headless API', 'useMonthView', 'useTimeGridView', 'useAgendaView', 'Interaction Hooks', 'Data Hooks', 'useFloatingAnchor'],
          'Utilities',
          ['Geometry Styles', 'Event Time'],
        ],
      },
    },
  },
}

export default preview

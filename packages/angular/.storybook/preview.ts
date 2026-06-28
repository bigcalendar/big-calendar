import type { Preview } from '@storybook/angular'
import '@big-calendar/styles/index.css'

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
          ['Headless API', 'injectMonthView', 'injectTimeGridView', 'injectAgendaView', 'Interaction Hooks', 'Data Hooks'],
          'Utilities',
          ['Geometry Styles', 'Event Time'],
        ],
      },
    },
  },
}

export default preview

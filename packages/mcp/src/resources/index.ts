import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as calendarProvider from './api/calendar-provider.js'
import * as accessors from './api/accessors.js'
import * as views from './api/views.js'
import * as dnd from './api/dnd.js'
import * as localizers from './api/localizers.js'
import * as basicSetup from './recipes/basic-setup.js'
import * as basicSetupVue from './recipes/basic-setup-vue.js'
import * as eventEditing from './recipes/event-editing.js'
import * as createEvent from './recipes/create-event.js'
import * as dataFetching from './recipes/data-fetching.js'
import * as customEvent from './recipes/custom-event.js'

interface ResourceEntry {
  uri: string
  name: string
  description: string
  content: string
}

const RESOURCES: ResourceEntry[] = [
  {
    uri: calendarProvider.URI,
    name: 'CalendarProvider props reference',
    description: 'Complete props reference for the CalendarProvider component',
    content: calendarProvider.CONTENT,
  },
  {
    uri: accessors.URI,
    name: 'Accessors configuration guide',
    description: 'How to map your event/resource fields to Big Calendar accessor keys',
    content: accessors.CONTENT,
  },
  {
    uri: views.URI,
    name: 'Built-in views reference',
    description: 'Month, week, work_week, day, and agenda view options',
    content: views.CONTENT,
  },
  {
    uri: dnd.URI,
    name: 'Drag-and-drop setup guide',
    description: 'How to enable drag-to-move and drag-to-resize using @big-calendar/dnd',
    content: dnd.CONTENT,
  },
  {
    uri: localizers.URI,
    name: 'Localizer options',
    description: 'LuxonLocalizer and TemporalLocalizer setup and configuration',
    content: localizers.CONTENT,
  },
  {
    uri: basicSetup.URI,
    name: 'Basic setup recipe (React)',
    description: 'A minimal working Big Calendar integration in React',
    content: basicSetup.CONTENT,
  },
  {
    uri: basicSetupVue.URI,
    name: 'Basic setup recipe (Vue 3)',
    description: 'A minimal working Big Calendar integration in Vue 3',
    content: basicSetupVue.CONTENT,
  },
  {
    uri: eventEditing.URI,
    name: 'Event editing modal recipe',
    description: 'Open an edit modal when the user clicks an event',
    content: eventEditing.CONTENT,
  },
  {
    uri: createEvent.URI,
    name: 'Create event from slot selection recipe',
    description: 'Let users create events by clicking or dragging in empty calendar cells',
    content: createEvent.CONTENT,
  },
  {
    uri: dataFetching.URI,
    name: 'Data fetching recipe',
    description: 'Fetch events from your API on range change',
    content: dataFetching.CONTENT,
  },
  {
    uri: customEvent.URI,
    name: 'Custom event component recipe',
    description: 'Replace the default event block with a custom React component',
    content: customEvent.CONTENT,
  },
]

export function registerResources(server: McpServer): void {
  for (const resource of RESOURCES) {
    server.registerResource(
      resource.name,
      resource.uri,
      {
        description: resource.description,
        mimeType: 'text/markdown',
      },
      () => ({
        contents: [
          {
            uri: resource.uri,
            mimeType: 'text/markdown',
            text: resource.content,
          },
        ],
      }),
    )
  }
}

export { RESOURCES }

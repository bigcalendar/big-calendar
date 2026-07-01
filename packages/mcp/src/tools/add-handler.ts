import { resolve } from 'node:path'
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { findBcMd, readBcMd } from '../memory/reader.js'
import type { BcMdFrontmatter } from '../memory/schema.js'

export type SupportedHandler =
  | 'onEventClick'
  | 'onSlotSelect'
  | 'onEventDrop'
  | 'onEventResize'
  | 'onNavigate'
  | 'onView'
  | 'onRangeChange'

const HANDLER_DESCRIPTIONS: Record<SupportedHandler, string> = {
  onEventClick: 'Fired when the user clicks an event',
  onSlotSelect: 'Fired when the user finishes selecting a slot range',
  onEventDrop: 'Fired when an event is dropped to a new position (requires DnD)',
  onEventResize: 'Fired when an event is resized (requires DnD)',
  onNavigate: 'Fired when the calendar navigates to a new date',
  onView: 'Fired when the active view changes',
  onRangeChange: 'Fired when the visible date range changes (date or view change)',
}

export const AddHandlerInputSchema = {
  handler: z
    .enum([
      'onEventClick',
      'onSlotSelect',
      'onEventDrop',
      'onEventResize',
      'onNavigate',
      'onView',
      'onRangeChange',
    ])
    .describe('The callback prop to add'),
  projectDir: z
    .string()
    .optional()
    .describe('Absolute path to the project root. Defaults to cwd.'),
} as const

type AddHandlerArgs = {
  handler: SupportedHandler
  projectDir?: string | undefined
}

export type AddHandlerResult = { content: Array<{ type: 'text'; text: string }> }

function eventTypeName(frontmatter: BcMdFrontmatter): string {
  return Object.keys(frontmatter.accessors ?? {}).length > 0 ? 'CalendarEvent' : 'unknown'
}

function handlerSnippet(handler: SupportedHandler, frontmatter: BcMdFrontmatter): string {
  const T = eventTypeName(frontmatter)

  const snippets: Record<SupportedHandler, string> = {
    onEventClick: [
      `onEventClick={(event: ${T}) => {`,
      `  // 'event' is the original object from your events array.`,
      `  // Typical use: open a detail drawer or edit modal.`,
      `  console.log('clicked event', event)`,
      `}}`,
    ].join('\n'),

    onSlotSelect: [
      `onSlotSelect={({ start, end, allDay }) => {`,
      `  // 'start' and 'end' are ISO date strings for the selected range.`,
      `  // 'allDay' is true when the selection is in the month grid or all-day row.`,
      `  // Typical use: open a new-event creation modal with these bounds pre-filled.`,
      `  console.log('selected', start, end, allDay)`,
      `}}`,
    ].join('\n'),

    onEventDrop: [
      `onEventDrop={({ event, start, end, allDay }) => {`,
      `  // 'event' is the original event, 'start'/'end' are ISO strings for its new position.`,
      `  // The calendar is controlled — it does NOT mutate your events.`,
      `  // Optimistic pattern:`,
      `  //   1. Apply the new bounds to your events state`,
      `  //   2. Await your save; on failure, restore the previous state`,
      `  console.log('dropped', event, start, end, allDay)`,
      `}}`,
    ].join('\n'),

    onEventResize: [
      `onEventResize={({ event, start, end }) => {`,
      `  // 'event' is the original event, 'start'/'end' are ISO strings for its new bounds.`,
      `  // Same controlled pattern as onEventDrop — update your state and save.`,
      `  console.log('resized', event, start, end)`,
      `}}`,
    ].join('\n'),

    onNavigate: [
      `onNavigate={({ date, view }) => {`,
      `  // 'date' is the new focus date as an ISO string.`,
      `  // 'view' is the active view key: 'month' | 'week' | 'day' | 'agenda' etc.`,
      `  // Typical use: update the URL, fetch events for the new visible range.`,
      `  console.log('navigated to', date, 'in view', view)`,
      `}}`,
    ].join('\n'),

    onView: [
      `onView={({ view }) => {`,
      `  // 'view' is the newly active view key: 'month' | 'week' | 'day' | 'agenda' etc.`,
      `  // Typical use: persist the user's view preference, update the URL.`,
      `  console.log('switched to view', view)`,
      `}}`,
    ].join('\n'),

    onRangeChange: [
      `onRangeChange={({ range, view }) => {`,
      `  // 'range' is { start: string, end: string } — ISO strings for the visible window.`,
      `  // 'view' is the active view key.`,
      `  // Typical use: fetch events for the new range from your API.`,
      `  const { start, end } = range`,
      `  console.log('visible range changed', start, end, view)`,
      `  // e.g. fetchEvents({ start, end })`,
      `}}`,
    ].join('\n'),
  }

  return snippets[handler]
}

export async function handleAddHandler(args: AddHandlerArgs): Promise<AddHandlerResult> {
  const dir = args.projectDir ? resolve(args.projectDir) : process.cwd()
  const bcPath = findBcMd(dir)

  let frontmatter: BcMdFrontmatter = {}
  if (bcPath) {
    const bc = await readBcMd(bcPath)
    frontmatter = bc.frontmatter
  }

  const code = handlerSnippet(args.handler, frontmatter)

  return {
    content: [
      {
        type: 'text' as const,
        text: [
          `**${args.handler}** — ${HANDLER_DESCRIPTIONS[args.handler]}`,
          '',
          'Add this prop to your `<CalendarProvider>`:',
          '',
          '```tsx',
          code,
          '```',
          '',
          args.handler === 'onEventDrop' || args.handler === 'onEventResize'
            ? '> Requires DnD to be set up. Run `add-feature dnd` if you have not already.'
            : '',
        ]
          .filter((l) => l !== undefined)
          .join('\n'),
      },
    ],
  }
}

export function registerAddHandlerTool(server: McpServer): void {
  server.registerTool(
    'add-handler',
    {
      title: 'Add a Big Calendar event handler',
      description: `Generate the prop signature and inline documentation for a CalendarProvider callback.

Supported handlers:
- onEventClick    Fired when an event is clicked
- onSlotSelect    Fired when the user finishes selecting a slot range
- onEventDrop     Fired after a drag-to-move (requires DnD)
- onEventResize   Fired after a drag-to-resize (requires DnD)
- onNavigate      Fired when the focus date changes
- onView          Fired when the active view changes
- onRangeChange   Fired when the visible date range changes

Reads bc.md for event type info so the snippet uses the correct type name.`,
      inputSchema: AddHandlerInputSchema,
    },
    handleAddHandler,
  )
}

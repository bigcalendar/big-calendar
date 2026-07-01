import { resolve } from 'node:path'
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { findBcMd, readBcMd } from '../memory/reader.js'
import { updateBcMd } from '../memory/writer.js'
import type { BcMdFrontmatter } from '../memory/schema.js'

export type SupportedFeature = 'dnd' | 'selection' | 'resources'

const FEATURE_DESCRIPTIONS: Record<SupportedFeature, string> = {
  dnd: 'Drag-and-drop event move and resize using @big-calendar/dnd',
  selection: 'Slot selection (click/drag empty cells to create new events)',
  resources: 'Resource (multi-column) calendar layout',
}

export const AddFeatureInputSchema = {
  feature: z
    .enum(['dnd', 'selection', 'resources'])
    .describe('The feature to add: dnd | selection | resources'),
  projectDir: z
    .string()
    .optional()
    .describe('Absolute path to the project root. Defaults to cwd.'),
} as const

type AddFeatureArgs = {
  feature: SupportedFeature
  projectDir?: string | undefined
}

export type AddFeatureResult = { content: Array<{ type: 'text'; text: string }> }

function snippetDnd(frontmatter: BcMdFrontmatter): string {
  const eventType = Object.keys(frontmatter.accessors ?? {}).length > 0 ? 'CalendarEvent' : 'unknown'
  return [
    `// 1. Install the DnD controller`,
    `//    pnpm add @big-calendar/dnd`,
    ``,
    `// 2. Add these imports`,
    `import { useRef } from 'react'`,
    `import { useCalendarDnd } from '@big-calendar/react'`,
    ``,
    `// 3. Create an inner component that runs useCalendarDnd inside the provider`,
    `function CalendarWithDnd() {`,
    `  const containerRef = useRef<HTMLDivElement>(null)`,
    `  useCalendarDnd<${eventType}>(containerRef)`,
    `  return (`,
    `    <div ref={containerRef}>`,
    `      <Calendar />`,
    `    </div>`,
    `  )`,
    `}`,
    ``,
    `// 4. Use it inside <CalendarProvider> with the drop callbacks`,
    `<CalendarProvider`,
    `  {/* ...existing props... */}`,
    `  onEventDrop={({ event, start, end, allDay }) => {`,
    `    // Optimistic update pattern:`,
    `    // 1. Apply the new bounds to your events state`,
    `    // 2. Await your save; on failure, restore the previous state`,
    `    console.log('dropped', event, start, end, allDay)`,
    `  }}`,
    `  onEventResize={({ event, start, end }) => {`,
    `    console.log('resized', event, start, end)`,
    `  }}`,
    `>`,
    `  <CalendarWithDnd />`,
    `</CalendarProvider>`,
  ].join('\n')
}

function snippetSelection(): string {
  return [
    `// 1. Add the slot-select callbacks to <CalendarProvider>`,
    `<CalendarProvider`,
    `  {/* ...existing props... */}`,
    `  onSlotSelect={({ start, end, allDay }) => {`,
    `    // Called when the user finishes selecting a slot range.`,
    `    // 'start' and 'end' are ISO date strings.`,
    `    // 'allDay' is true when the selection is in the month grid or all-day row.`,
    `    console.log('selected slot', start, end, allDay)`,
    `    // Typically: open an event-creation modal pre-filled with these bounds.`,
    `  }}`,
    `  onSlotSelecting={({ start, end, allDay }) => {`,
    `    // Optional: fires while the user is dragging (live feedback).`,
    `    // Return false to cancel the selection.`,
    `    return true`,
    `  }}`,
    `  onSlotClick={({ date, allDay }) => {`,
    `    // Optional: fires on a single-slot click.`,
    `    console.log('clicked', date, allDay)`,
    `  }}`,
    `>`,
    `  <Calendar />`,
    `</CalendarProvider>`,
  ].join('\n')
}

function snippetResources(frontmatter: BcMdFrontmatter): string {
  const resourceId = frontmatter.accessors?.resourceId ?? 'id'
  const resourceTitle = frontmatter.accessors?.resourceTitle ?? 'title'
  const resourceEvent = frontmatter.accessors?.resource ?? 'resourceId'

  return [
    `// 1. Define your resources array`,
    `const resources = [`,
    `  { ${resourceId}: 'room-a', ${resourceTitle}: 'Room A' },`,
    `  { ${resourceId}: 'room-b', ${resourceTitle}: 'Room B' },`,
    `]`,
    ``,
    `// 2. Add the resources props to <CalendarProvider>`,
    `<CalendarProvider`,
    `  {/* ...existing props... */}`,
    `  resources={resources}`,
    `  accessors={{`,
    `    {/* ...existing accessors... */}`,
    `    resourceId: '${resourceId}',     // field on your resource object`,
    `    resourceTitle: '${resourceTitle}', // display name on your resource object`,
    `    resource: '${resourceEvent}',  // field on your event linking it to a resource id`,
    `  }}`,
    `  {/* Resource layout only applies to day/week/work_week views */}`,
    `  view="day"`,
    `  enabledViews={['day', 'week', 'work_week']}`,
    `>`,
    `  <Calendar />`,
    `</CalendarProvider>`,
  ].join('\n')
}

export async function handleAddFeature(args: AddFeatureArgs): Promise<AddFeatureResult> {
  const dir = args.projectDir ? resolve(args.projectDir) : process.cwd()
  const bcPath = findBcMd(dir)

  let frontmatter: BcMdFrontmatter = {}
  if (bcPath) {
    const bc = await readBcMd(bcPath)
    frontmatter = bc.frontmatter
  }

  const snippets: Record<SupportedFeature, () => string> = {
    dnd: () => snippetDnd(frontmatter),
    selection: () => snippetSelection(),
    resources: () => snippetResources(frontmatter),
  }

  const code = snippets[args.feature]()

  // Update bc.md features list if it exists
  if (bcPath) {
    const existingFeatures = frontmatter.features ?? []
    if (!existingFeatures.includes(args.feature)) {
      await updateBcMd(bcPath, { features: [...existingFeatures, args.feature] })
    }
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: [
          `**Feature: ${args.feature}** — ${FEATURE_DESCRIPTIONS[args.feature]}`,
          bcPath ? `bc.md updated to include "${args.feature}" in features.` : '',
          '',
          '```tsx',
          code,
          '```',
        ]
          .filter((l) => l !== undefined)
          .join('\n'),
      },
    ],
  }
}

export function registerAddFeatureTool(server: McpServer): void {
  server.registerTool(
    'add-feature',
    {
      title: 'Add a Big Calendar feature',
      description: `Generate a code snippet for adding a specific feature to your Big Calendar setup.

Supported features:
- dnd       Drag-and-drop event move/resize (requires @big-calendar/dnd)
- selection  Slot selection — click or drag empty cells to create new events
- resources  Multi-column resource calendar (meeting rooms, team members, etc.)

Reads bc.md for accessor field names so the snippet matches your event shape.
Also updates the features list in bc.md when a bc.md file is present.`,
      inputSchema: AddFeatureInputSchema,
    },
    handleAddFeature,
  )
}

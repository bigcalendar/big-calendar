import { resolve } from 'node:path'
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { findBcMd, readBcMd } from '../memory/reader.js'
import type { BcMdFrontmatter, AccessorsMap } from '../memory/schema.js'

export const ScaffoldCalendarInputSchema = {
  projectDir: z
    .string()
    .optional()
    .describe('Absolute path to the project root. Defaults to cwd.'),
  componentName: z
    .string()
    .optional()
    .describe('Name of the generated component. Defaults to "MyCalendar".'),
} as const

type ScaffoldCalendarArgs = {
  projectDir?: string | undefined
  componentName?: string | undefined
}

export type ScaffoldCalendarResult = { content: Array<{ type: 'text'; text: string }> }

function buildEventInterface(accessors: AccessorsMap | undefined): string {
  if (!accessors || Object.keys(accessors).length === 0) return ''

  const fields: string[] = []
  if (accessors.id) fields.push(`  ${accessors.id}: string | number`)
  if (accessors.title) fields.push(`  ${accessors.title}: string`)
  if (accessors.start) fields.push(`  ${accessors.start}: string`)
  if (accessors.end) fields.push(`  ${accessors.end}: string`)
  if (accessors.allDay) fields.push(`  ${accessors.allDay}?: boolean`)
  if (accessors.type) fields.push(`  ${accessors.type}?: string`)

  if (fields.length === 0) return ''
  return `\ninterface CalendarEvent {\n${fields.join('\n')}\n}\n`
}

function buildAccessorsProp(accessors: AccessorsMap | undefined, indent = '      '): string {
  if (!accessors || Object.keys(accessors).length === 0) {
    return `${indent}// accessors={{ id: 'id', title: 'title', start: 'start', end: 'end' }}`
  }

  const lines = Object.entries(accessors)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${indent}  ${k}: '${v}',`)

  return `${indent}accessors={{\n${lines.join('\n')}\n${indent}}}`
}

function buildTemplate(
  frontmatter: BcMdFrontmatter,
  componentName: string,
  hasDnd: boolean,
): string {
  const views = frontmatter.views ?? ['month', 'week', 'day', 'agenda']
  const eventInterface = buildEventInterface(frontmatter.accessors)
  const genericArg = eventInterface ? '<CalendarEvent>' : ''
  const eventType = eventInterface ? 'CalendarEvent' : 'unknown'
  const accessorsProp = buildAccessorsProp(frontmatter.accessors)

  const dndImport = hasDnd
    ? `\nimport { useRef } from 'react'\nimport { useCalendarDnd } from '@big-calendar/react'`
    : ''

  const dndHook = hasDnd
    ? `\n  const containerRef = useRef<HTMLDivElement>(null)\n  useCalendarDnd(containerRef)\n`
    : ''

  const calendarWrap = hasDnd
    ? `    <div ref={containerRef}>\n        <Calendar />\n      </div>`
    : `    <Calendar />`

  const dndProps = hasDnd
    ? `\n      onEventDrop={({ event, start, end, allDay }) => {\n        // Apply the proposed new bounds to your events state.\n        // The calendar is controlled and never mutates events itself.\n        console.log('moved', event, start, end, allDay)\n      }}`
    : ''

  return [
    `import { createTemporalLocalizer } from '@big-calendar/localizer-temporal'`,
    `import { CalendarProvider, Calendar } from '@big-calendar/react'`,
    dndImport,
    eventInterface,
    `const localizer = await createTemporalLocalizer()`,
    ``,
    `// Replace with your actual events (e.g., from React state or a data-fetching hook)`,
    `const events: ${eventType}[] = []`,
    ``,
    hasDnd
      ? [
          `function CalendarWithDnd() {`,
          dndHook,
          `  return (`,
          `    ${calendarWrap}`,
          `  )`,
          `}`,
          ``,
        ].join('\n')
      : '',
    `export function ${componentName}() {`,
    `  return (`,
    `    <CalendarProvider${genericArg}`,
    `      localizer={localizer}`,
    `      events={events}`,
    accessorsProp,
    `      view="${views[0] ?? 'month'}"`,
    `      enabledViews={${JSON.stringify(views)}}`,
    dndProps,
    `    >`,
    `      ${hasDnd ? `<CalendarWithDnd />` : `<Calendar />`}`,
    `    </CalendarProvider>`,
    `  )`,
    `}`,
  ]
    .filter((l) => l !== '')
    .join('\n')
}

export async function handleScaffoldCalendar(
  args: ScaffoldCalendarArgs,
): Promise<ScaffoldCalendarResult> {
  const dir = args.projectDir ? resolve(args.projectDir) : process.cwd()
  const componentName = args.componentName ?? 'MyCalendar'
  const bcPath = findBcMd(dir)

  let frontmatter: BcMdFrontmatter = {}
  if (bcPath) {
    const bc = await readBcMd(bcPath)
    frontmatter = bc.frontmatter
  }

  const hasDnd = frontmatter.features?.includes('dnd') ?? false
  const code = buildTemplate(frontmatter, componentName, hasDnd)

  const header = bcPath
    ? `Generated from bc.md at ${bcPath}`
    : 'No bc.md found — run the `init` tool first for a fully customized scaffold'

  return {
    content: [
      {
        type: 'text' as const,
        text: [
          header,
          '',
          '```tsx',
          code,
          '```',
          '',
          hasDnd
            ? '> DnD is enabled. `useCalendarDnd` must be called inside a component rendered under `<CalendarProvider>`.'
            : '',
        ]
          .filter((l) => l !== undefined)
          .join('\n'),
      },
    ],
  }
}

export function registerScaffoldCalendarTool(server: McpServer): void {
  server.registerTool(
    'scaffold-calendar',
    {
      title: 'Scaffold a Big Calendar component',
      description: `Generate a starter Calendar.tsx component using @big-calendar/react.

Reads bc.md to tailor the output: accessor field names, enabled views, and features (DnD etc.).
If no bc.md exists, returns a generic template and reminds you to run the init tool.

Returns a ready-to-paste TSX file. Add it to your project as a starting point.`,
      inputSchema: ScaffoldCalendarInputSchema,
    },
    handleScaffoldCalendar,
  )
}

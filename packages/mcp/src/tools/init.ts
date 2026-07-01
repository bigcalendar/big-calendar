import { join, resolve } from 'node:path'
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { findBcMd, readBcMd } from '../memory/reader.js'
import { writeBcMd } from '../memory/writer.js'
import { BC_MD_FILENAME } from '../memory/schema.js'

export const InitInputSchema = {
  projectDir: z
    .string()
    .optional()
    .describe('Absolute path to the project root. Defaults to cwd.'),
  version: z
    .string()
    .optional()
    .describe('Semver of @big-calendar/react in use, e.g. "1.20.0"'),
  views: z
    .array(z.string())
    .optional()
    .describe('Enabled calendar views, e.g. ["month", "week", "day", "agenda"]'),
  features: z
    .array(z.string())
    .optional()
    .describe('Enabled feature flags, e.g. ["dnd", "selection", "resources"]'),
  idField: z.string().optional().describe('Event field for the event id, e.g. "id"'),
  titleField: z
    .string()
    .optional()
    .describe('Event field for the display title, e.g. "name"'),
  startField: z
    .string()
    .optional()
    .describe('Event field for the start timestamp, e.g. "startDate"'),
  endField: z
    .string()
    .optional()
    .describe('Event field for the end timestamp, e.g. "endDate"'),
  allDayField: z
    .string()
    .optional()
    .describe('Event field for the all-day flag, e.g. "isAllDay"'),
  resourceIdField: z
    .string()
    .optional()
    .describe('Resource field for the resource id, e.g. "resourceId"'),
  resourceTitleField: z
    .string()
    .optional()
    .describe('Resource field for the display title, e.g. "label"'),
  context: z
    .string()
    .optional()
    .describe(
      'Free-form prose: modal library used, data-fetching approach, implemented patterns.',
    ),
} as const

type InitArgs = {
  projectDir?: string | undefined
  version?: string | undefined
  views?: string[] | undefined
  features?: string[] | undefined
  idField?: string | undefined
  titleField?: string | undefined
  startField?: string | undefined
  endField?: string | undefined
  allDayField?: string | undefined
  resourceIdField?: string | undefined
  resourceTitleField?: string | undefined
  context?: string | undefined
}

export type InitResult = { content: Array<{ type: 'text'; text: string }> }

export async function handleInit(args: InitArgs): Promise<InitResult> {
  const dir = args.projectDir ? resolve(args.projectDir) : process.cwd()

  const hasContentArgs =
    args.version ??
    args.views ??
    args.features ??
    args.idField ??
    args.titleField ??
    args.startField ??
    args.endField ??
    args.allDayField ??
    args.resourceIdField ??
    args.resourceTitleField ??
    args.context

  if (hasContentArgs === undefined) {
    // Status-check mode: no content args provided
    const existing = findBcMd(dir)
    if (existing) {
      const bc = await readBcMd(existing)
      return {
        content: [
          {
            type: 'text' as const,
            text: [
              `bc.md found at: ${existing}`,
              '',
              '**Current frontmatter:**',
              JSON.stringify(bc.frontmatter, null, 2),
              '',
              bc.content
                ? `**Context:**\n${bc.content}`
                : '**Context:** (empty — consider adding app-specific notes)',
              '',
              'Call init again with updated fields to overwrite.',
            ].join('\n'),
          },
        ],
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: [
            `No bc.md found in or above: ${dir}`,
            '',
            'To set up Big Calendar MCP integration, ask the developer for:',
            '  1. @big-calendar/react version (check package.json)',
            '  2. Enabled views: month | week | work_week | day | agenda',
            '  3. Enabled features: dnd | selection | resources',
            '  4. Event field names: id, title, start, end, allDay',
            '  5. App context: event-editing modal, data-fetching approach, etc.',
            '',
            'Then call init with those values to create bc.md.',
          ].join('\n'),
        },
      ],
    }
  }

  // Write mode: one or more content fields provided
  const accessors: Record<string, string> = {}
  if (args.idField !== undefined) accessors['id'] = args.idField
  if (args.titleField !== undefined) accessors['title'] = args.titleField
  if (args.startField !== undefined) accessors['start'] = args.startField
  if (args.endField !== undefined) accessors['end'] = args.endField
  if (args.allDayField !== undefined) accessors['allDay'] = args.allDayField
  if (args.resourceIdField !== undefined) accessors['resourceId'] = args.resourceIdField
  if (args.resourceTitleField !== undefined) accessors['resourceTitle'] = args.resourceTitleField

  const frontmatter = {
    ...(args.version !== undefined && { version: args.version }),
    ...(args.views !== undefined && { views: args.views }),
    ...(args.features !== undefined && { features: args.features }),
    ...(Object.keys(accessors).length > 0 && { accessors }),
  }

  const bcPath = join(dir, BC_MD_FILENAME)
  await writeBcMd(bcPath, frontmatter, args.context ?? '')

  return {
    content: [
      {
        type: 'text' as const,
        text: [
          `bc.md written to: ${bcPath}`,
          '',
          '**Frontmatter:**',
          JSON.stringify(frontmatter, null, 2),
          '',
          args.context ? `**Context:**\n${args.context}` : '**Context:** (empty)',
        ].join('\n'),
      },
    ],
  }
}

export function registerInitTool(server: McpServer): void {
  server.registerTool(
    'init',
    {
      title: 'Initialize Big Calendar project memory',
      description: `Initialize or inspect the bc.md project memory file for this Big Calendar integration.

Call with no content arguments to check whether bc.md exists and see its current state.
Call with arguments to create or overwrite bc.md.

Before calling with arguments, ask the developer:
1. Which @big-calendar/react version they are using (check their package.json)
2. Which views to enable: month, week, work_week, day, agenda
3. Which features to enable: dnd, selection, resources
4. How their event objects are shaped (field names for title, start, end, id, allDay, etc.)
5. App context: modal library for event editing, data-fetching approach, any patterns already implemented`,
      inputSchema: InitInputSchema,
    },
    handleInit,
  )
}

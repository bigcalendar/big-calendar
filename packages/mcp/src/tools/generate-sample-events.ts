import { resolve } from 'node:path'
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { findBcMd, readBcMd } from '../memory/reader.js'
import type { BcMdFrontmatter, AccessorsMap } from '../memory/schema.js'

export const GenerateSampleEventsInputSchema = {
  projectDir: z
    .string()
    .optional()
    .describe('Absolute path to the project root. Defaults to cwd.'),
  count: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .describe('Number of sample events to generate. Defaults to 5.'),
  baseDate: z
    .string()
    .optional()
    .describe(
      'ISO date string to anchor generated event dates, e.g. "2026-06-25". Defaults to today.',
    ),
} as const

type GenerateSampleEventsArgs = {
  projectDir?: string | undefined
  count?: number | undefined
  baseDate?: string | undefined
}

export type GenerateSampleEventsResult = { content: Array<{ type: 'text'; text: string }> }

const SAMPLE_TITLES = [
  'Team Standup',
  'Product Review',
  'Customer Call',
  'Sprint Planning',
  'Design Sync',
  'Backlog Grooming',
  'One-on-One',
  'All Hands',
  'Code Review',
  'Architecture Discussion',
  'Retrospective',
  'Demo Session',
  'Stakeholder Update',
  'Training Session',
  'Strategy Meeting',
  'Q&A Session',
  'Launch Planning',
  'Budget Review',
  'Hiring Interview',
  'Offsite Workshop',
]

function toIso(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '')
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

interface SampleEvent {
  id: number
  [key: string]: unknown
}

function buildSampleEvent(
  index: number,
  accessors: AccessorsMap,
  baseDate: Date,
  frontmatter: BcMdFrontmatter,
): SampleEvent {
  const dayOffset = Math.floor(index / 3)
  const hourStart = 9 + (index % 3) * 3
  const startDate = addDays(baseDate, dayOffset)
  startDate.setHours(hourStart, 0, 0, 0)
  const endDate = new Date(startDate)
  endDate.setHours(hourStart + 1, 0, 0, 0)

  const titleKey = accessors.title ?? 'title'
  const startKey = accessors.start ?? 'start'
  const endKey = accessors.end ?? 'end'
  const idKey = accessors.id ?? 'id'
  const allDayKey = accessors.allDay
  const typeKey = accessors.type
  const resourceKey = accessors.resource

  const event: SampleEvent = { id: index + 1 }

  if (idKey !== 'id') event[idKey] = index + 1
  event[titleKey] = SAMPLE_TITLES[index % SAMPLE_TITLES.length] ?? `Event ${index + 1}`
  event[startKey] = toIso(startDate)
  event[endKey] = toIso(endDate)

  if (allDayKey) event[allDayKey] = false
  if (typeKey) event[typeKey] = index % 2 === 0 ? 'meeting' : 'task'

  const resources = frontmatter.accessors?.resourceId
    ? [`r1`, `r2`]
    : []
  if (resourceKey && resources.length > 0) {
    event[resourceKey] = resources[index % resources.length]
  }

  return event
}

export async function handleGenerateSampleEvents(
  args: GenerateSampleEventsArgs,
): Promise<GenerateSampleEventsResult> {
  const dir = args.projectDir ? resolve(args.projectDir) : process.cwd()
  const count = args.count ?? 5
  const baseDate = args.baseDate ? new Date(args.baseDate) : new Date()
  baseDate.setHours(0, 0, 0, 0)

  const bcPath = findBcMd(dir)
  let frontmatter: BcMdFrontmatter = {}
  if (bcPath) {
    const bc = await readBcMd(bcPath)
    frontmatter = bc.frontmatter
  }

  const accessors = frontmatter.accessors ?? {}
  const events = Array.from({ length: count }, (_, i) =>
    buildSampleEvent(i, accessors, baseDate, frontmatter),
  )

  const idKey = accessors.id ?? 'id'
  const titleKey = accessors.title ?? 'title'
  const startKey = accessors.start ?? 'start'
  const endKey = accessors.end ?? 'end'

  const interfaceFields = [
    `  ${idKey}: number`,
    `  ${titleKey}: string`,
    `  ${startKey}: string`,
    `  ${endKey}: string`,
    accessors.allDay ? `  ${accessors.allDay}: boolean` : '',
    accessors.type ? `  ${accessors.type}?: string` : '',
    accessors.resource ? `  ${accessors.resource}?: string` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const intro = bcPath
    ? `Generated using accessor mappings from bc.md.`
    : 'No bc.md found — using default field names. Run `init` for customized output.'

  return {
    content: [
      {
        type: 'text' as const,
        text: [
          intro,
          '',
          '```typescript',
          `interface SampleEvent {\n${interfaceFields}\n}`,
          '',
          `const sampleEvents: SampleEvent[] = ${JSON.stringify(events, null, 2)}`,
          '```',
        ].join('\n'),
      },
    ],
  }
}

export function registerGenerateSampleEventsTool(server: McpServer): void {
  server.registerTool(
    'generate-sample-events',
    {
      title: 'Generate sample Big Calendar events',
      description: `Generate a TypeScript array of sample event objects shaped to match your accessor mapping in bc.md.

Useful for getting the calendar rendering before real data is connected from your API.
The generated array uses your field names (e.g. 'name', 'startDate', 'endDate') exactly as mapped in bc.md.

If no bc.md is found, uses the default Big Calendar field names (title, start, end).`,
      inputSchema: GenerateSampleEventsInputSchema,
    },
    handleGenerateSampleEvents,
  )
}

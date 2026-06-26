import { join, resolve } from 'node:path'
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { findBcMd, readBcMd } from '../memory/reader.js'
import { updateBcMd } from '../memory/writer.js'
import { BC_MD_FILENAME } from '../memory/schema.js'

export const UpdateMemoryInputSchema = {
  projectDir: z
    .string()
    .optional()
    .describe('Absolute path to the project root. Defaults to cwd.'),
  version: z.string().optional().describe('Semver of @big-calendar/react in use'),
  views: z.array(z.string()).optional().describe('Replace the enabled views list'),
  features: z.array(z.string()).optional().describe('Replace the features list'),
  idField: z.string().optional().describe('Update the event id accessor field name'),
  titleField: z.string().optional().describe('Update the event title accessor field name'),
  startField: z.string().optional().describe('Update the event start accessor field name'),
  endField: z.string().optional().describe('Update the event end accessor field name'),
  allDayField: z.string().optional().describe('Update the event allDay accessor field name'),
  resourceIdField: z.string().optional().describe('Update the resource id accessor field name'),
  resourceTitleField: z
    .string()
    .optional()
    .describe('Update the resource title accessor field name'),
  context: z.string().optional().describe('Replace the entire prose body of bc.md'),
  appendContext: z.string().optional().describe('Append text to the existing prose body'),
} as const

type UpdateMemoryArgs = {
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
  appendContext?: string | undefined
}

export type UpdateMemoryResult = { content: Array<{ type: 'text'; text: string }> }

export async function handleUpdateMemory(args: UpdateMemoryArgs): Promise<UpdateMemoryResult> {
  const dir = args.projectDir ? resolve(args.projectDir) : process.cwd()
  const bcPath = findBcMd(dir) ?? join(dir, BC_MD_FILENAME)

  const accessorPatch: Record<string, string> = {}
  if (args.idField !== undefined) accessorPatch['id'] = args.idField
  if (args.titleField !== undefined) accessorPatch['title'] = args.titleField
  if (args.startField !== undefined) accessorPatch['start'] = args.startField
  if (args.endField !== undefined) accessorPatch['end'] = args.endField
  if (args.allDayField !== undefined) accessorPatch['allDay'] = args.allDayField
  if (args.resourceIdField !== undefined) accessorPatch['resourceId'] = args.resourceIdField
  if (args.resourceTitleField !== undefined) accessorPatch['resourceTitle'] = args.resourceTitleField

  const frontmatterPatch = {
    ...(args.version !== undefined && { version: args.version }),
    ...(args.views !== undefined && { views: args.views }),
    ...(args.features !== undefined && { features: args.features }),
    ...(Object.keys(accessorPatch).length > 0 && { accessors: accessorPatch }),
  }

  let contentPatch: string | undefined
  if (args.context !== undefined) {
    contentPatch = args.context
  } else if (args.appendContext !== undefined) {
    const existing = await readBcMd(bcPath).catch(() => ({ frontmatter: {}, content: '' }))
    contentPatch = existing.content
      ? `${existing.content}\n\n${args.appendContext}`
      : args.appendContext
  }

  await updateBcMd(bcPath, frontmatterPatch, contentPatch)

  const updated = await readBcMd(bcPath)

  return {
    content: [
      {
        type: 'text' as const,
        text: [
          `bc.md updated at: ${bcPath}`,
          '',
          '**Updated frontmatter:**',
          JSON.stringify(updated.frontmatter, null, 2),
          '',
          updated.content
            ? `**Context:**\n${updated.content}`
            : '**Context:** (empty)',
        ].join('\n'),
      },
    ],
  }
}

export function registerUpdateMemoryTool(server: McpServer): void {
  server.registerTool(
    'update-memory',
    {
      title: 'Update Big Calendar project memory (bc.md)',
      description: `Update specific fields in bc.md without overwriting the whole file.

Use this whenever the developer:
- Upgrades to a new Big Calendar version
- Adds or removes calendar views or features
- Changes their event data shape (field renames, new fields)
- Wants to add notes about their app's implementation approach

Only the fields you provide will be changed; everything else is preserved.
Use appendContext to add notes to the existing prose body rather than replace it.`,
      inputSchema: UpdateMemoryInputSchema,
    },
    handleUpdateMemory,
  )
}

import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export function registerAddFeaturePrompt(server: McpServer): void {
  server.registerPrompt(
    'add-feature',
    {
      title: 'Add a Big Calendar feature',
      description: 'Generate a code snippet for a specific feature (dnd, selection, resources) and integrate it.',
      argsSchema: {
        feature: z
          .enum(['dnd', 'selection', 'resources'])
          .optional()
          .describe('The feature to add. If omitted, the assistant will ask.'),
      },
    },
    ({ feature }) => {
      const featureClause = feature
        ? `I want to add the **${feature}** feature to my Big Calendar setup.`
        : 'I want to add a feature to my Big Calendar setup. Ask me which one: dnd (drag-and-drop), selection (slot selection for creating events), or resources (multi-column resource view).'

      return {
        description: `Add ${feature ?? 'a feature'} to Big Calendar`,
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: [
                featureClause,
                '',
                'Please:',
                `1. Call \`add-feature\`${feature ? ` with feature="${feature}"` : ''} to get the integration code.`,
                '2. Show me the generated snippet and explain each part.',
                '3. Tell me where in my existing Calendar component I need to make changes.',
                '4. If bc.md needs updating (e.g., DnD now requires @big-calendar/dnd to be installed), mention that.',
              ].join('\n'),
            },
          },
        ],
      }
    },
  )
}

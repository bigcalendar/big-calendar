import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export function registerBootstrapCalendarPrompt(server: McpServer): void {
  server.registerPrompt(
    'bootstrap-calendar',
    {
      title: 'Bootstrap a Big Calendar integration',
      description: `Full onboarding flow: check project memory, collect configuration from the developer,
then generate a starter Calendar component. Run this when starting a new Big Calendar integration.`,
    },
    () => ({
      description: 'Full Big Calendar bootstrap — init + scaffold in one flow',
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: [
              'I want to integrate Big Calendar into my React project.',
              '',
              'Please guide me through the setup:',
              '1. Run the `init` tool with no arguments to check if bc.md already exists.',
              '2. If bc.md does not exist, ask me for the following information:',
              '   - Which @big-calendar/react version I am using (check my package.json if you can)',
              '   - Which views I want to enable (month, week, work_week, day, agenda)',
              '   - Which features I need (dnd, selection, resources)',
              '   - My event object shape — what field names I use for id, title, start date, end date, and allDay',
              '   - Any app context I want to capture: modal library, data-fetching approach, etc.',
              '3. Call `init` with the collected information to create bc.md.',
              '4. Call `scaffold-calendar` to generate a starter Calendar component tailored to my configuration.',
              '5. Show me the generated component and explain any next steps (installing DnD, adding handlers, etc.).',
            ].join('\n'),
          },
        },
      ],
    }),
  )
}

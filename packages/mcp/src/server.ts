import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerInitTool } from './tools/init.js'
import { registerScaffoldCalendarTool } from './tools/scaffold-calendar.js'
import { registerAddFeatureTool } from './tools/add-feature.js'
import { registerAddHandlerTool } from './tools/add-handler.js'
import { registerGenerateSampleEventsTool } from './tools/generate-sample-events.js'
import { registerUpdateMemoryTool } from './tools/update-memory.js'
import { registerResources } from './resources/index.js'
import { registerBootstrapCalendarPrompt } from './prompts/bootstrap-calendar.js'
import { registerAddFeaturePrompt } from './prompts/add-feature.js'

const SERVER_NAME = '@big-calendar/mcp'
const SERVER_VERSION = '0.0.0'

export function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  })

  registerInitTool(server)
  registerScaffoldCalendarTool(server)
  registerAddFeatureTool(server)
  registerAddHandlerTool(server)
  registerGenerateSampleEventsTool(server)
  registerUpdateMemoryTool(server)
  registerResources(server)
  registerBootstrapCalendarPrompt(server)
  registerAddFeaturePrompt(server)

  return server
}

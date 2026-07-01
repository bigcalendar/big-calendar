import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer } from './server.js'
import { findBcMd } from './memory/reader.js'

async function main() {
  const bcPath = findBcMd(process.cwd())
  if (!bcPath) {
    process.stderr.write(
      '[big-calendar/mcp] No bc.md found. Run the "init" tool to set up project memory.\n',
    )
  }

  const server = createServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})

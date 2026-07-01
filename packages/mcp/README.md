# @big-calendar/mcp

An MCP (Model Context Protocol) server for [Big Calendar](https://github.com/bigcalendar/big-calendar).

Gives AI coding assistants (Claude Code, Cursor, VS Code Copilot, JetBrains AI, etc.) direct
knowledge of the Big Calendar API and your project's calendar configuration — so they can
scaffold components, add features, generate sample data, and answer integration questions
without hallucinating API details.

## Installation

```bash
pnpm add --save-dev @big-calendar/mcp
```

> **Version lock.** Install the same version as your `@big-calendar/react` to ensure the
> API reference matches.

---

## Client setup

### Claude Code

Add to `.claude/mcp.json` in your project root (create it if it doesn't exist):

```json
{
  "mcpServers": {
    "big-calendar": {
      "type": "stdio",
      "command": "node",
      "args": ["./node_modules/@big-calendar/mcp/dist/cli.js"]
    }
  }
}
```

Then restart Claude Code or run `/mcp` to pick up the server.

### Cursor

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "big-calendar": {
      "command": "node",
      "args": ["./node_modules/@big-calendar/mcp/dist/cli.js"]
    }
  }
}
```

### VS Code (GitHub Copilot / Continue)

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "big-calendar": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/node_modules/@big-calendar/mcp/dist/cli.js"]
    }
  }
}
```

### JetBrains (AI Assistant)

In **Settings → Tools → AI Assistant → Model Context Protocol**:

1. Click **+** → **Add MCP Server**
2. Set **Command**: `node`
3. Set **Arguments**: `./node_modules/@big-calendar/mcp/dist/cli.js`

Or add to `.idea/mcp.json`:

```json
{
  "servers": [
    {
      "name": "big-calendar",
      "command": "node ./node_modules/@big-calendar/mcp/dist/cli.js"
    }
  ]
}
```

### Any other stdio-compatible client

```json
{
  "command": "node",
  "args": ["./node_modules/@big-calendar/mcp/dist/cli.js"]
}
```

Or with npx (without local install):

```json
{
  "command": "npx",
  "args": ["-y", "@big-calendar/mcp"]
}
```

---

## First run — `bootstrap-calendar` prompt

After connecting, use the **bootstrap-calendar** prompt to get started:

In Claude Code:
```
/prompt bootstrap-calendar
```

This runs the full onboarding flow:
1. Checks if `bc.md` already exists in your project
2. Asks for your event field names, enabled views, and features
3. Creates `bc.md` in your project root
4. Generates a starter `Calendar` component tailored to your data shape

---

## Available tools

| Tool | What it does |
|------|-------------|
| `init` | Initialize or inspect `bc.md` — the project memory file |
| `scaffold-calendar` | Generate a starter `Calendar.tsx` component |
| `add-feature` | Get code for adding DnD, slot selection, or resource views |
| `add-handler` | Get the prop signature for any CalendarProvider callback |
| `generate-sample-events` | Generate sample events shaped to your accessor mapping |
| `update-memory` | Update specific fields in `bc.md` without overwriting it |

---

## Available resources (API reference and recipes)

| URI | Description |
|-----|-------------|
| `bc://api/calendar-provider` | CalendarProvider props reference |
| `bc://api/accessors` | How to map event field names to BC accessor keys |
| `bc://api/views` | Built-in views (month, week, work_week, day, agenda) |
| `bc://api/dnd` | Drag-and-drop setup guide |
| `bc://api/localizers` | LuxonLocalizer and TemporalLocalizer options |
| `bc://recipes/basic-setup` | Minimal working calendar integration |
| `bc://recipes/event-editing` | Open an edit modal on event click |
| `bc://recipes/create-event` | Create events from slot selection |
| `bc://recipes/data-fetching` | Fetch events on visible range change |
| `bc://recipes/custom-event` | Custom event block component |

---

## The `bc.md` memory file

The server uses a `bc.md` file at your project root to remember your calendar configuration
across sessions. It follows the same `CLAUDE.md` pattern you may already be using.

Run `init` to create it, or copy `bc.md.example` and fill it in manually.

See [bc.md.example](./bc.md.example) for a fully annotated example.

---

## License

MIT

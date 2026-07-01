# @big-calendar/codemods

A command-line tool that automatically updates your code when migrating from `react-big-calendar` to Big Calendar.

Big Calendar is the next generation of `react-big-calendar`, and the two packages have different APIs. Updating your code by hand across a whole project would take a long time and be easy to get wrong. This tool reads your source files, finds the patterns that changed, and rewrites them for you.

---

## What it changes

| Transform | What it does |
|---|---|
| `rename-imports` | Updates import paths from `react-big-calendar` to `@big-calendar/react` |
| `merge-accessors` | Combines `titleAccessor`, `startAccessor`, `endAccessor` into the unified `accessors` prop |
| `rename-callbacks` | Renames event callbacks to match the new naming convention (e.g. `onSelectEvent` → `onEventClick`) |
| `rename-props` | Renames props that changed names between versions |
| `flag-removed-props` | Adds a comment wherever a removed prop is used, so you know what to address manually |
| `views-prop` | Converts the `views` array format to the new string-based format |
| `wrap-provider` | Wraps your `<Calendar>` component in the required `<CalendarProvider>` |

---

## Usage

Run the codemods against your source directory:

```bash
npx @big-calendar/codemods ./src
```

Or target a specific file:

```bash
npx @big-calendar/codemods ./src/components/MyCalendar.jsx
```

The tool will print a summary of what it changed. Review the changes in your editor before committing.

---

## Tips

- Run the codemods on a clean branch so you can review the diff clearly.
- The codemods handle the mechanical changes, but they can't make every decision for you. Props flagged as removed will need manual attention — check the migration guide for what to replace them with.
- Run your tests after applying the codemods to catch anything that needs a closer look.

---

## Migration guide

The full migration guide, including documentation for every changed and removed API, is in the Big Calendar Storybook under **Docs → Migration**.

---

## Dependencies

**[`jscodeshift`](https://github.com/facebook/jscodeshift)** — An AST-based JavaScript code transformation toolkit, originally built by Facebook. It parses your source files into a syntax tree, lets you query and rewrite specific patterns in that tree, and prints the modified code back out — preserving your original formatting and comments as much as possible.

We use jscodeshift instead of regex-based find-and-replace because calendar migration patterns are structurally complex. For example, merging `startAccessor`, `endAccessor`, and `titleAccessor` into a single `accessors` prop requires understanding which props belong to the same JSX element — something a regex can't reliably do. An AST transformation can.

---

Part of the [Big Calendar](../../README.md) monorepo.

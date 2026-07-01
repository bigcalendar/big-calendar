# big-calendar — Claude instructions

## Cross-framework adapter parity

**Read `memory/ADAPTER_STANDARDS.md` before starting any of the following:**
- A new framework adapter phase
- A feature or API addition to any existing adapter
- Any change touching HTML structure, CSS classes, or Storybook wiring
- A new story or MDX doc in any framework package

That file is the authoritative reference for package aliases, story-file parity, HTML/CSS output rules, Storybook wiring (Controls, Actions, localizer toolbar, DnD), the 8-step pre-delivery verification checklist, and the storybook-site composite verification. Nothing in that checklist is optional.

---

## MDX / Storybook

**Always use `<table>` tags for tables in `.mdx` files.** Markdown table syntax
(`| col | col |`) does not render correctly in Storybook MDX. Use full HTML:

```html
<table>
  <thead>
    <tr><th>Column A</th><th>Column B</th></tr>
  </thead>
  <tbody>
    <tr><td>value</td><td>value</td></tr>
  </tbody>
</table>
```

Inside HTML table cells, use `<code>` tags instead of backticks. When a cell
must contain curly braces (e.g. a JS object literal), wrap the content in a JSX
expression to prevent the MDX parser from treating it as JSX:

```mdx
<td><code>{'{ hour: \'numeric\' }'}</code></td>
```

# big-calendar — Claude instructions

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

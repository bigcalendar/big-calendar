# Documentation

Sources: D-19, D-64, D-65, D-70, D-84, [developer experience](../spec/developer-experience.md). For prose style, see [writing.md](writing.md).

## Docs ship with the code (D-65)

A task is done only when its code, tests and docs land in the same commit. Docs are never a final step.

- **TSDoc on every exported symbol** (lint-enforced): what it does, parameters, return value, an example where useful, and a link to its docs page.
- **TSDoc on internal code** wherever its behavior or the reason for it isn't obvious (checked in review).
- **Docs-site pages** for each capability: how-to, reference and explanation, as they apply.
- **The tutorial grows each slice**, and the slice's PR shows its steps working.

## Structure (Diátaxis, D-64)

Keep the four kinds of page separate. Don't mix teaching, task steps, reference and background on one page.

| Kind        | Purpose                                                                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tutorial    | One app built step by step: events, week view, creating events, DnD, resources, recurrence                                                                                    |
| How-to      | One specific task                                                                                                                                                             |
| Reference   | Generated: TypeDoc from TSDoc into Storybook MDX for kernel, modules and hooks; Storybook's own docs for component props (D-84). Styling reference from part manifests (D-70) |
| Explanation | Ideas: time semantics, the edit model, the layers                                                                                                                             |

## Storybook and MDX

- Docs live in Storybook as runnable stories plus MDX (D-19). Every example is runnable.
- **Tables in `.mdx` files use HTML `<table>` tags**, never Markdown pipe tables, which don't render correctly in Storybook MDX:

  ```html
  <table>
    <thead>
      <tr>
        <th>Column A</th>
        <th>Column B</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>value</td>
        <td>value</td>
      </tr>
    </tbody>
  </table>
  ```

- Inside HTML table cells, use `<code>` tags instead of backticks. When a cell contains curly braces (for example a JS object literal), wrap the content in a JSX expression so the MDX parser doesn't treat it as JSX:

  ```mdx
  <td>
    <code>{"{ hour: 'numeric' }"}</code>
  </td>
  ```

## Required public pages

- An accessibility page: WCAG 2.2 AA, the relevant laws (ADA, Section 508, EAA) and known limitations (D-50).
- Styling docs as listed in D-70, growing from S1.
- Client-only usage, including turning off server rendering in frameworks like Next.js (D-41).
- The `temporal` loader installs the polyfill on `globalThis`; the docs must say so ([date engine](../spec/date-engine.md)).
- `llms.txt`, generated from the docs ([gap additions](../spec/gap-additions.md) #25).

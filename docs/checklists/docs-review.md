# Docs review

Source: [writing standard](../standards/writing.md), [documentation standard](../standards/documentation.md), D-64, D-65.

## Every page

- [ ] The page is one Diátaxis kind (tutorial, how-to, reference or explanation), not a mix.
- [ ] Prerequisites are stated at the top, with links.
- [ ] Every term is defined on first use on the page and is in the glossary.
- [ ] Sentences are short, one idea each.
- [ ] None of these words appear: "simply", "just", "obviously", "easy".
- [ ] Every example runs in Storybook.
- [ ] Tutorial steps show what changed and what the reader should now see.
- [ ] Link text names its destination.
- [ ] MDX tables use HTML `<table>` tags, with `<code>` in cells and JSX-wrapped curly braces.
- [ ] Terms match the specs and the glossary.

## Code docs

- [ ] Every exported symbol has TSDoc: what it does, parameters, return value, an example where useful, and a link to its docs page.
- [ ] Non-obvious internal code has TSDoc explaining what or why.
- [ ] Dev warnings say what went wrong, how to fix it, and link to the exact docs section.

## Coverage

- [ ] Each new capability has its how-to, reference and explanation pages, as they apply.
- [ ] The slice's tutorial steps are written and working.
- [ ] Styling docs are updated when a part, class, attribute, variable or token changes.

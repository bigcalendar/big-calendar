# Standards

Everything a tool can check lives in tooling: ESLint, Prettier, the TypeScript config and Nx boundary rules (D-46). These files hold only the short prose for what tooling can't check. Product configs arrive in S0; until then, these files are the reference.

| File                                 | Read it when you are…                                                   |
| ------------------------------------ | ----------------------------------------------------------------------- |
| [workflow.md](workflow.md)           | doing anything: execution rules, gates, ask-first list, commits, memory |
| [code.md](code.md)                   | writing or reviewing TypeScript in any package                          |
| [react.md](react.md)                 | working in `@big-calendar/react` or `@big-calendar/react-ui`            |
| [styling.md](styling.md)             | writing CSS, part manifests or anything with a `bc-*` class             |
| [testing.md](testing.md)             | writing or changing tests, coverage or benchmarks                       |
| [documentation.md](documentation.md) | writing TSDoc, stories, MDX or docs-site pages                          |
| [writing.md](writing.md)             | writing any prose a developer will read                                 |
| [agent-toolset.md](agent-toolset.md) | changing `AGENTS.md`, skills, agents, hooks or rules                    |

If a standard here conflicts with a spec in [`docs/spec/`](../spec/README.md), the spec wins. Report the conflict to the maintainer.

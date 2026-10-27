# Checklists

Checklists any person or agent can run. The Claude sub-agents in `.claude/agents/` run these same files; nothing lives only in an agent definition (D-49).

| Checklist                                          | Run it…                                                      | Claude sub-agent                   |
| -------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------- |
| [spec-review.md](spec-review.md)                   | on any change, before commit: does the code match the specs? | `spec-reviewer`                    |
| [a11y-review.md](a11y-review.md)                   | on any change to markup, machines, CSS or announcements      | `a11y-reviewer`                    |
| [test-review.md](test-review.md)                   | when writing or reviewing tests                              | `test-author`                      |
| [docs-review.md](docs-review.md)                   | on every page, TSDoc block, story or dev warning             | `docs-writer`                      |
| [slice-gates.md](slice-gates.md)                   | before opening a slice PR                                    | (main agent, `slice-finish` skill) |
| [screen-reader-script.md](screen-reader-script.md) | once per slice, by a person, with real screen readers        | (manual)                           |

**How to report.** Each item is pass, fail or not applicable. For every fail, give the file and line, the spec or decision it breaks, and a suggested fix. A checklist run never changes a spec or decides anything new; it reports.

---
name: decide
description: Handle a question no spec or decision covers, and record the maintainer's answer. Use whenever you're about to choose a name, default, behavior, dependency or rule that isn't already written down, or when changing anything in docs/spec/.
---

# Decide

Big Calendar's first rule: **no inline decisions** (`docs/standards/workflow.md` rule 1).

## 1. Check it's really new

Search before asking: `docs/spec/`, `docs/decisions.md` (search for the term and for related D-numbers), the open items register in `docs/spec/roadmap.md`, and any approved planning artifact. If it's covered, follow it and cite it. If it's an **open item** owned by a later artifact, stop: that artifact decides it, not you.

## 2. Ask

Stop the work that depends on the answer. Ask the maintainer one focused question:

- what needs deciding and why it came up (file, task);
- the options (two to four), each with its main trade-off;
- your recommendation and why;
- what's blocked until it's answered.

Work that doesn't depend on the answer may continue.

## 3. Record

Append a row to the table in `docs/decisions.md`, with the next free ID:

```
| D-NN | YYYY-MM-DD — <the decision, in one or two sentences>. <Amends D-xx, if it does.> Source: <where it was asked, e.g. "S1 kickoff, maintainer answer">. |
```

- Never edit or delete a past entry. Amend with a new one.
- If the decision changes a spec, edit the spec in the same commit and cite the new D-number there.
- If it resolves an open item, mark it resolved in `docs/spec/roadmap.md` with the D-number.
- Commit as `docs(decisions): D-NN <short summary>`.

Then continue the work.

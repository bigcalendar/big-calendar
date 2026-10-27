# Writing

Source: D-64, [developer experience](../spec/developer-experience.md). This applies to every page a developer reads: docs-site pages, TSDoc, story descriptions, dev warnings and error messages.

**The goal:** a page works for a middle-school student and a senior developer at the same time, without dumbing down or condescending.

## Rules (D-64)

1. **Short sentences.** One idea per sentence. If a sentence needs a semicolon, try two sentences.
2. **Define each term on first use** on the page, and add it to the glossary. Don't assume a reader arrived from another page.
3. **State prerequisites** at the top of every page: what the reader should know or have done first, with links.
4. **Every example runs in Storybook.** No pseudo-code, no examples that only work in your head.
5. **Tutorial steps show what changed:** the diff or the highlighted lines, and what the reader should now see.
6. **Never write "simply", "just", "obviously" or "easy".** If it were obvious, the reader wouldn't be on the page.

## Practical guidance

These help apply the rules above. They don't add new requirements.

- Lead with what the reader can do, then how.
- Prefer the concrete: a real event, a real zone (`America/New_York`), a real date.
- Use the same word for the same thing everywhere. The glossary is the authority, and the specs' terms win (an _event source_, a _lane_, a _draft_, a _change_).
- Dev warnings follow the same rules: say what went wrong, how to fix it, and link to the exact docs section (D-63).
- Write for screen-reader users too: link text names its destination ("see the time semantics page", never "click here").

## How it's enforced

Through the docs-writer [checklist](../checklists/docs-review.md) and maintainer review. There is no prose linter (D-64).

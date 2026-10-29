---
name: a11y-check
description: Run Big Calendar's accessibility review on a change. Use for any change to markup, prop-getters, interaction machines, CSS, focus handling or announcements.
---

# Accessibility check

1. Run axe on every affected story in all three engines (Playwright). Zero violations is the bar.
2. Run `docs/checklists/a11y-review.md` against the diff and the running stories. Check it against the per-family rules in `docs/spec/accessibility.md` too.
3. Use the Playwright MCP server to drive keyboard paths in a real browser: Tab order, arrow keys, Shift+Arrow, Shift+F10, Enter, Escape and focus return. Check the accessibility tree (`browser_snapshot`), not just the pixels.
4. Check forced colors (`browser_emulate_media`), 400% zoom and reduced motion.
5. Report each fail with the element, the requirement (spec section or D-number) and a fix.

You can't replace the manual screen-reader run. At the end of a slice, remind the maintainer that `docs/checklists/screen-reader-script.md` needs a person with VoiceOver and NVDA.

In Claude Code, the `a11y-reviewer` sub-agent runs the static part of this review.

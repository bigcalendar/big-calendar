# Styling

Sources: D-25, D-68 to D-72, [React and styling](../spec/react-and-styling.md). The spec is the contract; this is the working summary.

## Rules for every CSS file we ship

- All CSS sits in our cascade layers: `bc.tokens`, `bc.structure`, `bc.theme`.
- Every selector is wrapped in `:where()` for zero specificity. Unlayered app CSS must always win.
- Values come from root `--bc-*` tokens. Don't hard-code colors, spacing or typography.
- Geometry comes from the inline custom properties the kernel sets (`--bc-row-start`, `--bc-row-span`, `--bc-col`, `--bc-cols`, …). Never compute positions in CSS from anything else.
- Layout uses CSS Grid and subgrid. Responsive behavior uses container queries on the calendar root, with documented breakpoint values.
- No styles set through `innerHTML` or style strings; the CSSOM only (strict CSP).

## Where CSS lives

- CSS Modules next to each `react-ui` component. A component's CSS ships only when the component renders.
- Each element carries its hashed module class **and** its stable `bc-*` class. The `bc-*` class comes from the prop-getter (D-72).
- State is a data attribute (`data-state="selected"`, `data-invalid`, edge flags), never a class.
- Feature modifiers on shared parts are data attributes emitted only by the registered feature (`data-draggable`, `data-resizable="end"`). The feature's own CSS Module selects on them.
- The same sources compile a second time to `@big-calendar/styles`, with stable `.bc-*` selectors, per part, plus `tokens.css`. One source; never fork the CSS.

## Manifests

- Every part ships a typed manifest of its `bc-*` class, `data-*` attributes and CSS variables (D-25). A new class, attribute or variable isn't done until it's in the manifest.
- The manifests generate the styling reference docs, so they must stay complete.

## Accessibility checks that touch CSS

Forced colors, 400% zoom reflow and reduced motion are checked every slice ([gap additions](../spec/gap-additions.md) #14). Event text color is computed to meet WCAG contrast (#13).

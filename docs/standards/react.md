# React

Sources: D-06, D-41, D-46, D-47, [architecture](../spec/architecture.md), [React and styling](../spec/react-and-styling.md).

## Both React packages

- React 19+. `ref` is a normal prop, so there is no `forwardRef` (D-46).
- The React Compiler compiles the published `react` and `react-ui` packages, and its ESLint rules run in CI (D-47). **Don't write manual `useMemo`, `useCallback` or `memo`.** Write code the compiler can optimize instead.
- Components are render-first: the component body renders, and one composed props hook prepares everything it needs (D-46).
- Every component sets `displayName` (D-46).
- Client-side only (D-41). Prebuilt UI components carry `'use client'` only so React Server Component frameworks can import them.

## `@big-calendar/react` (the binding)

- About **600 lines** of source, excluding types and tests, measured in CI. This is a hard rule ([binding budget](../spec/architecture.md#the-binding-budget-hard-rule)).
- **May:** subscribe to signals, map them into React state, apply the machines' prop-getters, normalize event names, provide context, and pass the latest options to `calendar.setOptions()` on every render (D-55).
- **May not:** keyboard handling, focus logic, hit-testing, timers or state machines. If a behavior seems to need any of these, stop and raise it with the maintainer.

## `@big-calendar/react-ui` (prebuilt UI)

- Markup and composition only. **No behavior logic** (enforced by lint).
- Slots are `render` (replace the element; the getters must be spread onto it) or `wrap` (decorate an element the library owns).
- Class names are composed with `clsx`: the hashed module class, the getter's `bc-*` class, and the developer's `className` (D-71).
- Feature-specific parts live in per-feature entry points (for example `@big-calendar/react-ui/dnd`) and are used only when the feature is registered (D-71).
- No component renders `descriptionHtml` or any other HTML field.

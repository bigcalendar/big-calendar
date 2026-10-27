---
paths:
  - 'packages/react/**'
  - 'packages/react-ui/**'
---

Follow `docs/standards/react.md`. `@big-calendar/react` is held to about 600 lines with no behavior; `react-ui` has no behavior logic. No manual `useMemo`, `useCallback` or `memo` (the React Compiler handles it).

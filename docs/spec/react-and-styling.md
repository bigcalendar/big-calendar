# React: binding, prebuilt UI, styling

> **Normative.** Split verbatim from the approved plan (`plan/P1-PLAN.md` §11, approved 2026-10-27). Changing anything here needs a new entry in the [decision log](../decisions.md).

- **React 19+.** `@big-calendar/react` is the budgeted binding; `@big-calendar/react-ui` is the prebuilt UI.
- **The prebuilt UI has two kinds of slot:**
  - **`render` slots** replace the element and receive prop-getters that must be spread onto it. A dev-mode check warns when roles or handlers are missing.
  - **`wrap` slots** decorate an element the library owns, and cannot break behavior.
- **Slot names are all new.** A published mapping table links each RBC `components` key to its replacement.
- **Styling contract (D-68).** Developers may style with any method or library: a global stylesheet, CSS Modules, any CSS-in-JS library, a utility framework, or none of ours at all. Docs assume no particular tool.
  - **Hooks:** a stable `bc-*` base class on every part (`bc-time-grid`, `bc-event`), and state as data attributes (`data-state="selected"`, edge flags).
  - **Always lower priority than app CSS.** All our CSS lives in cascade layers (`bc.tokens`, `bc.structure`, `bc.theme`), with selectors in `:where()` for zero specificity. Any unlayered app style wins, whatever its specificity. The docs explain how to order layers for any library that also uses cascade layers.
  - **Root tokens.** `--bc-*` custom properties on the calendar root cover colors, spacing, typography, slot height, gutter width and so on, overridable at any level.
  - **Structural CSS we ship:** CSS Grid and subgrid view structures, event placement, and responsive behavior through container queries on the calendar root. Breakpoints are documented values, because custom properties can't be used inside `@container` conditions.
  - **Geometry as inline variables.** The kernel's positions reach the DOM as inline custom properties on each element (for example `--bc-row-start`, `--bc-row-span`, `--bc-col`, `--bc-cols`). Our structural CSS reads them, and developers who replace it read the same variables. The values are the contract, not our selectors.
  - **CSS is as modular as the features (D-69).**
    - **Authored as CSS Modules** next to each `react-ui` component, and therefore included **automatically and only when that component renders**. Unused families and parts ship no CSS.
    - **Class names.** Each element carries the hashed module class (used by our styles) **and** its stable `bc-*` class (for developers).
    - **Always overridable,** because module CSS still sits in our cascade layers with zero specificity.
    - **Bundler requirement.** Apps need a bundler that handles CSS imports, which every mainstream client bundler does; the docs say so. Packages declare `*.css` as side effects (D-63).
  - **Feature-conditional styles (D-71).**
    - **Feature-specific UI** (resize handles, drag previews, selection highlight, recurrence indicators, the Unassigned lane, …) consists of separate `react-ui` parts with their own CSS Modules. They're exported from per-feature entry points (for example `@big-calendar/react-ui/dnd`) and used only when that feature is registered, so an unregistered feature ships neither JS nor CSS.
    - **Feature-dependent modifiers on shared parts are data attributes** (for example `data-draggable` and `data-resizable="end"`), emitted only by registered features (D-72). The feature's CSS Module selects on them, for example `.event[data-resizable]`.
    - **`clsx`** (an approved dependency) composes each element's classes in `react-ui`: the hashed module class, the getter's `bc-*` class, and the developer's `className`.
  - **Styling documentation (D-70)** is part of the public `react-ui` docs and grows slice by slice from S1 (rule 8):
    - **Overview:** how CSS ships with components, the `bc-*` classes, data-attribute state, root tokens and geometry variables.
    - **Overriding with cascade layers:** our layer order, why unlayered app CSS always wins, how to place app styles in a layer above ours, and how to order layers when another library also uses them. It's written generally, with no particular tool assumed.
    - **Examples in several methods:** a global stylesheet, CSS Modules, and CSS-in-JS.
    - **Reference generated from the part manifests (D-25):** every part's class, data attributes and CSS variables, plus every token with its default.
    - **Headless styling** with `@big-calendar/styles`.
  - **One source, two outputs.** The same module sources are compiled a second time with stable `.bc-*` selectors and published per part, plus `tokens.css`, as `@big-calendar/styles`. That's for headless users who write their own markup with `bc-*` classes, and it's entirely optional for them.
- **Every part ships a typed manifest** of its `bc-*` class, `data-*` attributes and CSS variables. The manifests are the styling contract and generate the styling docs.
- **Edge flags.** Events clipped by the visible range or the `min`/`max` window carry `data-starting-before-edge` and `data-ending-after-edge`.
- **Extra prebuilt UI at 1.0:**
  - a **mini calendar**, which is a day-grid configuration;
  - a **resource panel** with the `parentId` hierarchy as a collapsible tree and show/hide controls;
  - **compact touch views** (1, 3 and 7 days), which are time-grid configurations;
- **Display settings are app-controlled props** (D-56): for example `hiddenDays` (which replaces `showWeekends`, D-75), `showWeekNumbers` and `hourCycle`. There's no preferences menu and no library-owned preferences state. Apps that want a user-facing settings menu build it and pass the values down.
- **Docs live in Storybook**, as runnable stories plus MDX. MDX tables use HTML `<table>` per the repo rules.

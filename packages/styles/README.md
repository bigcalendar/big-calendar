# @big-calendar/styles

The CSS for Big Calendar. This package includes everything the calendar needs to look right: a CSS reset scoped to calendar elements, design tokens (CSS custom properties), layout rules, and component-level styles.

Everything is organized into layers using the CSS `@layer` rule, which means Big Calendar's styles have a predictable specificity that's easy to override in your own stylesheet.

---

## Installation

```bash
pnpm add @big-calendar/styles
```

---

## Usage

The simplest option is to import the full stylesheet:

```js
import '@big-calendar/styles/index.css'
```

Or, import only the layers you need:

```js
import '@big-calendar/styles/reset.css'    // scoped reset
import '@big-calendar/styles/tokens.css'   // --bc-* custom properties
import '@big-calendar/styles/layout.css'   // structural layout
```

Individual component stylesheets are also available:

```js
import '@big-calendar/styles/components/toolbar.css'
import '@big-calendar/styles/components/month.css'
import '@big-calendar/styles/components/timegrid.css'
```

---

## Customizing with design tokens

Big Calendar exposes its visual decisions as CSS custom properties (`--bc-*`). Override them on `:root` or on any ancestor element to change colors, spacing, fonts, and more without touching the library's source.

```css
:root {
  --bc-event-bg: #4f46e5;
  --bc-event-color: #ffffff;
  --bc-today-bg: #f0fdf4;
  --bc-border-color: #e5e7eb;
}
```

All available tokens are defined in [`src/tokens.css`](src/tokens.css).

---

## CSS layers

Big Calendar uses `@layer` to keep its styles from fighting with yours. The layers, in order of lowest to highest specificity:

| Layer | What it covers |
|---|---|
| `bc-reset` | Scoped box-model and baseline resets |
| `bc-tokens` | CSS custom property definitions |
| `bc-layout` | Grid and flex structure for the calendar shell |
| `bc-components` | Individual view and component styles |

Any CSS you write outside of a layer automatically wins over everything in these layers, so overriding Big Calendar styles doesn't require `!important` or specificity tricks.

---

## Dependencies

None. This package is pure CSS with no JavaScript, no build-time preprocessor dependencies, and no runtime requirements.

---

## How this differs from react-big-calendar

**react-big-calendar shipped one flat CSS file.** There were no design tokens, no custom properties, and no documented way to override the styles without fighting specificity or reaching for `!important`. The recommended approach was to copy the file and edit it directly — which meant your changes broke on every upgrade.

Big Calendar uses CSS custom properties (`--bc-*`) as the primary customization surface. Override tokens on `:root` or any ancestor element and your changes automatically propagate to every component that uses them. No copied files, no specificity fights.

**CSS `@layer` makes overrides predictable.** All of Big Calendar's styles are wrapped in named layers. Any CSS you write *outside* a layer automatically has higher specificity than anything inside one — so a plain selector in your own stylesheet always beats Big Calendar's styles, no `!important` required.

**The support floor is Baseline 2024, not IE11.** react-big-calendar was written when Internet Explorer 11 was still a real target. Its CSS reflected that — flexbox-heavy with careful fallbacks and no use of modern layout features. Big Calendar targets browsers released in 2024 or later and uses modern CSS unconditionally: CSS subgrid for month and all-day row alignment, the `Popover` API for top-layer elements, CSS logical properties (`padding-inline`, `inset-inline-start`, etc.) for layout, and `@container` queries for responsive behavior.

**RTL support is built into the CSS, not a prop.** react-big-calendar had an `rtl` prop that you passed to `<Calendar>` to enable right-to-left layout. Big Calendar has no such prop. Instead, it uses CSS `:dir()` and logical properties, which respond automatically to the `dir` attribute on the document or any ancestor element. Set `<html dir="rtl">` and the calendar flips — no prop, no re-render.

---

Part of the [Big Calendar](../../README.md) monorepo.

# P3 vanilla prototype

A plain HTML, CSS and JavaScript calendar used to test the P3 accessibility spec ([`plan/P3-ACCESSIBILITY.md`](../../plan/P3-ACCESSIBILITY.md)) with real screen readers. Throwaway planning code: no framework, no build step, no dependencies, and nothing from it is reused in the product.

## Run it

```sh
node serve.mjs          # http://localhost:4800/
```

Start pages: `?view=month`, `?view=week`, `?view=week&date=2026-11-01` (fall-back DST week), `?view=week&date=2026-03-08` (spring-forward week). "Today" is fixed at Wednesday, October 28, 2026, and the display zone is America/New_York.

The "App callbacks" panel logs what an app would receive (`onSelectSlot`, `onSelectEvent`, `onEventDrop`, …). Messages prefixed "App:" in the live region stand in for what an app would do with them.

## Automated checks

With the server running: `cd tests && npm install && npx playwright install chromium firefox webkit`, then

- `node axe.mjs`: axe (WCAG 2.2 A/AA and best practices) on Chromium, Firefox and WebKit, normal and forced colors, 1280px and 320px, over the month, week and both DST weeks, plus the popover, menu and move states;
- `node keys-tour.mjs` and `node keys-move.mjs`: scripted keyboard paths, printing the focused element's name and the live-region text after each step.

## Layout

| File                            | Layer in the product                                                 |
| ------------------------------- | -------------------------------------------------------------------- |
| `js/machines/grid.js`           | `interactions`: grid navigation, hops, selection ranges              |
| `js/machines/events.js`         | `interactions`: the event group, ordering (D-59), Tab entry point    |
| `js/machines/move-fsm.js`       | `interactions`: keyboard and single-pointer move, O-6 candidate (a)  |
| `js/model.js`                   | `core`: view models with index positions (D-54), slots, DST, packing |
| `js/names.js`, `js/messages.js` | `core`: the event-name composer and `messages` (D-40, D-50)          |
| `js/live.js`                    | `interactions`: the debounced live region                            |
| `js/props.js`, `js/sync.js`     | a binding: applies `{ attrs, on }` descriptors, keyed reuse of nodes |
| `js/view-*.js`, `styles.css`    | prebuilt UI: markup and CSS only                                     |
| `js/app.js`                     | glue for the prototype                                               |

## Known simplifications

- Dates are `YYYY-MM-DD` strings and wall-clock minutes; DST days come from a fixed table (`js/data.js`). The product uses Temporal.
- Popovers are positioned with JavaScript everywhere, not CSS anchor positioning.
- Pointer drag-to-move isn't built; the single-pointer path (Move from the menu, then click a slot) is.
- Event changes are committed after a fixed 1.5-second "app" delay.

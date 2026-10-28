# Code

Sources: D-21, D-46, D-63, [architecture](../spec/architecture.md). Lint enforces most of this from S0.

## Language and modules

- Strict TypeScript, ESM only. Source is ESNext, compiled to ES2025 (D-21). Compiling rewrites syntax only, so any runtime built-in newer than ES2025 needs a P2 support-matrix entry with a polyfill or fallback.
- Every package is side-effect-free except the CSS and the `temporal` loader (D-63).
- Respect the dependency direction in [architecture](../spec/architecture.md#package-map). The kernel depends on nothing in the workspace. Nx boundary rules enforce it; never disable them.
- The kernel (`core`) has no DOM code, so it runs in tests and web workers (D-41).

## File naming (D-46)

| Suffix           | Holds                                                  |
| ---------------- | ------------------------------------------------------ |
| `.component.tsx` | One React component                                    |
| `.hook.ts`       | One hook                                               |
| `.function.ts`   | One function, or a small group of closely related ones |
| `.type.ts`       | Types only                                             |
| `.constant.ts`   | Constants only                                         |

## Functions (D-46)

- Use function declarations, not arrow functions assigned to constants, for named functions.
- A function with more than one argument takes a single object parameter.

## Structure (D-46)

- Folder per component, with an `index.ts` barrel.
- Barrels re-export; they hold no logic. (D-85)

## Development warnings (D-63)

- Development-only warnings explain the problem and the fix, and link to the exact docs section.
- They are stripped from production builds.
- Invalid input never throws from the kernel. It is skipped and reported through `onDataIssue` and the dev console ([data model](../spec/data-model.md)).

## Security

- No `innerHTML`. Styles are set through the CSSOM only. The code must work under a strict CSP with Trusted Types ([gap additions](../spec/gap-additions.md) #15).
- HTML-bearing fields are `UntrustedHtml`. Nothing in Big Calendar sanitizes or renders them ([event fields](../spec/event-fields.md)).

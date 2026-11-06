# Code

Sources: D-21, D-46, D-63, [architecture](../spec/architecture.md). Lint enforces most of this from S0.

## Language and modules

- Strict TypeScript, ESM only. Source is ESNext, compiled to ES2025 (D-21). `tsconfig.base.json` adds to `strict`: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature` and `verbatimModuleSyntax`. TypeScript is 6.0 (D-97). Compiling rewrites syntax only, so any runtime built-in newer than ES2025 needs a P2 support-matrix entry with a polyfill or fallback.
- Every package is side-effect-free except the CSS and the `temporal` loader (D-63).
- `tools/size` proves both on the built packages: no built file may hold syntax newer than ES2025, and importing a package for its side effects alone must bundle to nothing. It also proves the React packages build with the React Compiler (D-47). Each check has a fixture showing it catches a failure.
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

## Lint

`eslint.config.mjs` enforces the rules above: the layer boundaries (Nx tags `layer:*` on each project), the D-46 rules (`func-style`, and the local rules in `tools/eslint-rules`: one object parameter, file suffixes, `displayName`, TSDoc on exports), the binding and `react-ui` limits, and the HTML-sink ban. `tools/fixtures` holds code that breaks each rule, and its test proves each one fails. When you add a rule, add a fixture for it.

The one-object-parameter rule applies to functions we declare and name. Inline callbacks passed to another API (`sort((a, b) => …)`, `reduce`) take the parameters their caller defines (D-102), and function types aren't checked: their signatures come from the [types and public API](../spec/api.md) spec.

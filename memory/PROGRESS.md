# PROGRESS

> Read this first on every restart (Appendix B.4). Then continue from "Next".

## Current phase

**Phase 1 — Localizer + spikes** (in progress)

## How to resume

- **Branch:** `feat/initial` (all baseline work lands here; no PRs — user merges manually). Pushed to `origin/feat/initial`.
- **Install:** `pnpm install` at repo root.
- **Verify:** `pnpm exec nx run-many -t lint typecheck test build` (all green as of latest commit).
- **Coverage:** per-file bar 85% branch / 95% function (Vitest `perFile`).
- **Next:** finish **Task 1b** — implement `@big-calendar/localizer-temporal` per the fully-worked plan in
  "In progress" below. The polyfill dep is already installed; no re-probing needed — just write the files.

> ⏸️ **PAUSED 2026-06-01** mid-Task-1b for a VS Code restart. Task 1a is committed + pushed. Task 1b
> only has its dependency added (`temporal-polyfill@0.3.2`) — **no source written yet**. The complete
> implementation design (verified against `temporal-spec@0.3.1`) is captured below so the next session
> implements directly.

## Done

### Phase 0 — Foundations ✓ (committed, pushed)

- Repo + workspace config, Nx (Cloud OFF) + Nx Release, TS base, ESLint flat config with
  `@nx/enforce-module-boundaries` scope graph, commitlint + Husky, Vitest workspace, 4 CI workflows,
  8 package scaffolds. All gates green; module-boundary enforcement verified.

### Phase 1 — Task 1a: `@big-calendar/localizer` base ✓ (this commit)

- **`src/types/localizer.type.ts`** — full string-in/string-out `LocalizerContract`, `LocalizerOptions`,
  `DateParts`, `DateTimeUnit`/`FixedUnit`, `FormatKey`/`FormatMap`, `CompareArgs`, `DateRange`, `TimeParts`.
- **`src/ponyfills/weekInfo.function.ts`** — `getWeekInfo(locale)`: native `Intl.Locale` week API when
  present, else compact CLDR region table (Sunday/Saturday-first sets, Fri/Sat weekend set).
- **`src/ponyfills/durationFormat.function.ts`** — `formatDuration(...)`: native `Intl.DurationFormat`
  when present, else `Intl.NumberFormat` unit + `Intl.ListFormat` fallback.
- **`src/constants/formats.constant.ts`** — `DEFAULT_FORMATS` (overridable named Intl option sets).
- **`src/localizer.class.ts`** — abstract `Localizer<T>` implementing the entire contract on top of a
  small `protected abstract` primitive set (`parse/serialize/toEpochMs/getParts/addUnits/startOfUnit/
  endOfUnit/diffUnits/withTime/offsetMinutes`). Subclasses only supply those primitives.
- Tests: 44 cases via a UTC `TestLocalizer` fixture + ponyfill suites. Coverage 95.78% branch /
  100% function. Lint + typecheck + build green.

## In progress

### Task 1b — `@big-calendar/localizer-temporal` (design ready; implement next)

**Done so far:** added dep `temporal-polyfill@0.3.2` (in `packages/localizer-temporal/package.json`).
Probed the runtime + types: namespace `Temporal` exported as a value; `dt.toString()` →
RFC 9557 bracket form, `dt.toString({ timeZoneName: 'never' })` → RFC 3339 offset form;
`offsetNanoseconds` is east-positive; `TimeZoneLike = string | ZonedDateTime`.

**Files to create under `packages/localizer-temporal/src/` (remove `smoke.test.ts`):**

1. **`loadTemporal.function.ts`** — lazy loader:
   ```ts
   import type { Temporal } from 'temporal-polyfill'
   export type TemporalAPI = typeof import('temporal-polyfill').Temporal
   let cached: TemporalAPI | undefined
   export async function loadTemporal(): Promise<TemporalAPI> {
     if (cached) return cached
     const native = (globalThis as { Temporal?: TemporalAPI }).Temporal
     cached = native ?? (await import('temporal-polyfill')).Temporal
     return cached
   }
   ```
   ⚠️ If `typeof import('temporal-polyfill').Temporal` won't resolve as a *value* type, fall back to a
   hand-written `TemporalAPI` interface typing only the constructors used (`Instant`, `ZonedDateTime`,
   `PlainDate`). Verify with `nx run localizer-temporal:typecheck`.

2. **`localizer-temporal.class.ts`** — `TemporalLocalizer extends Localizer<Temporal.ZonedDateTime>`;
   `constructor(options: LocalizerOptions = {}, private readonly api: TemporalAPI) { super(options) }`
   (super never calls primitives, so `api` is set before any primitive runs). Primitives, all verified:
   - `PLURAL = { year:'years', month:'months', week:'weeks', day:'days', hour:'hours', minute:'minutes', second:'seconds', millisecond:'milliseconds' }`
   - `parse(v)`: `v.includes('[')` → `api.ZonedDateTime.from(v).toInstant().toZonedDateTimeISO(this.timezone)`;
     else `!/[T ]/.test(v)` (date-only) → `api.PlainDate.from(v).toZonedDateTime(this.timezone)`;
     else → `api.Instant.from(v).toZonedDateTimeISO(this.timezone)`. (Always normalized to `this.timezone`.)
   - `serialize(dt)`: `this.extendedZone ? dt.toString() : dt.toString({ timeZoneName: 'never' })`
   - `toEpochMs(dt)`: `dt.epochMilliseconds`
   - `getParts(dt)`: `{ year,month,day,hour,minute,second,millisecond, weekday: dt.dayOfWeek }`
   - `addUnits(dt,n,u)`: `dt.add({ [PLURAL[u]]: n } as Temporal.DurationLike)`
   - `startOfUnit(dt,u)`: year→`dt.with({month:1,day:1}).startOfDay()`; month→`dt.with({day:1}).startOfDay()`;
     day→`dt.startOfDay()`; else `dt.round({ smallestUnit: u, roundingMode: 'floor' })` (u narrows to hour/min/sec/ms)
   - `endOfUnit(dt,u)`: `this.addUnits(this.startOfUnit(dt,u),1,u).subtract({ milliseconds: 1 })`
   - `diffUnits(a,b,u)`: `a.since(b,{ largestUnit:u, smallestUnit:u, roundingMode:'trunc' })[PLURAL[u]]`
   - `withTime(dt,t)`: `dt.with({ hour:t.hour, minute:t.minute, second:t.second??0, millisecond:t.millisecond??0, microsecond:0, nanosecond:0 })`
   - `offsetMinutes(dt)`: `dt.offsetNanoseconds / 60_000_000_000`

3. **`index.ts`** — `export const PACKAGE_NAME = '@big-calendar/localizer-temporal'`; export `TemporalLocalizer`;
   `export async function createTemporalLocalizer(options?: LocalizerOptions) { return new TemporalLocalizer(options, await loadTemporal()) }`

4. **`localizer-temporal.class.test.ts`** — `const loc = await createTemporalLocalizer({ locale:'en-US', timezone:'America/New_York' })` in `beforeAll`. Cover:
   DST → `getTimezoneOffset('2026-01-15T12:00:00-05:00')`=300, July=240, `getDstOffset` across 2026-03-08 = 60;
   `extendedZone:true` serialize round-trips the `[America/New_York]` bracket, false → offset only;
   date-only parse `'2026-06-03'` → NY midnight; plus representative contract behaviors (startOfWeek/visibleDays/add/diff/sortEvents) for branch coverage. Bar: 85% branch / 95% function per file.

## Next

1. Finish **Task 1b** above → gates green → conventional commit `feat(localizer-temporal): ...` → push.
2. **Task 1c** — Phase 1 browser spike: subgrid + Popover API + CSS anchor-positioning + `:dir()`
   support matrix; commit a spike report to `memory/`. (Closes Phase 1 exit criteria.)
3. Then `/compact` and start Phase 2 (core engine).

## Notes / watch-items

- Toolchain pinned to latest stable at scaffold time: nx 22, TS 6, Vite 8, Vitest 4, ESLint 10,
  typescript-eslint 8.60.
- npm `@big-calendar` org + `NPM_TOKEN` and Pages secrets are the USER's setup step before the
  release/docs workflows can publish/deploy.
- **weekday convention:** ISO-8601 `1=Mon … 7=Sun` everywhere (matches Temporal `dayOfWeek`).
- **Temporal polyfill weight** (plan §15.10): monitor bundle impact; lazy-load where native.

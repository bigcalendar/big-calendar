// Registered features (D-52): what a feature adds to the options, state, instance and types.

/** A prerequisite: at least one of `anyOf` must be registered too. */
export interface Requirement {
  anyOf: string
  message: string
}

/** Everything a feature contributes, at the type level only. */
export interface FeatureSpec {
  name: string
  /** The key its options are grouped under (D-61). Usually `name`; see `resources`. */
  optionsKey: string
  /** `never` when the feature has no options. */
  options: object
  /** State slices it adds (D-53), each getting `defaultX`, `x`, `onXChange` and an atom binding. */
  state: object
  /** Members it adds to the calendar instance. */
  api: object
  requires: readonly Requirement[]
}

/** A feature value, such as `timeGrid`. The spec is phantom: it exists for the types only. */
export interface Feature<S extends FeatureSpec = FeatureSpec> {
  readonly name: S['name']
  readonly '~spec'?: S
}

/**
 * Every feature any installed package declares, by name. Packages add themselves with declaration
 * merging, so options of a known but unregistered feature give an error that names it (D-63).
 */
export interface FeatureRegistry {}

export type FeatureMap = Record<string, Feature<any>>
export type SpecOf<T> = T extends Feature<infer S> ? S : never
export type Specs<F extends FeatureMap> = SpecOf<F[keyof F]>
export type Names<F extends FeatureMap> = Specs<F>['name']
export type Has<F extends FeatureMap, N extends string> = [
  Extract<Names<F>, N>,
] extends [never]
  ? false
  : true

export type UnionToIntersection<U> = (
  U extends unknown ? (x: U) => void : never
) extends (x: infer I) => void
  ? I
  : never

export type FamilyName = 'dayGrid' | 'timeGrid' | 'timeline' | 'agenda'

type UnmetMessages<F extends FeatureMap> =
  | {
      [K in keyof F]: SpecOf<F[K]>['requires'][number] extends infer R
        ? R extends Requirement
          ? [Extract<Names<F>, R['anyOf']>] extends [never]
            ? R['message']
            : never
          : never
        : never
    }[keyof F]
  | (Has<F, FamilyName> extends true
      ? never
      : 'Register at least one view family: dayGrid, timeGrid, timeline or agenda')

/** `unknown` when every prerequisite is met; otherwise a required property whose name is the message. */
export type CheckFeatures<F extends FeatureMap> = [UnmetMessages<F>] extends [
  never,
]
  ? unknown
  : { readonly [M in UnmetMessages<F>]: never }

/**
 * The checked feature set. A wrapper, not `F & brand`: inferring `F` through an intersection loses
 * the feature types when TypeScript types callbacks such as `onSelectionChange`.
 */
export interface CalendarFeatures<F extends FeatureMap> {
  readonly features: F
}

/** `calendarFeatures({ dayGrid, timeGrid, dnd })`. Prerequisites are checked here, at compile time. */
export declare function calendarFeatures<const F extends FeatureMap>(
  features: F & CheckFeatures<F>,
): CalendarFeatures<F>

/** Options of features that are installed but not registered: assigning anything is an error naming the feature. */
export type UnregisteredOptions<F extends FeatureMap> = {
  [
    N in Exclude<keyof FeatureRegistry, Names<F>> as SpecOf<
      FeatureRegistry[N]
    >['optionsKey']
  ]?: {
    readonly [
      M in `Register the ${N & string} feature to use these options`
    ]: never
  }
}

export type FeatureOptions<F extends FeatureMap> = {
  [
    S in Specs<F> as [S['options']] extends [never] ? never : S['optionsKey']
  ]?: S['options']
}

export type StateKeys<F extends FeatureMap> =
  Specs<F> extends infer S
    ? S extends FeatureSpec
      ? keyof S['state']
      : never
    : never
export type StateValue<F extends FeatureMap, K> =
  Specs<F> extends infer S
    ? S extends { state: { [P in K & PropertyKey]: infer T } }
      ? T
      : never
    : never

/** A plain mapped type, not a union-to-intersection, so `onSelectionChange` and the like get contextual types. */
export type FeatureState<F extends FeatureMap> = {
  [K in StateKeys<F>]: StateValue<F, K>
}
export type FeatureApi<F extends FeatureMap> = UnionToIntersection<
  Specs<F>['api']
>

/** Every slice any installed feature adds, and the feature that adds it. Fixed keys, so callbacks get contextual types. */
export type KnownSlices = {
  [N in keyof FeatureRegistry as keyof SpecOf<FeatureRegistry[N]>['state']]: N
}
/** A slice's value when its feature is registered, else a type that names the feature. */
export type SliceValue<F extends FeatureMap, K extends keyof KnownSlices> =
  K extends StateKeys<F>
    ? StateValue<F, K>
    : {
        readonly [
          M in `Register the ${KnownSlices[K] & string} feature to use ${K & string}`
        ]: never
      }

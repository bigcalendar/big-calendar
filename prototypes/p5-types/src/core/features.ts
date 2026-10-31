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
  /** Flat props it unlocks: keys of `FlatPropRegistry` (data inputs, callbacks). `never` for none. */
  flat: string
  /** Which of those become required once it's registered, such as `resolveRecurringScope` (D-30). */
  required: string
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

/**
 * Feature options, grouped under each feature's options key (D-61). Keys come from every installed
 * feature, never from `F`; a registered feature's key takes its options, an unregistered one's takes
 * a type naming the feature (D-63). Keys taken from `F` break contextual typing for every callback
 * in the options object, not only these.
 */
export type FeatureOptions<F extends FeatureMap> = {
  [
    N in keyof FeatureRegistry as [
      SpecOf<FeatureRegistry[N]>['options'],
    ] extends [never]
      ? never
      : SpecOf<FeatureRegistry[N]>['optionsKey']
  ]?: N extends Names<F>
    ? SpecOf<FeatureRegistry[N]>['options']
    : {
        readonly [
          M in `Register the ${N & string} feature to use these options`
        ]: never
      }
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

/**
 * The types of flat props that features unlock, with the calendar's meta types. Packages add their
 * entries by declaration merging, next to their `FeatureRegistry` entry.
 */
export interface FlatPropRegistry<TEventMeta, TResourceMeta> {}

/** Every flat prop any installed feature unlocks, and the feature that unlocks it. */
export type KnownFlat = {
  [N in keyof FeatureRegistry as SpecOf<FeatureRegistry[N]>['flat']]: N
}
type FlatKeys<F extends FeatureMap> = Specs<F>['flat']
type RequiredKeys<F extends FeatureMap> = Specs<F>['required']
type FlatType<K, EM, RM> = K extends keyof FlatPropRegistry<EM, RM>
  ? FlatPropRegistry<EM, RM>[K]
  : never

/**
 * Flat props from features. Keys are fixed (every installed feature's), values depend on `F`, for
 * the same contextual-typing reason as the slices. Required ones are added by `RequiredFlatProps`.
 */
export type FlatProps<F extends FeatureMap, EM, RM> = {
  [K in keyof KnownFlat]?: K extends FlatKeys<F>
    ? FlatType<K, EM, RM>
    : // Inlined, not an alias, so the error shows the message rather than the alias name.
      {
        readonly [
          M in `Register the ${KnownFlat[K] & string} feature to use ${K & string}`
        ]: never
      }
}
/** Every flat prop any installed feature makes required, and that feature. Fixed keys. */
type KnownRequired = {
  [N in keyof FeatureRegistry as SpecOf<FeatureRegistry[N]>['required']]: N
}
/**
 * Required flat props. Each is its own conditional piece with a fixed key: a mapped type keyed by
 * `RequiredKeys<F>` breaks contextual typing for every callback in the options object.
 */
export type RequiredFlatProps<
  F extends FeatureMap,
  EM,
  RM,
> = UnionToIntersection<
  {
    [K in keyof KnownRequired]: K extends RequiredKeys<F>
      ? { [P in K]-?: FlatType<K, EM, RM> }
      : unknown
  }[keyof KnownRequired]
>

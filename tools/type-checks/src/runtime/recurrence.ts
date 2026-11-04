// A stand-in feature package: proves a package outside core can register a feature and its flat
// props by augmenting @big-calendar/core, as @big-calendar/recurrence will (api.md section 1.3).
import type { Change, Feature, RecurringScope } from '@big-calendar/core'

export interface RecurrenceOptions {
  /** How far past the visible range occurrences are expanded, for "+N more" and agenda. Default `P0D`. */
  expansionMargin?: string
}
export type RecurrenceFeature = Feature<{
  name: 'recurrence'
  optionsKey: 'recurrence'
  options: RecurrenceOptions
  state: {}
  api: {}
  flat: 'resolveRecurringScope'
  required: 'resolveRecurringScope'
  requires: []
}>
export declare const recurrence: RecurrenceFeature

declare module '@big-calendar/core' {
  interface FeatureRegistry {
    recurrence: RecurrenceFeature
  }
  interface FlatPropRegistry<TEventMeta, TResourceMeta> {
    /**
     * Required with recurrence (D-30): the app decides the scope of every change to a series; there's
     * no built-in prompt. `false` cancels the change.
     */
    resolveRecurringScope: (
      change: Change<TEventMeta>,
    ) => RecurringScope | false | Promise<RecurringScope | false>
  }
}
